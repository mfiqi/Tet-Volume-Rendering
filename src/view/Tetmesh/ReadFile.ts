import axios from "axios";
import { TetrahedralMesh } from "./TetrahedralMesh";

export class ReadFile {
    /* Reads tet mesh file */
    static async readTetMeshFile(url: string): Promise<void> {
        TetrahedralMesh.tetVertices = new Float32Array(0);
        TetrahedralMesh.tetIndices = new Uint32Array(0);

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

        // values[0] /= -10;
        // values[1] /= -10;
        // values[2] /= -10;

        const newFloat32Array = new Float32Array(TetrahedralMesh.tetVertices.length + 3);
        newFloat32Array.set(TetrahedralMesh.tetVertices);
        newFloat32Array.set(values, TetrahedralMesh.tetVertices.length);
        TetrahedralMesh.tetVertices = newFloat32Array;
    }

    /* Add to tet indices */
    static addToTetIndices(line: any) {
        const matches = line.match(/\d+/g);
        const numbers = matches ? matches.map(Number) : [];
        const uint16Array = new Uint32Array(numbers);

        const tempArray = new Uint32Array(TetrahedralMesh.tetIndices.length + 4);
        tempArray.set(TetrahedralMesh.tetIndices);
        tempArray.set(uint16Array, TetrahedralMesh.tetIndices.length);
        TetrahedralMesh.tetIndices = tempArray;
    }
}