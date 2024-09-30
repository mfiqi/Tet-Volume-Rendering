import { TetBuffers } from "./TetBuffers";
import { TetrahedralMesh } from "./TetrahedralMesh";

export class ExtractShell {
    /* TODO: Rewrite this function entirely to make it more readable */
    static extract(device: GPUDevice) {
        // Use a dynamic array to collect shell faces
        const shellIndices: number[] = [];
    
        // Track face occurrences using a map
        const faceMap: Map<string, number> = new Map();
    
        // Function to generate a sorted key for each face
        const generateFaceKey = (face: Uint32Array): string => {
            return face.slice().sort((a, b) => a - b).join('-');
        };
    
        // Iterate through every tetrahedron
        for (let j = 0; j < TetrahedralMesh.tetIndices.length; j += 4) {
            const faces = [
                new Uint32Array([TetrahedralMesh.tetIndices[j+1], TetrahedralMesh.tetIndices[j+2], TetrahedralMesh.tetIndices[j+3]]),
                new Uint32Array([TetrahedralMesh.tetIndices[j], TetrahedralMesh.tetIndices[j+2], TetrahedralMesh.tetIndices[j+3]]),
                new Uint32Array([TetrahedralMesh.tetIndices[j], TetrahedralMesh.tetIndices[j+1], TetrahedralMesh.tetIndices[j+3]]),
                new Uint32Array([TetrahedralMesh.tetIndices[j], TetrahedralMesh.tetIndices[j+1], TetrahedralMesh.tetIndices[j+2]])
            ];
    
            for (const face of faces) {
                const key = generateFaceKey(face);
                if (faceMap.has(key)) {
                    // Increment face count if already exists
                    faceMap.set(key, faceMap.get(key)! + 1);
                } else {
                    // Otherwise, add it with an initial count of 1
                    faceMap.set(key, 1);
                }
            }
        }
    
        // Filter out the boundary faces
        faceMap.forEach((count, key) => {
            if (count === 1) {
                const indices = key.split('-').map(Number);
                shellIndices.push(...indices);
            }
        });
    
        // Convert dynamic array to Uint32Array
        TetrahedralMesh.tetShellIndices = new Uint32Array(shellIndices);

        TetBuffers.tetShellBuffer = device.createBuffer({
            size: TetrahedralMesh.tetShellIndices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE,
            mappedAtCreation: true
        });

        new Uint32Array(TetBuffers.tetShellBuffer.getMappedRange()).set(TetrahedralMesh.tetShellIndices);
        TetBuffers.tetShellBuffer.unmap();
    }
}