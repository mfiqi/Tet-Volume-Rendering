import { TetMesh } from "./tetMesh";

export class TetStruct {

    tetStruct: TetMesh[];

    constructor() {
        this.createTetrahedralMesh();
    }

    /* TODO: Create 3 tetrahedrals */
    createTetrahedralMesh() {
        for (let i = 0; i < 3; i++) {
            var tetrahedron: TetMesh;// = new TetMesh(null, null, null, null, null, null);
            this.tetStruct.push();
        }
    }
}