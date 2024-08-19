import { TetBuffers } from "./TetBuffers";

export class TetrahedralMesh {
    /* Tet Mesh Information */
    static tetVertices: Float32Array;
    static tetIndices: Uint32Array;
    static tetColors: Float32Array;
    static tetShellIndices: Uint32Array;

    static createTetColors() {
        this.tetColors = new Float32Array(this.tetVertices.length);
        for (let i = 0; i < this.tetVertices.length; i++) {
            this.tetColors[i] = Math.random();
        }
    }
}