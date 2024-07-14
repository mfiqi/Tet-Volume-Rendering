import axios from "axios";

export class TetrahedralMesh {

    static tetVertices: Float32Array;
    static tetIndices: Uint32Array;
    static tetColors: Float32Array;
    static tetSurfaceIndices: Uint32Array;

    static tetVertsBuffer: GPUBuffer;
    static tetIndicesBuffer: GPUBuffer;
    static tetSurfaceIndexBuffer: GPUBuffer;
    static tetColorBuffer: GPUBuffer;

    static async createTetBuffers(device: GPUDevice) {
        this.tetVertsBuffer = device.createBuffer({
            size: 1000 * 3 * 4, // 395 verts * 3 points per vert * 4 bytes
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX
        });

        this.tetIndicesBuffer = device.createBuffer({
            size: 1200 * 4 * 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });
    }

    static createTetColors(device: GPUDevice) {
        this.tetColors = new Float32Array(this.tetVertices.length);
        for (let i = 0; i < this.tetVertices.length; i++) {
            this.tetColors[i] = Math.random();
        }

        this.tetColorBuffer = device.createBuffer({
            size: this.tetColors.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true
        });

        new Float32Array(this.tetColorBuffer.getMappedRange()).set(this.tetColors);
        this.tetColorBuffer.unmap();
    }

    static createSurfaceIndices(device: GPUDevice) {
        this.tetSurfaceIndices = new Uint32Array(0);
        for (let i = 0; i < this.tetIndices.length; i+=4) {
            var index1: number = this.tetIndices[i];
            var index2: number = this.tetIndices[i+1];
            var index3: number = this.tetIndices[i+2];
            var index4: number = this.tetIndices[i+3];

            var triangle1 = new Uint32Array([index1,index2,index3]);
            var triangle2 = new Uint32Array([index2,index3,index4]);
            var triangle3 = new Uint32Array([index3,index4,index1]);
            var triangle4 = new Uint32Array([index4,index1,index2]);

            this.addToSurfaceTetIndices(triangle1, triangle2, triangle3, triangle4);
        }

        this.tetSurfaceIndexBuffer = device.createBuffer({
            size: this.tetSurfaceIndices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true
        });

        new Uint32Array(this.tetSurfaceIndexBuffer.getMappedRange()).set(this.tetSurfaceIndices);
        this.tetSurfaceIndexBuffer.unmap();
    }

    /* Reads tet mesh file */
    static async readTetMeshFile(url: string): Promise<void> {
        this.tetVertices = new Float32Array(0);
        this.tetIndices = new Uint32Array(0);

        try {
            const response = await axios.get(url);
            const fileContent = response.data;
    
            // Split the file content by new lines
            const lines = fileContent.split('\n');
    
            var currentlyReading: string = "Nothing";
            
            // Process each line
            for (const line of lines) {
                if (line == "Points") 
                    currentlyReading = "Points";
                else if (line == "Indices") 
                    currentlyReading = "Indices";
                else {
                    if (line != "Points" || line != "Indices") {
                        if (currentlyReading == "Points") {
                            this.addToTetVerts(line);
                        } else {
                            this.addToTetIndices(line);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error reading the file:', error);
        }
    }

    /* Adds to tet vertices */
    static addToTetVerts(line: any) {
        const regex = /-?\d+(\.\d+)?/g;
        const matches = line.match(regex);
        const values = matches.map(Number);

        values[0] /= -200;
        values[1] /= -200;
        values[2] /= -200;

        const newFloat32Array = new Float32Array(this.tetVertices.length + 3);
        newFloat32Array.set(this.tetVertices);
        newFloat32Array.set(values, this.tetVertices.length);
        this.tetVertices = newFloat32Array;
    }

    /* Add to tet indices */
    static addToTetIndices(line: any) {
        const matches = line.match(/\d+/g);
        const numbers = matches ? matches.map(Number) : [];
        const uint16Array = new Uint32Array(numbers);

        const tempArray = new Uint32Array(this.tetIndices.length + 4);
        tempArray.set(this.tetIndices);
        tempArray.set(uint16Array, this.tetIndices.length);
        this.tetIndices = tempArray;
    }

    /* Add to surface tet indices */
    static addToSurfaceTetIndices(triangle1: Uint32Array, 
        triangle2: Uint32Array, triangle3: Uint32Array, triangle4: Uint32Array) {
        const tempArray = new Uint32Array(this.tetSurfaceIndices.length + 12);
        tempArray.set(this.tetSurfaceIndices);
        
        tempArray.set(triangle1, this.tetSurfaceIndices.length);
        tempArray.set(triangle2, this.tetSurfaceIndices.length + 3);
        tempArray.set(triangle3, this.tetSurfaceIndices.length + 6);
        tempArray.set(triangle4, this.tetSurfaceIndices.length + 9);

        this.tetSurfaceIndices = tempArray;
    } 

}