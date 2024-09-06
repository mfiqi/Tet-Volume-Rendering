import { TetrahedralMesh } from "./TetrahedralMesh";

export class TetBuffers {
    static tetVertsBuffer: GPUBuffer;
    static tetIndicesBuffer: GPUBuffer;
    static tetColorBuffer: GPUBuffer;
    static tetShellBuffer: GPUBuffer;

    static uniqueIndexBuffer: GPUBuffer;
    static uniqueVertsBuffer: GPUBuffer;

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

    static setupUniqueIndexBuffer(device: GPUDevice) {
        TetBuffers.uniqueIndexBuffer = device.createBuffer({
            size: TetrahedralMesh.uniqueIndices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE,
            mappedAtCreation: true
        });

        new Uint32Array(TetBuffers.uniqueIndexBuffer.getMappedRange()).set(TetrahedralMesh.uniqueIndices);
        TetBuffers.uniqueIndexBuffer.unmap();
    }

    static setupUniqueVertsBuffer(device: GPUDevice) {
        TetBuffers.uniqueVertsBuffer = device.createBuffer({
            size: TetrahedralMesh.uniqueVerts.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE,
            mappedAtCreation: true
        });

        new Uint32Array(TetBuffers.uniqueVertsBuffer.getMappedRange()).set(TetrahedralMesh.uniqueVerts);
        TetBuffers.uniqueVertsBuffer.unmap();
    }


    static async createTetBuffers(device: GPUDevice) {
        this.tetVertsBuffer = device.createBuffer({
            size: (TetrahedralMesh.uniqueVerts.length/3) * 3 * 4, // verts * 3 points per vert * 4 bytes
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



        this.setupUniqueIndexBuffer(device);
        this.setupUniqueVertsBuffer(device);
    }
}