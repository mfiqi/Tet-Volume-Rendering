@vertex
fn vs_main(@builtin(vertex_index) my_index: u32) -> @builtin(position) vec4<f32> 
{
    var pos = array<vec2<f32>, 6>(
        vec2(-1.0, -1.0),
        vec2(-1.0, 1.0),
        vec2(1.0, 1.0),
        vec2(1.0, 1.0),
        vec2(1.0, -1.0),
        vec2(-1.0, -1.0)
    );
    return vec4<f32>(pos[my_index], 0.0, 1.0);
}