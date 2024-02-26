struct FragmentInput {
    @builtin(position) pixel: vec4<f32>
};

@fragment
fn fs_main(fragmentInput: FragmentInput) -> @location(0) vec4<f32>
{
    var color : vec4<f32>;

    color.r = fragmentInput.pixel.x / 800.0;
    color.g = fragmentInput.pixel.y / 600.0;
    color.b = 0.0;
    color.a = 1.0;

    return color;
}