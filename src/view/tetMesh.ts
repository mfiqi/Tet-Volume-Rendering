export class TetMesh {

    vertexBuffer: GPUBuffer
    vertexBufferLayout: GPUVertexBufferLayout
    indexBuffer: GPUBuffer

    neighbors: TetMesh[];
    tetID: number;

    constructor(device: GPUDevice, tetID: number,
        LeftTet?: TetMesh, RightTet?: TetMesh, FrontTet?: TetMesh, BottomTet?: TetMesh) {
        this.createVertexBuffer(device); // creates vertices and color arrays
        this.createIndexBuffer(device);

        this.tetID = tetID;

    }

    createVertexBuffer(device: GPUDevice) {
        // x y z ----------- Normal vector
        const vertices: Float32Array = new Float32Array(
            [
                0, 0, 1,        1,0,0, // left point            0
                1, 0, 1,        0,1,0, // right point           1
                0.5, 1, 0.5,    0,0,1, // highest point         2
                0.5, 0, 0,      0,0,1 // most forward point     3
            ]
        );

        //VERTEX: the buffer can be used as a vertex buffer
        //COPY_DST: data can be copied to the buffer
        const usage: GPUBufferUsageFlags = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;

        const descriptor: GPUBufferDescriptor = {
            size: vertices.byteLength,
            usage: usage,
            mappedAtCreation: true //  allows buffer to be written by the CPU
        };

        this.vertexBuffer = device.createBuffer(descriptor);

        //Buffer has been created, now load in the vertices
        new Float32Array(this.vertexBuffer.getMappedRange()).set(vertices);
        this.vertexBuffer.unmap();

        //Defines buffer layout
        this.vertexBufferLayout = {
            arrayStride: 24, // to get to next element in array, step through 6 ints, int = 4 bytes, 6 ints = 20 bytes
            attributes: [
                // Position
                {
                    shaderLocation: 0,
                    format: "float32x3",
                    offset: 0
                },
                {
                    shaderLocation: 1,
                    format: "float32x3",
                    offset: 12
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