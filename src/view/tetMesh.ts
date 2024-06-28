export class TetMesh {
    /* 
    * Neighbor[0] = Left
    * Neighbor[1] = Right
    * Neighbor[2] = Back
    * Neighbor[3] = Bottom
    * */
    neighbors: TetMesh[];
    tetID: number;
    
    /* Vertices of the current tetrahedron */
    tetVertices: Float32Array;
    previousTetVerts: Float32Array;

    constructor(tetID: number, previousTetVerts: Float32Array) {
        this.tetID = tetID;
        this.previousTetVerts = previousTetVerts;
        this.createTetVertices();
    }

    /* Possibly todo: Create tet based on nieghbor verts */
    createTetVertices() {
        /* First tet gets initial verts*/
        if (this.tetID == 0) {
            this.tetVertices = new Float32Array(
                [
                    0.5, 0.5, 0.5,      
                    -0.5, -0.5, 0.5,      
                    -0.5, 0.5, -0.5,  
                    0.5, -0.5, -0.5    
                ]
            );
        } else if (this.tetID == 1) {
            this.tetVertices = this.previousTetVerts.slice(0);
            this.tetVertices[9] = -1;
            this.tetVertices[10] = 1;
            this.tetVertices[11] = 1;
        }
    }
}