export class TriangleMesh {
    buffer: GPUBuffer
    bufferLayout: GPUVertexBufferLayout

    constructor(device: GPUDevice) {
        // x y r g b
        const vertices: Float32Array = new Float32Array(
            [
                0.0, 0.0, 0.5, 1.0, 0.0, 0.0,
                0.0, -0.5, -0.5, 0.0, 1.0, 0.0,
                0.0, 0.5, -0.5, 0.0, 0.0, 1.0
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

        this.buffer = device.createBuffer(descriptor);

        //Buffer has been created, now load in the vertices
        new Float32Array(this.buffer.getMappedRange()).set(vertices);
        this.buffer.unmap();

        //Defines buffer layout
        this.bufferLayout = {
            arrayStride: 24, // to get to next element in array, step through 6 ints, int = 4 bytes, 6 ints = 20 bytes
            attributes: [
                // Position
                {
                    shaderLocation: 0,
                    format: "float32x3",
                    offset: 0
                },
                // Color
                {
                    shaderLocation: 1,
                    format: "float32x3",
                    offset: 12 // this is 12 because the first number starts to color starts two elements in the buffer, 3 * 4 bytes = 12 bytes
                }
            ]
        }
    }
}