import { Material } from "./material";
import shader from "./shaders/shaders.wgsl";
import { CubeMesh } from "./cubeMesh";
import {mat4} from "gl-matrix";
import { Camera } from "../model/camera";
import { Cube } from "../model/cube";

export class Renderer {

    canvas: HTMLCanvasElement;

    // Device/Context objects
    adapter: GPUAdapter;
    device: GPUDevice;
    context: GPUCanvasContext;
    format: GPUTextureFormat;

    // Pipeline objects
    uniformBuffer: GPUBuffer;
    bindGroup: GPUBindGroup;
    pipeline: GPURenderPipeline;

    // Assets
    cubeMesh: CubeMesh;
    material: Material;
    objectBuffer: GPUBuffer;

    // Depth stencil 
    depthStencilState: GPUDepthStencilState;
    depthStencilBuffer: GPUTexture;
    depthStencilView: GPUTextureView;
    depthStencilAttachment: GPURenderPassDepthStencilAttachment;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    async Initialize() {

        await this.setupDevice();

        await this.createAssets();

        await this.makeDepthBufferResource();

        await this.makePipeline();
    }

    async setupDevice() {

        //adapter: wrapper around (physical) GPU.
        //Describes features and limits
        this.adapter = <GPUAdapter>await navigator.gpu?.requestAdapter();
        //device: wrapper around GPU functionality
        //Function calls are made through the device
        this.device = <GPUDevice>await this.adapter?.requestDevice();
        //context: similar to vulkan instance (or OpenGL context)
        this.context = <GPUCanvasContext>this.canvas.getContext("webgpu");
        this.format = "bgra8unorm";
        this.context.configure({
            device: this.device,
            format: this.format,
            alphaMode: "opaque"
        });

    }

    async makeDepthBufferResource() {
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
        // Creating uniform buffer
        this.uniformBuffer = this.device.createBuffer({
            size: (4 * 4) * 2 * 4, // 4x4 Matrix * 2 Matrices * 4 bytes 
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        // Declaring that we're going to use a uniform buffer
        const bindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {}
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {}
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {}
                },
                {
                    binding: 3,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {
                        type: "read-only-storage",
                        hasDynamicOffset: false
                    }
                }
            ],
        });

        // Declare which uniform buffer we're using
        this.bindGroup = this.device.createBindGroup({
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.uniformBuffer
                    }
                },
                {
                    binding: 1,
                    resource: this.material.view
                },
                {
                    binding: 2,
                    resource: this.material.sampler
                },
                {
                    binding: 3,
                    resource: {
                        buffer: this.objectBuffer
                    }
                }
            ]
        });

        const pipelineLayout = this.device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout]
        });

        this.pipeline = this.device.createRenderPipeline({
            vertex: {
                module: this.device.createShaderModule({
                    code: shader
                }),
                entryPoint: "vs_main",
                buffers: [this.cubeMesh.bufferLayout,]
            },

            fragment: {
                module: this.device.createShaderModule({
                    code: shader
                }),
                entryPoint: "fs_main",
                targets: [{
                    format: this.format
                }]
            },

            primitive: {
                topology: "triangle-list"
            },

            layout: pipelineLayout,
            depthStencil:  this.depthStencilState
        });

    }

    async createAssets() {
        this.cubeMesh = new CubeMesh(this.device);
        this.material = new Material();
        // 64 = size of model * 1024 models
        const modelBufferDescriptor: GPUBufferDescriptor = {
            size: 64 * 1024,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        }
        this.objectBuffer = this.device.createBuffer(modelBufferDescriptor);

        await this.material.initialize(this.device, "dist/img/ice.jpg");
    }

    async render(camera: Camera, cubes: Float32Array, cube_count: number) {

        const projection = mat4.create();
        mat4.perspective(projection, this.degreesToRadians(45), 800/600, 0.1, 100);

        const view = camera.get_view();

        this.device.queue.writeBuffer(this.objectBuffer, 0, cubes, 0, cubes.length);
        this.device.queue.writeBuffer(this.uniformBuffer, 0, <ArrayBuffer>view);
        this.device.queue.writeBuffer(this.uniformBuffer, 64, <ArrayBuffer>projection);

        //command encoder: records draw commands for submission
        const commandEncoder: GPUCommandEncoder = this.device.createCommandEncoder();
        //texture view: image view to the color buffer in this case
        const textureView: GPUTextureView = this.context.getCurrentTexture().createView();
        //renderpass: holds draw commands, allocated from command encoder
        const renderpass: GPURenderPassEncoder = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: textureView,
                clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                loadOp: "clear",
                storeOp: "store"
            }],
            depthStencilAttachment: this.depthStencilAttachment
        });
        renderpass.setPipeline(this.pipeline);
        renderpass.setVertexBuffer(0, this.cubeMesh.buffer);
        renderpass.setIndexBuffer(this.cubeMesh.indexBuffer, "uint16");
        renderpass.setBindGroup(0, this.bindGroup);
        renderpass.drawIndexed(12*3, cube_count);
        //renderpass.draw(24, 1, 0, 0);
        renderpass.end();

        this.device.queue.submit([commandEncoder.finish()]);
    }

    degreesToRadians(degree: number) {return degree * (Math.PI/180);}
}