import { TetMesh } from "./tetMesh";

export class TetBuilder {
    vertexBuffer: GPUBuffer;
    vertexBufferLayout: GPUVertexBufferLayout;
    indexBuffer: GPUBuffer

    colorBuffer: GPUBuffer;
    colorBufferLayout: GPUVertexBufferLayout;

    constructor(device: GPUDevice) {
        var tet1: TetMesh = new TetMesh(0);
        var tet2: TetMesh = new TetMesh(1);
        this.createColorBuffer(device, 2);
        this.createVertexBuffer(device, tet1, tet2);
        this.createIndexBuffer(device, 2);
    }

    createColorBuffer(device: GPUDevice, numOfTets: number) {

        const colors: Float32Array = new Float32Array(
            [
                1,0,0,
                0,1,0,
                0,0,1,
                1,0,1 
            ]
        );

        var tetColors: Float32Array = new Float32Array(12*numOfTets);
        /* Colors of the vertices */
        for (let index = 0; index < numOfTets; index++) {
            tetColors.set(colors, index*12);
        }

        console.log("Colors: ", tetColors);

        //VERTEX: the buffer can be used as a vertex buffer
        //COPY_DST: data can be copied to the buffer
        const usage: GPUBufferUsageFlags = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;

        const descriptor: GPUBufferDescriptor = {
            size: tetColors.byteLength,
            usage: usage,
            mappedAtCreation: true //  allows buffer to be written by the CPU
        };

        this.colorBuffer = device.createBuffer(descriptor);

        //Buffer has been created, now load in the vertices
        new Float32Array(this.colorBuffer.getMappedRange()).set(tetColors);
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

    createVertexBuffer(device: GPUDevice, tet1: TetMesh, tet2: TetMesh) {
        //VERTEX: the buffer can be used as a vertex buffer
        //COPY_DST: data can be copied to the buffer
        const usage: GPUBufferUsageFlags = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;

        let tetVerts = new Float32Array(tet1.tetVertices.length + tet2.tetVertices.length);
        tetVerts.set(tet1.tetVertices);
        tetVerts.set(tet2.tetVertices,tet1.tetVertices.length);

        console.log("TetVerts: ", tetVerts);

        const descriptor: GPUBufferDescriptor = {
            size: tetVerts.byteLength,
            usage: usage,
            mappedAtCreation: true //  allows buffer to be written by the CPU
        };

        this.vertexBuffer = device.createBuffer(descriptor);

        //Buffer has been created, now load in the vertices
        new Float32Array(this.vertexBuffer.getMappedRange()).set(tetVerts);
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

    createIndexBuffer(device: GPUDevice, numOfTets: number) {
        
        var tetIndices: Uint16Array = new Uint16Array(numOfTets*12);

        for (let i = 0; i < numOfTets; i++) {
            const indices: Uint16Array = new Uint16Array(
                [
                    0 + (i*4), 2 + (i*4), 1 + (i*4), // front triangle
                    0 + (i*4), 3 + (i*4), 2 + (i*4), // left triangle
                    0 + (i*4), 3 + (i*4), 1 + (i*4), // bottom triangle
                    1 + (i*4), 2 + (i*4), 3 + (i*4) // right triangle
                ]
            );
            tetIndices.set(indices,i*12);         
        }

        
        console.log("Indices: ", tetIndices);

        this.indexBuffer = device.createBuffer({
            size: tetIndices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true
        });

        new Uint16Array(this.indexBuffer.getMappedRange()).set(tetIndices);
        this.indexBuffer.unmap();
    }
}