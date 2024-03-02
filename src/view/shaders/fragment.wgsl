struct FragmentInput {
    @builtin(position) pixel: vec4<f32>,
    @location(0) ray_direction : vec3<f32>,
    @location(1) @interpolate(flat) transformed_eye : vec3<f32>
};

@fragment
fn fs_main(fragmentInput: FragmentInput) -> @location(0) vec4<f32>
{
    var color : vec4<f32>;

    color.r = fragmentInput.ray_direction.x;
    color.g = fragmentInput.ray_direction.y;
    color.b = fragmentInput.ray_direction.z;
    color.a = 1.0;

    return color;
}