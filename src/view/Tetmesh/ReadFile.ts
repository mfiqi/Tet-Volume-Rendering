import axios from "axios";
import { TetrahedralMesh } from "./TetrahedralMesh";

export class ReadFile {
    /* Reads tet mesh file */
    static async readTetMeshFile(url: string): Promise<void> {
        TetrahedralMesh.tetVertices = new Float32Array(0);
        TetrahedralMesh.tetIndices = new Uint32Array(0);

        try {
            console.log("Before Response");
            const response = await axios.get(url);
            console.log("After Response");
            const fileContent = response.data;
            console.log("File Content");
    
            // Split the file content by new lines
            const lines = fileContent.split('\n');
            console.log("Lines Split");
    
            var currentlyReading: string = "Nothing";
            
            // Process each line
            console.log("Before Processed each line");
            for (const line of lines) {
                if (line == "Points") 
                    currentlyReading = "Points";
                else if (line == "Indices") 
                    currentlyReading = "Indices";
                else if (line == "tur_mu") {
                    currentlyReading = "tur_mu";
                } else {
                    if (line != "Points" || line != "Indices" || line != "tur_mu") {
                        if (currentlyReading == "Points") {
                            this.addToTetVerts(line);
                        } else if (currentlyReading == "Indices") {
                            this.addToTetIndices(line);
                        } else {
                            this.addTo_tur_mu(line);
                        }
                    }
                }
            }
            console.log("After each line processed");
        } catch (error) {
            console.error('Error reading the file:', error);
        }
    }

    static tur_mu = new Float32Array();

    static addTo_tur_mu(line: any) {
      // Convert the line parameter to a number.
      const number = parseFloat(line); 
    
      // Check if the conversion was successful.
      if (!isNaN(number)) {
        // Create a new array with the existing data and the new number.
        const newArray = new Float32Array(this.tur_mu.length + 1);
        newArray.set(this.tur_mu);
        newArray[newArray.length - 1] = number;
    
        // Update the static array.
        this.tur_mu = newArray;
      } else {
        // Handle the case where the conversion fails.
        console.error("Invalid input:", line);
      }
    }

    
    /* Adds to tet vertices */
    static addToTetVerts(line: any) {
        const regex = /-?\d+(\.\d+)?/g;
        const matches = line.match(regex);
        const values = matches.map(Number);

        //values[0] /= -10;
        //values[1] /= -10;
        //values[2] /= -10;

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