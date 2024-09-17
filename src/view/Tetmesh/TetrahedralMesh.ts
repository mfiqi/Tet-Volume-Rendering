import { vec3 } from "gl-matrix";
import { TetBuffers } from "./TetBuffers";
import { verify } from "crypto";

export class TetrahedralMesh {
    /* Tet Mesh Information */
    static tetVertices: Float32Array;
    static tetIndices: Uint32Array;
    static tetColors: Float32Array;
    static tetShellIndices: Uint32Array;

    static createTetColors() {
        this.tetColors = new Float32Array(this.uniqueVerts.length);
        for (let i = 0; i < this.uniqueVerts.length; i++) {
            this.tetColors[i] = Math.random();
        }
    }

    static uniqueVerts: Float32Array;
    static uniqueIndices: Uint32Array = new Uint32Array(0);

    static normalVectors: Float32Array;
    static normalBuffer: GPUBuffer;

    // https://stackoverflow.com/a/23709352
    // https://www.scratchapixel.com/lessons/3d-basic-rendering/ray-tracing-rendering-a-triangle/geometry-of-a-triangle.html
    static calculateNormalVecotrs(device: GPUDevice) {
        // There will be one normal vector per triangle
        this.normalVectors = new Float32Array(this.uniqueVerts.length/3);

        // Used for a more intuitive understanding
        const triangleSize: number = 9;
        const x = 0;
        const y = 1;
        const z = 2;
        
        // Iterates through every triangle in uniqueVerts
        for (let i = 0; i < this.uniqueVerts.length; i+=triangleSize) {
            var p1: vec3 = [this.uniqueVerts[i], this.uniqueVerts[i+1], this.uniqueVerts[i+2]];
            var p2: vec3 = [this.uniqueVerts[i+3], this.uniqueVerts[i+4], this.uniqueVerts[i+5]];
            var p3: vec3 = [this.uniqueVerts[i+6], this.uniqueVerts[i+7], this.uniqueVerts[i+8]];

            var A: vec3 = vec3.create();
            var B: vec3 = vec3.create();

            vec3.sub(A,p2,p1); // p2 - p1
            vec3.sub(B,p3,p1); // p3 - p1

            // Calculates Normal Vector
            var normal: vec3 = vec3.create();
            vec3.cross(normal,A,B);
            vec3.normalize(normal, normal);

            // Stores the calculated normal in array
            this.normalVectors[(i/3)+x] = normal[x];
            this.normalVectors[(i/3)+y] = normal[y];
            this.normalVectors[(i/3)+z] = normal[z];
        }

        this.normalBuffer = device.createBuffer({
            size: this.normalVectors.byteLength,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE,
            mappedAtCreation: true
        });

        new Uint32Array(this.normalBuffer.getMappedRange()).set(this.normalVectors);
        this.normalBuffer.unmap();
        console.log(this.normalVectors);
    }

    // TODO: Everything below this line needs its own class

    static setupUniqueVertices() {
        this.uniqueVerts = this.tetVertices;

        for (let index = 0; index < this.tetShellIndices.length; index++) {
            // If index is in unique indices, then it needs to be duplicated 
            if (this.contains(this.uniqueIndices, this.tetShellIndices[index])) {
                this.duplicate(this.tetShellIndices[index]);
            } else {
                this.addToUniqueIndices(this.tetShellIndices[index]);
            }
        }
    }

    static duplicate(index: number) {
        const sizeOfVert = 3;

        // Duplicate the vertex the index is pointing to
        var vertex = new Float32Array(3);
        vertex[0] = this.uniqueVerts[index*sizeOfVert];
        vertex[1] = this.uniqueVerts[index*sizeOfVert + 1];
        vertex[2] = this.uniqueVerts[index*sizeOfVert + 2];

        // Add vertex to the end of uniqueVerts
        this.addToUniqueVerts(vertex);

        // Add newly inserted vertex as the index instead
        var newIndex = (this.uniqueVerts.length/3)-1;
        this.addToUniqueIndices(newIndex);
    }

    static addToUniqueVerts(vertex: Float32Array) {
        const tempArr = new Float32Array(this.uniqueVerts.length + 3);
        tempArr.set(this.uniqueVerts);
        tempArr.set(vertex, this.uniqueVerts.length);
        this.uniqueVerts = tempArr;
    }

    static addToUniqueIndices(value: number) {
        var tempValueArr = new Uint32Array(1);
        tempValueArr[0] = value;

        const tempArr = new Uint32Array(this.uniqueIndices.length + 1);
        tempArr.set(this.uniqueIndices);
        tempArr.set(tempValueArr, this.uniqueIndices.length);
        this.uniqueIndices = tempArr;
    }
    
    // Checks if value is contained within the Uint32Array
    static contains(array: Uint32Array, value: number) {
        for (let i = 0; i < array.length; i++) {
            if (array[i] == value) 
                return true;
        }
        return false;
    }
}