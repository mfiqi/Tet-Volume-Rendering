struct VertexInput {
    @location(0) aVertexPosition : vec3<f32>,
    @location(1) aVertexNormal : vec3<f32>
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
    projection: mat4x4<f32>,
    normal: mat4x4<f32>
};

struct VolumeData {
    volumeScale : vec3<f32>,
    eyePosition : vec3<f32>
};

struct LightData {
    lightPosition: vec3<f32>,
    ambientCoefficient: vec3<f32>,
    diffuseCoefficient: vec3<f32>,
    specularCoefficient: vec3<f32>,
    shine: vec3<f32>,
    lightAmbient: vec3<f32>,
    lightDiffuse: vec3<f32>,
    lightSpecular: vec3<f32>,
};

@binding(0) @group(0) var<uniform> transform: TransformData;
@binding(1) @group(0) var<uniform> volumeData: VolumeData;
@binding(2) @group(0) var<uniform> lightData: LightData;

fn compute_light(
    aVertexPosition: vec3<f32>,
    aVertexNormal: vec3<f32>,
    V: mat4x4<f32>,
    M: mat4x4<f32>,
    N: mat4x4<f32>) -> vec3<f32> 
{
    var light_pos_in_eye = lightData.lightPosition;
    var vNorm = normalize((N * vec4<f32>(aVertexNormal,0.0)).xyz);
    var eyePosition = (V*M* vec4<f32>(aVertexPosition, 1.0)).xyz;

    // Light and Eye vectors 
    var L = normalize(light_pos_in_eye - eyePosition);
    var V_eye = normalize(-eyePosition); //TODO: possibly change
    var halfLV = normalize(L+V_eye); 

    // Ambient 
    var ambient = lightData.ambientCoefficient * lightData.lightAmbient; 

    // Diffuse 
    var NdotL = max(dot(vNorm, L), 0.0);
    var diffuse = lightData.diffuseCoefficient * lightData.lightDiffuse * NdotL;

    var R = normalize(2.0*NdotL*vNorm - V_eye);
    var RdotV = max(dot(R, V_eye), 0.0);

    var specular: vec3<f32>;  
    if (NdotL > 0.0) {
        specular = lightData.specularCoefficient* lightData.lightSpecular*pow(RdotV, lightData.shine.x); 
    } else {
        specular = vec3<f32>(0.0,0.0,0.0);
    }
    
    return ambient + diffuse + specular;    
}

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

    var light = compute_light(vertexInput.aVertexPosition, 
                             vertexInput.aVertexNormal,
                             transform.view,
                             transform.model,
                             transform.normal);
                             
    vertexOutput.color = color[index%3] + light;

    return vertexOutput;
}