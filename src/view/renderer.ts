import vertexShader from "./shaders/vertex.wgsl";
import fragmentShader from "./shaders/fragment.wgsl";
import computeShader from "./shaders/compute.wgsl"

import { RenderData } from "../model/definitions";
import { CubeMesh } from "./cubeMesh";
import { TetMesh } from "./tetMesh";
import { ReadonlyVec3, mat4, vec4 } from "gl-matrix";
import { vec3 } from "gl-matrix";
import { Deg2Rad } from "../model/math";
import { Light } from "../model/light";
import { linearToSRGB } from "./volume";

import axios from 'axios';

/* Source */
import { uploadImage, fetchVolume, uploadVolume } from "./volume";
import { TetBuilder } from "./tetBuilder";
import { TetrahedralMesh } from "./TetrahedralMesh";

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

    compute_pipeline: GPUComputePipeline;
    compute_bindGroup: GPUBindGroup;
    compute_layout: GPUBindGroupLayout;

    // Depth Stencil stuff 
    depthStencilState: GPUDepthStencilState;
    depthStencilBuffer: GPUTexture;
    depthStencilView: GPUTextureView;
    depthStencilAttachment: GPURenderPassDepthStencilAttachment;

    // Assets
    cubeMesh: CubeMesh;
    transformBuffer: GPUBuffer;
    volumeBuffer: GPUBuffer;
    lightBuffer: GPUBuffer;

    // Volume assets
    volumeData: Uint8Array;
    volumeDims: number[];
    volumeScale: vec3;
    volumeTexture: GPUTexture;
    colormapTexture: GPUTexture;
    accumBuffers: GPUTexture[];
    accumBufferViews: GPUTextureView[];
    sampler: GPUSampler;
    clearColor: number;

    tetMesh: TetBuilder;

    tetrahedralMesh: TetrahedralMesh;

    constructor(canvas: HTMLCanvasElement){
        this.canvas = canvas;
    }

    async Initialize() {
        await this.setupDevice();

        await this.readTetMesh();

        await this.createAssets();

        this.clearColor = 0.0;
        // await this.makeVolume();

        await this.makeDepthBufferResources();

        await this.makePipeline();

        await this.makeBindGroups();
    }

    async readTetMesh() {
        const fileUrl = 'https://raw.githubusercontent.com/mfiqi/mfiqi.github.io/Tetrahedral-Structure/dist/data/tetmesh.txt';

        await TetrahedralMesh.readTetMeshFile(fileUrl);
        TetrahedralMesh.createSurfaceIndices(this.device);
        TetrahedralMesh.createTetColors(this.device);
        TetrahedralMesh.extractShell(this.device);
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
        this.tetMesh = new TetBuilder(this.device);

        this.transformBuffer = this.device.createBuffer({
            size: 64 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        TetrahedralMesh.createTetBuffers(this.device);
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
                    buffer: {
                        type: "read-only-storage",
                        hasDynamicOffset: false
                    }
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {
                        type: "read-only-storage",
                        hasDynamicOffset: false
                    }
                }
            ]
        });

        this.compute_layout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "read-only-storage",
                        hasDynamicOffset: false
                    }
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "read-only-storage",
                        hasDynamicOffset: false
                    }
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "storage",
                        hasDynamicOffset: false
                    }
                }
            ]
        });

        const pipelineLayout = this.device.createPipelineLayout({
            bindGroupLayouts: [this.bindGroupLayout]
        });

        const compute_pipeline_layout = this.device.createPipelineLayout({
            bindGroupLayouts: [this.compute_layout]
        });

        this.pipeline = this.device.createRenderPipeline({
            vertex : {
                module : this.device.createShaderModule({
                    code : vertexShader
                }),
                entryPoint : "vs_main",
                buffers: 
                [
                    this.tetMesh.vertexBufferLayout,
                    this.tetMesh.colorBufferLayout
                ]
                //buffers: [this.cubeMesh.vertexBufferLayout]
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
            
            primitive : {
                topology : "triangle-list",
                //cullMode: "front" 
            },
    
            layout: pipelineLayout,
            depthStencil: this.depthStencilState,
        });

        this.compute_pipeline = this.device.createComputePipeline({
            compute : {
                module : this.device.createShaderModule({
                    code : computeShader
                }),
                entryPoint : "cs_main"
            },
            layout : compute_pipeline_layout
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
                        buffer: TetrahedralMesh.tetVertsBuffer
                    },
                },
                {
                    binding: 2,
                    resource: {
                        buffer: TetrahedralMesh.tetIndicesBuffer
                    },
                }
            ]
        });

        this.compute_bindGroup = this.device.createBindGroup({
            layout: this.compute_layout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: TetrahedralMesh.tetVertsBuffer
                    },
                },
                {
                    binding: 1,
                    resource: {
                        buffer: TetrahedralMesh.tetIndicesBuffer
                    },
                },
                {
                    binding: 2,
                    resource: {
                        buffer: TetrahedralMesh.tetShellBuffer
                    }
                }
            ]
        });
    }

    async makeVolume() {
        this.clearColor = linearToSRGB(0.1);

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

        this.accumBuffers = [
            this.device.createTexture({
                size: [this.canvas.width, this.canvas.height, 1],
                format: "rgba32float",
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING
            }),
            this.device.createTexture({
                size: [this.canvas.width, this.canvas.height, 1],
                format: "rgba32float",
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING
            })
        ];
    
        this.accumBufferViews = [this.accumBuffers[0].createView(), this.accumBuffers[1].createView()];
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

        this.device.queue.writeBuffer(TetrahedralMesh.tetVertsBuffer, 0, <ArrayBuffer>TetrahedralMesh.tetVertices);
        this.device.queue.writeBuffer(TetrahedralMesh.tetIndicesBuffer, 0, <ArrayBuffer>TetrahedralMesh.tetIndices);

        //command encoder: records draw commands for submission
        const commandEncoder : GPUCommandEncoder = this.device.createCommandEncoder();

        /*const computePass : GPUComputePassEncoder = commandEncoder.beginComputePass();
        computePass.setPipeline(this.compute_pipeline);
        computePass.setBindGroup(0, this.compute_bindGroup);
        computePass.dispatchWorkgroups(1,1,1);
        computePass.end();*/
        
        //texture view: image view to the color buffer in this case
        const textureView : GPUTextureView = this.context.getCurrentTexture().createView();
        //renderpass: holds draw commands, allocated from command encoder
        const renderpass : GPURenderPassEncoder = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: textureView, //TODO: Possibly undefined
                clearValue: { r: this.clearColor, g: this.clearColor, b: this.clearColor, a: 1.0 }, 
                loadOp: "clear",
                storeOp: "store"
            }],
            depthStencilAttachment: this.depthStencilAttachment
        });

        renderpass.setPipeline(this.pipeline);
        renderpass.setVertexBuffer(0, TetrahedralMesh.tetVertsBuffer);
        renderpass.setVertexBuffer(1, TetrahedralMesh.tetColorBuffer);
        renderpass.setIndexBuffer(TetrahedralMesh.tetSurfaceIndexBuffer, "uint32");
        renderpass.setBindGroup(0, this.bindGroup);
        renderpass.drawIndexed(
            //12*3, // vertices per cube
            TetrahedralMesh.tetSurfaceIndices.length,
            //4*3 * 2, // vertices per cube, last one is number of tets
            1, 0, 0
        );
        renderpass.end();

        this.device.queue.submit([commandEncoder.finish()]);
    }
}