import vertexShader from "./shaders/vertex.wgsl";
import fragmentShader from "./shaders/fragment.wgsl";
import { RenderData } from "../model/definitions";
import { CubeMesh } from "./cubeMesh";
import { ReadonlyVec3, mat4 } from "gl-matrix";
import { vec3 } from "gl-matrix";
import { Deg2Rad } from "../model/math";
import { Light } from "../model/light";

/* Source */
import { uploadImage, fetchVolume, uploadVolume } from "./volume";

export class Renderer {

    canvas: HTMLCanvasElement;

    // Device/Context objects
    adapter: GPUAdapter;
    device: GPUDevice;
    context: GPUCanvasContext;
    format : GPUTextureFormat;

    // Pipeline objects
    pipeline: GPURenderPipeline;
    bindGroupLayout: GPUBindGroupLayout;

    // Depth Stencil stuff 
    depthStencilState: GPUDepthStencilState;
    depthStencilBuffer: GPUTexture;
    depthStencilView: GPUTextureView;
    depthStencilAttachment: GPURenderPassDepthStencilAttachment;

    // Assets
    cubeMesh: CubeMesh;
    bindGroup: GPUBindGroup;
    transformBuffer: GPUBuffer;
    volumeBuffer: GPUBuffer;
    lightBuffer: GPUBuffer;

    // Volume assets
    volumeData: Uint8Array;
    volumeDims: number[];
    volumeScale: number[];
    volumeTexture: GPUTexture;
    colormapTexture: GPUTexture;
    accumBuffer: GPUTexture;
    sampler: GPUSampler;

    constructor(canvas: HTMLCanvasElement){
        this.canvas = canvas;
    }

    async Initialize() {
        await this.setupDevice();

        await this.createAssets();

        await this.makeVolume();

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
            alphaMode: "premultiplied"
        });
    }

    async createAssets() {
        this.cubeMesh = new CubeMesh(this.device);

        this.transformBuffer = this.device.createBuffer({
            size: 64 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.volumeBuffer = this.device.createBuffer({
            size: 32, 
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.lightBuffer = this.device.createBuffer({
            size: 128, 
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
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
                {
                    binding: 1,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {}
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {}
                },
                {
                    binding: 3,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: {},
                    texture: {viewDimension: "3d"}
                },
                {
                    binding: 4,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: {},
                    texture: {viewDimension: "2d"}
                },
                {
                    binding: 5,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: {},
                    sampler: {type: "filtering"}
                },
                {
                    binding: 6,
                    visibility: GPUShaderStage.FRAGMENT,
                    storageTexture: {
                        access: "read-write",
                        format: "rgba32float"
                    }
                }
            ]
        });

        const pipelineLayout = this.device.createPipelineLayout({
            bindGroupLayouts: [this.bindGroupLayout]
        });

        this.pipeline = this.device.createRenderPipeline({
            vertex : {
                module : this.device.createShaderModule({
                    code : vertexShader
                }),
                entryPoint : "vs_main",
                buffers: [this.cubeMesh.vertexBufferLayout]
            },
    
            fragment : {
                module : this.device.createShaderModule({
                    code : fragmentShader
                }),
                entryPoint : "fs_main",
                targets : [{
                    format : this.format,
                    blend: {
                        color: {srcFactor: "one", dstFactor: "one-minus-src-alpha"},
                        alpha: {srcFactor: "one", dstFactor: "one-minus-src-alpha"}
                    }
                }]
            },
            
            // TODO: Potentially change to triangle-strip
            primitive : {
                topology : "triangle-list",
                cullMode: "front" // TODO: Possibly remove if everything works, but there are visual errors
            },
    
            layout: pipelineLayout,
            depthStencil: this.depthStencilState,
        });
    }

    async makeBindGroups() {
        this.bindGroup = this.device.createBindGroup({
            layout: this.bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.transformBuffer
                    },
                },
                {
                    binding: 1,
                    resource: {
                        buffer: this.volumeBuffer
                    }
                },
                {
                    binding: 2,
                    resource: {
                        buffer: this.lightBuffer
                    }
                },
                {
                    binding: 3,
                    resource: this.volumeTexture.createView()
                },
                {
                    binding: 4,
                    resource: this.colormapTexture.createView()
                },
                {
                    binding: 5,
                    resource: this.sampler
                },
                {
                    binding: 6,
                    resource: this.accumBuffer.createView() // TODO: possibly change to view
                }
            ]
        });
    }

    async makeVolume() {
        this.sampler = this.device.createSampler({
            magFilter: "linear",
            minFilter: "linear",
        });

        this.volumeDims = [256,256,256];

        const longestAxis = Math.max(this.volumeDims[0], Math.max(this.volumeDims[1], this.volumeDims[2]));

        this.volumeScale = [
            this.volumeDims[0] / longestAxis,
            this.volumeDims[1] / longestAxis,
            this.volumeDims[2] / longestAxis
        ];

        this.colormapTexture = await uploadImage(this.device, "dist/color/rainbow.png");

        this.volumeData = await fetchVolume("dist/data/bonsai_256x256x256_uint8.raw");

        this.volumeTexture = await uploadVolume(this.device, this.volumeDims, this.volumeData);
        
        this.accumBuffer = this.device.createTexture({
            size: [this.canvas.width, this.canvas.height, 1],
            format: "rgba32float",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING
        })
    }

    async render(renderables: RenderData) {
        
        //Early exit tests
        if (!this.device || !this.pipeline) {
            return;
        }

        /* Gets Transforms */
        const model = renderables.model_transform;
        const view = renderables.view_transform;
        const projection = mat4.create();
        mat4.perspective(projection, Deg2Rad(45), 800/600, 0.1, 100);
        const normal = Light.NormalMatrix(view, model);

        /* Write to transform buffer */
        this.device.queue.writeBuffer(this.transformBuffer, 0, <ArrayBuffer>model);
        this.device.queue.writeBuffer(this.transformBuffer, 64, <ArrayBuffer>view);
        this.device.queue.writeBuffer(this.transformBuffer, 128, <ArrayBuffer>projection);
        this.device.queue.writeBuffer(this.transformBuffer, 192, <ArrayBuffer>normal);

        /* Write to volume buffer */
        const volumeScale : vec3 = vec3.fromValues(1.0,1.0,1.0);
        const eyePosition = renderables.eye_position;
        this.device.queue.writeBuffer(this.volumeBuffer, 0, new Float32Array(volumeScale));
        this.device.queue.writeBuffer(this.volumeBuffer, 12, new Float32Array(eyePosition));

        /* Write to light buffer */
        const light = renderables.light;
        this.device.queue.writeBuffer(this.lightBuffer, 0, new Float32Array(light.position));
        this.device.queue.writeBuffer(this.lightBuffer, 12, new Float32Array(light.mat_ambient));
        this.device.queue.writeBuffer(this.lightBuffer, 24, new Float32Array(light.mat_diffuse));
        this.device.queue.writeBuffer(this.lightBuffer, 36, new Float32Array(light.mat_specular));
        this.device.queue.writeBuffer(this.lightBuffer, 48, new Float32Array(light.mat_shine));
        this.device.queue.writeBuffer(this.lightBuffer, 60, new Float32Array(light.ambient));
        this.device.queue.writeBuffer(this.lightBuffer, 72, new Float32Array(light.diffuse));
        this.device.queue.writeBuffer(this.lightBuffer, 84, new Float32Array(light.specular));


        //command encoder: records draw commands for submission
        const commandEncoder : GPUCommandEncoder = this.device.createCommandEncoder();
        
        //texture view: image view to the color buffer in this case
        const textureView : GPUTextureView = this.context.getCurrentTexture().createView();
        //renderpass: holds draw commands, allocated from command encoder
        const renderpass : GPURenderPassEncoder = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: textureView, //TODO: Possibly undefined
                clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 }, // TODO: Potentially change to linearToSRGB color
                loadOp: "clear",
                storeOp: "store"
            }],
            depthStencilAttachment: this.depthStencilAttachment
        });

        // TODO: low priority: frame_id
        renderpass.setPipeline(this.pipeline);
        renderpass.setVertexBuffer(0, this.cubeMesh.vertexBuffer);
        renderpass.setIndexBuffer(this.cubeMesh.indexBuffer, "uint16");
        renderpass.setBindGroup(0, this.bindGroup);
        renderpass.drawIndexed(
            12*3, // vertices per cube
            1, 0, 0
        );
        renderpass.end();

        this.device.queue.submit([commandEncoder.finish()]);
    }
}