import axios from "axios";

export class TetrahedralMesh {

    static tetVertices: Float32Array;
    static tetIndices: Uint16Array;

    /* Reads tet mesh file */
    static async readTetMeshFile(url: string): Promise<void> {
        this.tetVertices = new Float32Array(0);
        this.tetIndices = new Uint16Array(0);

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

        const newFloat32Array = new Float32Array(this.tetVertices.length + 3);
        newFloat32Array.set(this.tetVertices);
        newFloat32Array.set(values, this.tetVertices.length);
        this.tetVertices = newFloat32Array;
    }

    /* Add to tet indices */
    static addToTetIndices(line: any) {
        const matches = line.match(/\d+/g);
        const numbers = matches ? matches.map(Number) : [];
        const uint16Array = new Uint16Array(numbers);

        const tempArray = new Uint16Array(this.tetIndices.length + 4);
        tempArray.set(this.tetIndices);
        tempArray.set(uint16Array, this.tetIndices.length);
        this.tetIndices = tempArray;
    }
}