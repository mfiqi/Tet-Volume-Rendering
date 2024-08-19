import { TetrahedralMesh } from "./TetrahedralMesh";

export class TetBuffers {
    static tetVertsBuffer: GPUBuffer;
    static tetIndicesBuffer: GPUBuffer;
    static tetColorBuffer: GPUBuffer;
    static tetShellBuffer: GPUBuffer;

    static vertexBufferLayout: GPUVertexBufferLayout;
    static colorBufferLayout: GPUVertexBufferLayout;

    static createBufferLayout() {
        this.vertexBufferLayout = {
            arrayStride: 12,
            attributes: [
                // Position
                {
                    shaderLocation: 0,
                    format: "float32x3",
                    offset: 0
                }
            ]
        }
        this.colorBufferLayout = {
            arrayStride: 12,
            attributes: [
                {
                    shaderLocation: 1,
                    format: "float32x3",
                    offset: 0
                }
            ]
        }

    }

    static async createTetBuffers(device: GPUDevice) {
        this.tetVertsBuffer = device.createBuffer({
            size: 1000 * 3 * 4, // 395 verts * 3 points per vert * 4 bytes
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX
        });

        this.tetIndicesBuffer = device.createBuffer({
            size: 1200 * 4 * 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });

        this.tetColorBuffer = device.createBuffer({
            size: TetrahedralMesh.tetColors.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true
        });

        new Float32Array(TetBuffers.tetColorBuffer.getMappedRange()).set(TetrahedralMesh.tetColors);
        TetBuffers.tetColorBuffer.unmap();
    }
}