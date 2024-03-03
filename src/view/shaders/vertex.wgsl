struct VertexInput {
    @location(0) aVertexPosition : vec3<f32>
};

struct VertexOutput {
    @builtin(position) Position : vec4<f32>,
    @location(0) ray_direction : vec3<f32>,
    @location(1) @interpolate(flat) eyePosition : vec3<f32>,
    @location(2) color : vec3<f32>
};

struct TransformData {
    model: mat4x4<f32>,
    view: mat4x4<f32>,
    projection: mat4x4<f32>
};

struct VolumeData {
    volumeScale : vec3<f32>,
    eyePosition : vec3<f32>
};

@binding(0) @group(0) var<uniform> transform: TransformData;
@binding(1) @group(0) var<uniform> volumeData: VolumeData;

@vertex
fn vs_main(vertexInput: VertexInput, @builtin(vertex_index) index: u32) -> VertexOutput
{
    var vertexOutput : VertexOutput;

    var color = array<vec3<f32>, 3>(
        vec3<f32>(1.0,0.0,0.0),
        vec3<f32>(0.0,1.0,0.0),
        vec3<f32>(0.0,0.0,1.0)
    );

    var PVM : mat4x4<f32> = transform.projection * transform.view * transform.model;

    vertexOutput.Position = PVM * vec4<f32>(vertexInput.aVertexPosition, 1.0);
	vertexOutput.eyePosition = volumeData.eyePosition;
	vertexOutput.ray_direction = vertexOutput.Position.xyz - vertexOutput.eyePosition;
    vertexOutput.color = color[0];
    
    return vertexOutput;
}