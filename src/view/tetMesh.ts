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
    previousTet: TetMesh;

    constructor(tetID: number, previousTet: TetMesh) {
        this.tetID = tetID;
        this.previousTet = previousTet;
        this.createTetVertices();
    }

    /* Possibly todo: Create tet based on nieghbor verts */
    createTetVertices() {
        /* First tet gets initial verts*/
        if (this.previousTet == null) {
            this.tetVertices = new Float32Array(
                [
                    0.5, 0.5, 0.5,      
                    -0.5, -0.5, 0.5,      
                    -0.5, 0.5, -0.5,  
                    0.5, -0.5, -0.5    
                ]
            );
        } else {
            this.tetVertices = this.previousTet.tetVertices;
        }
    }
}