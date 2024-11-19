import { Renderer } from "./renderer";
import vertexShader from "../shaders/vertex.wgsl";
import fragmentShader from "../shaders/fragment.wgsl";
/* Source */
import { TetrahedralMesh } from "../Tetmesh/TetrahedralMesh";
import { ReadFile } from "../Tetmesh/ReadFile";
import { ExtractShell } from "../Tetmesh/ExtractShell";
import { TetBuffers } from "../Tetmesh/TetBuffers";
import { GPURenderContext } from "./GPURenderContext";

export class SetupRenderer {
    
    renderer: Renderer;

    constructor(R: Renderer) {
        this.renderer = R;
    }

    async Initialize() {
        await this.setupDevice();

        await this.readTetMesh();

        await this.createAssets();

        GPURenderContext.clearColor = 0.0;

        await this.makeDepthBufferResources();

        await this.makePipeline();

        await this.makeBindGroups();
    }

    async readTetMesh() {
        const fileUrl = 'https://raw.githubusercontent.com/mfiqi/mfiqi.github.io/8e08f987f7ce2909591bcd09fa4f2ea4c969ef21/dist/data/very_small_turb.txt';

        console.log(fileUrl);

        await ReadFile.readTetMeshFile(fileUrl);
        ExtractShell.extract(GPURenderContext.device);

        // Ensures each triangle has unique vertices
        TetrahedralMesh.setupUniqueVertices();
        TetrahedralMesh.createTetColors();
        TetrahedralMesh.calculateNormalVecotrs(GPURenderContext.device);
    }

    async setupDevice() {
        //adapter: wrapper around (physical) GPU.
        //Describes features and limits
        GPURenderContext.adapter = <GPUAdapter> await navigator.gpu?.requestAdapter();
        //device: wrapper around GPU functionality
        //Function calls are made through the device
        GPURenderContext.device = <GPUDevice> await GPURenderContext.adapter?.requestDevice();
        //context: similar to vulkan instance (or OpenGL context)
        GPURenderContext.context = <GPUCanvasContext> this.renderer.canvas.getContext("webgpu");
        GPURenderContext.format = "bgra8unorm";
        GPURenderContext.context.configure({
            device: GPURenderContext.device,
            format: GPURenderContext.format,
            alphaMode: "premultiplied"
        });
    }

    async createAssets() {
        TetBuffers.createBufferLayout();

        GPURenderContext.transformBuffer = GPURenderContext.device.createBuffer({
            size: (64 * 4) + (4 * 4), // first is matrices, second is camera position
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        TetBuffers.createTetBuffers(GPURenderContext.device);
    }

    async makeDepthBufferResources() {
        /* Depth Stencil State */
        GPURenderContext.depthStencilState = {
            format: "depth24plus-stencil8",
            depthWriteEnabled: true,
            depthCompare: "less-equal",
        };

        /* Depth Stencil Buffer */
        const size: GPUExtent3D = {
            width: this.renderer.canvas.width,
            height: this.renderer.canvas.height,
            depthOrArrayLayers: 1
        };
        const depthStencilBufferDescriptor: GPUTextureDescriptor = {
            size: size,
            format: "depth24plus-stencil8",
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        }
        GPURenderContext.depthStencilBuffer = GPURenderContext.device.createTexture(depthStencilBufferDescriptor);

        /* Depth Stencil View */
        const depthStencilViewDescriptor: GPUTextureViewDescriptor = {
            format: "depth24plus-stencil8",
            dimension: "2d",
            aspect: "all"
        }
        GPURenderContext.depthStencilView = GPURenderContext.depthStencilBuffer.createView(depthStencilViewDescriptor);
        
        /* Depth Stencil Attachment */
        GPURenderContext.depthStencilAttachment = {
            view: GPURenderContext.depthStencilView,
            depthClearValue: 1.0,
            depthLoadOp: "clear",
            depthStoreOp: "store",

            stencilLoadOp: "clear",
            stencilStoreOp: "discard"
        };
    }

    async makePipeline() {    
        GPURenderContext.bindGroupLayout = GPURenderContext.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                    buffer: {}
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: {
                        type: "read-only-storage",
                        hasDynamicOffset: false
                    }
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: {
                        type: "read-only-storage",
                        hasDynamicOffset: false
                    }
                },
                {
                    binding: 3,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {
                        type: "read-only-storage",
                        hasDynamicOffset: false
                    }
                },
                {
                    binding: 4,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: {
                        type: "read-only-storage",
                        hasDynamicOffset: false
                    }
                }
            ]
        });

        const pipelineLayout = GPURenderContext.device.createPipelineLayout({
            bindGroupLayouts: [GPURenderContext.bindGroupLayout]
        });

        GPURenderContext.pipeline = GPURenderContext.device.createRenderPipeline({
            vertex : {
                module : GPURenderContext.device.createShaderModule({
                    code : vertexShader
                }),
                entryPoint : "vs_main",
                buffers: 
                [
                    TetBuffers.vertexBufferLayout,
                    TetBuffers.colorBufferLayout
                ]
            },
    
            fragment : {
                module : GPURenderContext.device.createShaderModule({
                    code : fragmentShader
                }),
                entryPoint : "fs_main",
                targets : [{
                    format : GPURenderContext.format,
                    blend: {
                        color: {srcFactor: "one", dstFactor: "one-minus-src-alpha"},
                        alpha: {srcFactor: "one", dstFactor: "one-minus-src-alpha"}
                    }
                }]
            },
            
            primitive : {
                topology : "triangle-list",
                cullMode: "none" 
            },
    
            layout: pipelineLayout,
            depthStencil: GPURenderContext.depthStencilState,
        });
    }

    async makeBindGroups() {
        GPURenderContext.bindGroup = GPURenderContext.device.createBindGroup({
            layout: GPURenderContext.bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: GPURenderContext.transformBuffer
                    },
                },
                {
                    binding: 1,
                    resource: {
                        buffer: TetrahedralMesh.normalBuffer
                    },
                },
                {
                    binding: 2,
                    resource: {
                        buffer: TetBuffers.uniqueVertsBuffer
                    },
                },
                {
                    binding: 3,
                    resource: {
                        buffer: TetBuffers.uniqueIndexBuffer
                    }
                },
                {
                    binding: 4,
                    resource: {
                        buffer: TetBuffers.triangle_tet_arr_buffer
                    }
                }
            ]
        });
    }
}