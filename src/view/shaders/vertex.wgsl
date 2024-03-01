struct VertexInput {
    @location(0) aVertexPosition : vec3<f32>,
};

struct VertexOutput {
    @builtin(position) Position : vec4<f32>,
    @location(0) ray_direction : vec3<f32>,
    @location(1) transformed_eye : vec3<f32>
};

struct TransformData {
    view: mat4x4<f32>,
    projection: mat4x4<f32>,
};

struct VolumeData {
    volumeScale : vec3<f32>,
    eyePosition : vec3<f32>
}

@binding(0) @group(0) var<uniform> transformUBO: TransformData;
@binding(1) @group(0) var<uniform> volumeData: VolumeData;

@vertex
fn vs_main(vertexInput: VertexInput) -> VertexOutput
{
    var vertexOutput : VertexOutput;

    var volume_translation : vec3<f32> = vec3<f32>(0.5,0.5,0.5) - volumeData.volumeScale * 0.5;
    
    vertexOutput.Position = transformUBO.projection * transformUBO.view * vec4<f32>(vertexInput.aVertexPosition * volumeData.volumeScale + volume_translation, 1.0);
	vertexOutput.transformed_eye = (volumeData.eyePosition - volume_translation) / volumeData.volumeScale;
	vertexOutput.ray_direction = vertexOutput.Position.xyz - vertexOutput.transformed_eye;
    
    return vertexOutput;
}