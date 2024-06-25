import { TetMesh } from "./tetMesh";

export class TetBuilder {
    vertexBuffer: GPUBuffer;
    vertexBufferLayout: GPUVertexBufferLayout;
    indexBuffer: GPUBuffer

    colorBuffer: GPUBuffer;
    colorBufferLayout: GPUVertexBufferLayout;

    constructor(device: GPUDevice) {
        var tet: TetMesh = new TetMesh(0);
        this.createColorBuffer(device);
        this.createVertexBuffer(device, tet);
        this.createIndexBuffer(device);
    }

    createColorBuffer(device: GPUDevice) {
        /* Colors of the vertices */
        const colors: Float32Array = new Float32Array(
            [
                1,0,0,
                0,1,0,
                0,0,1,
                0,0,1 
            ]
        );

        //VERTEX: the buffer can be used as a vertex buffer
        //COPY_DST: data can be copied to the buffer
        const usage: GPUBufferUsageFlags = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;

        const descriptor: GPUBufferDescriptor = {
            size: colors.byteLength,
            usage: usage,
            mappedAtCreation: true //  allows buffer to be written by the CPU
        };

        this.colorBuffer = device.createBuffer(descriptor);

        //Buffer has been created, now load in the vertices
        new Float32Array(this.colorBuffer.getMappedRange()).set(colors);
        this.colorBuffer.unmap();

        //Defines buffer layout
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

    createVertexBuffer(device: GPUDevice, tet: TetMesh) {
        //VERTEX: the buffer can be used as a vertex buffer
        //COPY_DST: data can be copied to the buffer
        const usage: GPUBufferUsageFlags = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;

        const descriptor: GPUBufferDescriptor = {
            size: tet.tetVertices.byteLength,
            usage: usage,
            mappedAtCreation: true //  allows buffer to be written by the CPU
        };

        this.vertexBuffer = device.createBuffer(descriptor);

        //Buffer has been created, now load in the vertices
        new Float32Array(this.vertexBuffer.getMappedRange()).set(tet.tetVertices);
        this.vertexBuffer.unmap();

        //Defines buffer layout
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
    }

    createIndexBuffer(device: GPUDevice) {
        const tetIndices: Uint16Array = new Uint16Array(
            [
                0, 2, 1, // front triangle
                0, 3, 2, // left triangle
                0, 3, 1, // bottom triangle
                1, 2, 3 // right triangle
            ]
        );

        this.indexBuffer = device.createBuffer({
            size: tetIndices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true
        });

        new Uint16Array(this.indexBuffer.getMappedRange()).set(tetIndices);
        this.indexBuffer.unmap();
    }
}