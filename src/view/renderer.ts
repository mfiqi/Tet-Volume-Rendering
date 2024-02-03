import shader from "./shaders/shaders.wgsl";
import { CubeMesh } from "./cubeMesh";
import { QuadMesh } from "./quadMesh";
import { mat4 } from "gl-matrix";
import { Material } from "./material";
import { object_types, RenderData } from "../model/definitions";

export class Renderer {

    canvas: HTMLCanvasElement;

    // Device/Context objects
    adapter: GPUAdapter;
    device: GPUDevice;
    context: GPUCanvasContext;
    format : GPUTextureFormat;

    // Pipeline objects
    uniformBuffer: GPUBuffer;
    triangleBindGroup: GPUBindGroup;
    quadBindGroup: GPUBindGroup;
    pipeline: GPURenderPipeline;
    bindGroupLayout: GPUBindGroupLayout;

    // Depth Stencil stuff 
    depthStencilState: GPUDepthStencilState;
    depthStencilBuffer: GPUTexture;
    depthStencilView: GPUTextureView;
    depthStencilAttachment: GPURenderPassDepthStencilAttachment;

    // Assets
    cubeMesh: CubeMesh;
    //quadMesh: QuadMesh;
    //triangleMaterial: Material;
    //quadMaterial: Material;
    objectBuffer: GPUBuffer;


    constructor(canvas: HTMLCanvasElement){
        this.canvas = canvas;
    }

    async Initialize() {

        await this.setupDevice();

        await this.createAssets();

        await this.makeDepthBufferResources();

        await this.makePipeline();

        await this.makeBindGroups();
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
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {}
                },
                /*{
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {}
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {}
                },*/
                {
                    binding: 1,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {
                        type: "read-only-storage",
                        hasDynamicOffset: false
                    }
                }
            ],
        });

        const pipelineLayout = this.device.createPipelineLayout({
            bindGroupLayouts: [this.bindGroupLayout]
        });

        this.pipeline = this.device.createRenderPipeline({
            vertex : {
                module : this.device.createShaderModule({
                    code : shader
                }),
                entryPoint : "vs_main",
                buffers: [this.cubeMesh.bufferLayout,]
            },
    
            fragment : {
                module : this.device.createShaderModule({
                    code : shader
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

    async createAssets() {
        this.cubeMesh = new CubeMesh(this.device);
        //this.quadMesh = new QuadMesh(this.device);
        //this.triangleMaterial = new Material();
        //this.quadMaterial = new Material();

        this.uniformBuffer = this.device.createBuffer({
            size: 64 * 2,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        const modelBufferDescriptor: GPUBufferDescriptor = {
            size: 64 * 1024,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        };
        this.objectBuffer = this.device.createBuffer(modelBufferDescriptor);

        //await this.triangleMaterial.initialize(this.device, "dist/img/ice.jpg");
        //await this.quadMaterial.initialize(this.device, "dist/img/floor.png");
    }

    async makeBindGroups() {
        this.triangleBindGroup = this.device.createBindGroup({
            layout: this.bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.uniformBuffer
                    }
                },
                /*{
                    binding: 1,
                    resource: this.triangleMaterial.view
                },
                {
                    binding: 2,
                    resource: this.triangleMaterial.sampler
                },*/
                {
                    binding: 1,
                    resource: {
                        buffer: this.objectBuffer
                    }
                }
            ]
        });

        // Declare which uniform buffer we're using
        this.quadBindGroup = this.device.createBindGroup({
            layout: this.bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.uniformBuffer
                    }
                },
                /*{
                    binding: 1,
                    resource: this.quadMaterial.view
                },
                {
                    binding: 2,
                    resource: this.quadMaterial.sampler
                },*/
                {
                    binding: 1,
                    resource: {
                        buffer: this.objectBuffer
                    }
                }
            ]
        });
    }

    async render(renderables: RenderData) {
        
        //Early exit tests
        if (!this.device || !this.pipeline) {
            return;
        }

        //make transforms
        const projection = mat4.create();
        mat4.perspective(projection, this.degreesToRadians(45), 800/600, 0.1, 100);

        const view = renderables.view_transform;

        this.device.queue.writeBuffer(
            this.objectBuffer, 0, 
            renderables.model_transforms, 0, 
            renderables.model_transforms.length
        );
        this.device.queue.writeBuffer(this.uniformBuffer, 0, <ArrayBuffer>view);
        this.device.queue.writeBuffer(this.uniformBuffer, 64, <ArrayBuffer>projection);

        //command encoder: records draw commands for submission
        const commandEncoder : GPUCommandEncoder = this.device.createCommandEncoder();
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
        var objects_drawn: number = 0;

        //Cubes
        renderpass.setVertexBuffer(0, this.cubeMesh.buffer);
        renderpass.setIndexBuffer(this.cubeMesh.indexBuffer, "uint16");
        renderpass.setBindGroup(0, this.triangleBindGroup);
        renderpass.drawIndexed(
            12*3, // vertices per cube
            renderables.object_counts[object_types.CUBE],
            0, 0, objects_drawn
        );
        objects_drawn += renderables.object_counts[object_types.CUBE];

        //Quads
        /*renderpass.setVertexBuffer(0, this.quadMesh.buffer);
        renderpass.setBindGroup(0, this.quadBindGroup);
        renderpass.draw(
            6, renderables.object_counts[object_types.QUAD],
            0, objects_drawn
        );
        objects_drawn += renderables.object_counts[object_types.QUAD];*/

        renderpass.end();

        this.device.queue.submit([commandEncoder.finish()]);
    }

    degreesToRadians(degree: number) {return degree * (Math.PI/180);}
}