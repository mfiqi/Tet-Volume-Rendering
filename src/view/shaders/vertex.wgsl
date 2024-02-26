struct VertexInput {
    @builtin(vertex_index) index: u32
};

struct VertexOutput {
    @builtin(position) Position : vec4<f32>
};

@vertex
fn vs_main(vertexInput: VertexInput) -> VertexOutput
{
    var pos = array<vec2<f32>, 6>(
        vec2(-1.0, -1.0),
        vec2(-1.0, 1.0),
        vec2(1.0, 1.0),
        vec2(1.0, 1.0),
        vec2(1.0, -1.0),
        vec2(-1.0, -1.0)
    );

    var vertexOutput : VertexOutput;

    vertexOutput.Position = vec4<f32>(pos[vertexInput.index], 0.0, 1.0);

    return vertexOutput;
}