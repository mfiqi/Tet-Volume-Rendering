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

    constructor(tetID: number) {
        this.tetID = tetID;
        this.createTetVertices();
    }

    /* Possibly todo: Create tet based on nieghbor verts */
    createTetVertices() {
        this.tetVertices = new Float32Array(
            [
                0, 0, 1,      
                1, 0, 1,      
                0.5, 1, 0.5,  
                0.5, 0, 0    
            ]
        );
    }
}