struct VertexInput {
    @location(0) aVertexPosition : vec3<f32>,
    @location(1) aVertexColor : vec3<f32>,
    @builtin(vertex_index) v_id: u32,
    //@location(1) aVertexNormal : vec3<f32>,
    // @location(2) cameraPosition : vec3<f32>,
    //@location(2) triangleID: u32
};

struct VertexOutput {
    @builtin(position) Position : vec4<f32>,
    @location(0) ray_direction : vec3<f32>,
    @location(1) @interpolate(flat) camera_position : vec3<f32>,
    @location(2) @interpolate(flat) color : vec3<f32>,
    @location(3) @interpolate(flat) triangle_id : u32
};

struct TransformData {
    model: mat4x4<f32>,
    view: mat4x4<f32>,
    projection: mat4x4<f32>,
    normal: mat4x4<f32>,
    camera_position: vec3<f32>
};

struct TetVertices {
    tetVerts: array<f32>
};

struct TriangleIndices {
    indices: array<u32>
};
@binding(3) @group(0) var<storage, read> triangle: TriangleIndices;

@binding(0) @group(0) var<uniform> transform: TransformData;



@vertex
fn vs_main(vertexInput: VertexInput) -> VertexOutput
{
    var vertexOutput : VertexOutput;

    //var length = arrayLength(&triangle.indices); 
    //var i: u32 = 0;
    //var t_id: u32 = 0;
    //while (i < length) {
    //    if (triangle.indices[i] == vertexInput.v_id
    //    || triangle.indices[i+1] == vertexInput.v_id
    //    || triangle.indices[i+2] == vertexInput.v_id) {
    //        t_id = i;
    //        break;
    //    }
    //    i = i + 3;
    //}
    //vertexOutput.triangle_id = t_id;

    // Determines the current triangle based on the vertex ID
    vertexOutput.triangle_id = u32(ceil(f32(vertexInput.v_id) * 0.33333));

    var PVM : mat4x4<f32> = transform.projection * transform.view * transform.model;

    vertexOutput.Position = PVM * vec4<f32>(vertexInput.aVertexPosition, 1.0);

    //transform camera and ray direction

    vertexOutput.camera_position = transform.camera_position;
	vertexOutput.ray_direction = vertexOutput.Position.xyz - vertexOutput.camera_position;

    vertexOutput.color = vertexInput.aVertexColor;
    return vertexOutput;
}
