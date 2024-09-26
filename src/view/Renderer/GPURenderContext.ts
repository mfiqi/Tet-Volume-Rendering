
import { vec3 } from "gl-matrix";
import { TetrahedralMesh } from "../Tetmesh/TetrahedralMesh";

export class GPURenderContext {
    // Device/Context objects
    static adapter: GPUAdapter;
    static device: GPUDevice;
    static context: GPUCanvasContext;
    static format : GPUTextureFormat;

    // Pipeline objects
    static pipeline: GPURenderPipeline;
    static bindGroup: GPUBindGroup;
    static bindGroupLayout: GPUBindGroupLayout;

    // Depth Stencil stuff 
    static depthStencilState: GPUDepthStencilState;
    static depthStencilBuffer: GPUTexture;
    static depthStencilView: GPUTextureView;
    static depthStencilAttachment: GPURenderPassDepthStencilAttachment;

    // Assets
    static transformBuffer: GPUBuffer;
    static volumeBuffer: GPUBuffer;
    static lightBuffer: GPUBuffer;

    // Volume assets
    static volumeData: Uint8Array;
    static volumeDims: number[];
    static volumeScale: vec3;
    static volumeTexture: GPUTexture;
    static colormapTexture: GPUTexture;
    static accumBuffers: GPUTexture[];
    static accumBufferViews: GPUTextureView[];
    static sampler: GPUSampler;
    static clearColor: number;

    static tetrahedralMesh: TetrahedralMesh;
}