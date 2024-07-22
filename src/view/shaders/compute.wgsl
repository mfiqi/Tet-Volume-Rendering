struct TetIndices {
    tetIndices: array<u32>
};

struct TetTriangleIndices {
    tetTriangleIndices: array<u32>
};

// Tetrahedral Mesh Indices
@binding(0) @group(0) var<storage, read> tetIndices: TetIndices;

// Tetrahedral Triangle Surface Indices
@binding(1) @group(0) var<storage, read> tetTriangleIndices: TetTriangleIndices;

// Results will be written to this array
@binding(2) @group(0) var<storage, read_write> shell: array<u32>;

// Extract the shell of the mesh to this
@compute @workgroup_size(1, 1, 1) 
fn cs_main(@builtin(global_invocation_id) id: vec3<u32>) 
{

}