import { TetBuffers } from "./TetBuffers";

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

        console.log(this.tetShellIndices);
        console.log(this.uniqueIndices);
        console.log(this.tetVertices);
        console.log(this.uniqueVerts);
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