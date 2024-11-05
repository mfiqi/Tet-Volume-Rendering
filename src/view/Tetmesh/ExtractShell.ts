import { TetBuffers } from "./TetBuffers";
import { TetrahedralMesh } from "./TetrahedralMesh";

export class ExtractShell {
    /* TODO: Rewrite this function entirely to make it more readable */

    /* Map the contains a mapping from triangle ID to tetrahedron ID */
    static triangleMap: Map<number, number[]> = new Map();

    static triangle_tet_arr: Int32Array;
    
    /* Needed for surface represenation only! */
    static extract(device: GPUDevice) {
        // Use a dynamic array to collect shell faces
        const shellIndices: number[] = [];
    
        // Map triangles to their corresponding tetrahedra
        //const triangleMap: Map<string, number[]> = new Map();
    
        // Function to generate a sorted key for each face
        const generateFaceKey = (face: Uint32Array): string => {
            return face.slice().sort((a, b) => a - b).join('-');
        };
    
        // Iterate through every tetrahedron
        var triangleIndex = 0;
        for (let j = 0; j < TetrahedralMesh.tetIndices.length; j += 4) {
            const tetIndex = j / 4; // Calculate the current tetrahedron index
            const faces = [
                new Uint32Array([TetrahedralMesh.tetIndices[j+1], TetrahedralMesh.tetIndices[j+2], TetrahedralMesh.tetIndices[j+3]]),
                new Uint32Array([TetrahedralMesh.tetIndices[j], TetrahedralMesh.tetIndices[j+2], TetrahedralMesh.tetIndices[j+3]]),
                new Uint32Array([TetrahedralMesh.tetIndices[j], TetrahedralMesh.tetIndices[j+1], TetrahedralMesh.tetIndices[j+3]]),
                new Uint32Array([TetrahedralMesh.tetIndices[j], TetrahedralMesh.tetIndices[j+1], TetrahedralMesh.tetIndices[j+2]])
            ];
    
            for (const face of faces) {
                const key = generateFaceKey(face);
                shellIndices.push(...face); 
                
                // Add the triangleID to the triangleMap along with the tetrahedron it corresponds with
                this.triangleMap.set(triangleIndex++, [tetIndex,-1]);
            }
        }

        /* Filling the triangle Map with other possible connected triangles */
        this.FindConnectedFaces(shellIndices);
        this.flattenTriangleMap();
    
        // Convert dynamic array to Uint32Array
        TetrahedralMesh.tetShellIndices = new Uint32Array(shellIndices);
    
        // (Optional) Log the triangleMap to see the mappings
        console.log(this.triangleMap);
    
        TetBuffers.tetShellBuffer = device.createBuffer({
            size: TetrahedralMesh.tetShellIndices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE,
            mappedAtCreation: true
        });
    
        new Uint32Array(TetBuffers.tetShellBuffer.getMappedRange()).set(TetrahedralMesh.tetShellIndices);
        TetBuffers.tetShellBuffer.unmap();
    }

    
    static flattenTriangleMap() {
        this.triangle_tet_arr = new Int32Array(ExtractShell.triangleMap.size*2);
        for (let i = 0; i < this.triangle_tet_arr.length; i++) {
            var tet_ids: number[] = ExtractShell.triangleMap.get(i) || [];
            this.triangle_tet_arr[i*2] = tet_ids[0];
            this.triangle_tet_arr[i*2+1] = tet_ids[1];
        }
        console.log(this.triangle_tet_arr);
    }

    /* Filling the triangle Map with other possible connected triangles */
    static FindConnectedFaces(shellIndices: number[]) {
        var tid1: number = 0;
        for (let i = 0; i<shellIndices.length; i+=3) {
            var triangle1: number[] = [shellIndices[i],shellIndices[i+1],shellIndices[i+2]];
            var tid2: number = 0;
            for (let j = 0; j<shellIndices.length; j+=3) {
                if (i != j) {
                    var triangle2: number[] = [shellIndices[j],shellIndices[j+1],shellIndices[j+2]];
                    if (this.trianglesAreEqual(triangle1,triangle2)) {
                        this.addTetID(tid1,tid2);
                        // is this good?
                    }
                }
                tid2++;
            }
            tid1++;
        }
    }

    static addTetID(tid1: number, tid2: number) {
        var tetID1: number[] = this.triangleMap.get(tid1) || [];
        var tetID2: number[] = this.triangleMap.get(tid2) || [];
        tetID1[1] = tetID2[0];
        this.triangleMap.set(tid1, tetID1);
    }

    static trianglesAreEqual(triangle1: number[], triangle2: number[]): boolean {
        if (triangle1.length !== triangle2.length) {
          return false;
        }
        for (let i = 0; i < triangle1.length; i++) {
          if (triangle1[i] !== triangle2[i]) {
            return false;
          }
        }
        return true;
    }
}