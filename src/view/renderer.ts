import vertexShader from "./shaders/vertex.wgsl";
import fragmentShader from "./shaders/fragment.wgsl";
import computeShader from "./shaders/compute.wgsl";
import { RenderData } from "../model/definitions";

export class Renderer {

    canvas: HTMLCanvasElement;

    // Device/Context objects
    adapter: GPUAdapter;
    device: GPUDevice;
    context: GPUCanvasContext;
    format : GPUTextureFormat;

    // Pipeline objects
    pipeline: GPURenderPipeline;
    bindGroup: GPUBindGroup;
    bindGroupLayout: GPUBindGroupLayout;

    // Depth Stencil stuff 
    depthStencilState: GPUDepthStencilState;
    depthStencilBuffer: GPUTexture;
    depthStencilView: GPUTextureView;
    depthStencilAttachment: GPURenderPassDepthStencilAttachment;

    // Compute shader setup
    computePipeline: GPUComputePipeline;
    computeBindGroupLayout: GPUBindGroupLayout;
    workBindGroup: GPUBindGroup;
    workBuffer: GPUBuffer;
    resultBuffer: GPUBuffer;
    input: Float32Array;

    constructor(canvas: HTMLCanvasElement){
        this.canvas = canvas;
    }

    async Initialize() {

        await this.setupDevice();

        await this.makeDepthBufferResources();

        await this.makePipeline();

        await this.makeBindGroups();

        await this.computeSetup();
    }

    async setupDevice() {

        //adapter: wrapper around (physical) GPU.
        //Describes features and limits
        this.adapter = <GPUAdapter> await navigator.gpu?.requestAdapter();
        //device: wrapper around GPU functionality
        //Function calls are made through the device
        this.device = <GPUDevice> await this.adapter?.requestDevice();
        //context: similar to vulkan instance (or OpenGL context)
        this.context = <GPUCanvasContext> this.canvas.getContext("webgpu");
        this.format = "bgra8unorm";
        this.context.configure({
            device: this.device,
            format: this.format,
            alphaMode: "opaque"
        });

    }

    async makeDepthBufferResources() {
        /* Depth Stencil State */
        this.depthStencilState = {
            format: "depth24plus-stencil8",
            depthWriteEnabled: true,
            depthCompare: "less-equal",
        };

        /* Depth Stencil Buffer */
        const size: GPUExtent3D = {
            width: this.canvas.width,
            height: this.canvas.height,
            depthOrArrayLayers: 1
        };
        const depthStencilBufferDescriptor: GPUTextureDescriptor = {
            size: size,
            format: "depth24plus-stencil8",
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        }
        this.depthStencilBuffer = this.device.createTexture(depthStencilBufferDescriptor);

        /* Depth Stencil View */
        const depthStencilViewDescriptor: GPUTextureViewDescriptor = {
            format: "depth24plus-stencil8",
            dimension: "2d",
            aspect: "all"
        }
        this.depthStencilView = this.depthStencilBuffer.createView(depthStencilViewDescriptor);
        
        /* Depth Stencil Attachment */
        this.depthStencilAttachment = {
            view: this.depthStencilView,
            depthClearValue: 1.0,
            depthLoadOp: "clear",
            depthStoreOp: "store",

            stencilLoadOp: "clear",
            stencilStoreOp: "discard"
        };
    }

    async makePipeline() {
        
        this.bindGroupLayout = this.device.createBindGroupLayout({
            entries: []
        });

        const pipelineLayout = this.device.createPipelineLayout({
            bindGroupLayouts: [this.bindGroupLayout]
        });

        this.pipeline = this.device.createRenderPipeline({
            vertex : {
                module : this.device.createShaderModule({
                    code : vertexShader
                }),
                entryPoint : "vs_main"
            },
    
            fragment : {
                module : this.device.createShaderModule({
                    code : fragmentShader
                }),
                entryPoint : "fs_main",
                targets : [{
                    format : this.format
                }]
            },
    
            primitive : {
                topology : "triangle-list"
            },
    
            layout: pipelineLayout,
            depthStencil: this.depthStencilState,
        });
    }

    async makeBindGroups() {
        this.bindGroup = this.device.createBindGroup({
            layout: this.bindGroupLayout,
            entries: []
        });
    }

    async computeSetup() {
        this.computePipeline = this.device.createComputePipeline({
            layout: 'auto',
            
            compute: {
                module: this.device.createShaderModule({
                    code: computeShader,
                }),
                entryPoint: 'cs_main',
            },
        });

        this.input = new Float32Array([1, 3, 5]);

        /* Creates work buffer of size input */
        this.workBuffer = this.device.createBuffer({
          label: 'work buffer',
          size: this.input.byteLength,
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
        });

        /* Writes to work buffer */
        this.device.queue.writeBuffer(this.workBuffer, 0, this.input);

        /* Creates work bind group from compute pipline layout*/
        this.workBindGroup = this.device.createBindGroup({
            label: 'bindGroup for work buffer',
            layout: this.computePipeline.getBindGroupLayout(0),
            entries: [
              { binding: 0, resource: { buffer: this.workBuffer } },
            ],
        });

        /* Creates results buffer where results will be stored */
        this.resultBuffer = this.device.createBuffer({
            label: 'result buffer',
            size: this.input.byteLength,
            usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
        });
    }

    async render(renderables: RenderData) {
        
        //Early exit tests
        // TODO: Possibly remove third bool
        if (!this.device || !this.pipeline || !this.computePipeline) {
            return;
        }
        
        //command encoder: records draw commands for submission
        const commandEncoder : GPUCommandEncoder = this.device.createCommandEncoder();
        
        /* Compute pass */
        const computePass = commandEncoder.beginComputePass({
            label: 'doubling compute pass',
        });
        computePass.setPipeline(this.computePipeline);
        computePass.setBindGroup(0, this.workBindGroup);
        computePass.dispatchWorkgroups(this.input.length);
        computePass.end();
        // Encode a command to copy the results to a mappable buffer.
        commandEncoder.copyBufferToBuffer(this.workBuffer, 0, this.resultBuffer, 0, this.resultBuffer.size);
        
        //texture view: image view to the color buffer in this case
        const textureView : GPUTextureView = this.context.getCurrentTexture().createView();
        //renderpass: holds draw commands, allocated from command encoder
        const renderpass : GPURenderPassEncoder = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: textureView,
                clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                loadOp: "clear",
                storeOp: "store"
            }],
            depthStencilAttachment: this.depthStencilAttachment
        });

        renderpass.setPipeline(this.pipeline);
        renderpass.setBindGroup(0, this.bindGroup);
        renderpass.draw(6, 1, 0, 0);
        renderpass.end();

        this.device.queue.submit([commandEncoder.finish()]);

        this.PrintComputeShaderResults();
    }

    async PrintComputeShaderResults() {
        // Read the results
        await this.resultBuffer.mapAsync(GPUMapMode.READ);
        const result = new Float32Array(this.resultBuffer.getMappedRange());

        console.log('input', this.input);
        console.log('result', result);

        this.resultBuffer.unmap();
    }
}