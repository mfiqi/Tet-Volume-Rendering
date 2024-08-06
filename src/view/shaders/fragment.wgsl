struct FragmentInput {
    @builtin(position) pixel: vec4<f32>,
    @location(0) ray_direction : vec3<f32>,
    //@location(1) eyePosition : vec3<f32>,
    @location(1) @interpolate(flat) eyePosition : vec3<f32>,
    @location(2) @interpolate(flat) color : vec3<f32>,
    @location(3) @interpolate(flat) primitive_id : u32
};

// @group(0) @binding(3) var volume: texture_3d<f32>;
// @group(0) @binding(4) var colormap: texture_2d<f32>;
// @group(0) @binding(5) var tex_sampler: sampler;
// @group(0) @binding(6) var accum_buffer_in: texture_2d<f32>;
// @group(0) @binding(7) var accum_buffer: texture_storage_2d<rgba32float, write>;

// Calculates ray box intersection
fn intersect_box(origin: vec3<f32>, rayDir: vec3<f32>) -> vec2<f32>
{
    var box_min: vec3<f32> = vec3<f32>(0.0,0.0,0.0);
    var box_max: vec3<f32> = vec3<f32>(1.0,1.0,1.0);
    var inv_dir: vec3<f32>  = 1.0 / rayDir;
    var tmin_tmp: vec3<f32> = (box_min - origin) * inv_dir;
    var tmax_tmp: vec3<f32> = (box_max - origin) * inv_dir;
    var tmin: vec3<f32> = min(tmin_tmp, tmax_tmp);
    var tmax: vec3<f32> = max(tmin_tmp, tmax_tmp);
    var t0: f32 = max(tmin.x, max(tmin.y, tmin.z));
    var t1: f32 = min(tmax.x, min(tmax.y, tmax.z));
    return vec2<f32>(t0,t1);
}

fn linear_to_srgb(x: f32) -> f32 {
	if (x <= 0.0031308) {
		return 12.92 * x;
	}
	return 1.055 * pow(x, 1.0 / 2.4) - 0.055;
}

@fragment
fn fs_main(fragmentInput: FragmentInput) -> @location(0) vec4<f32>
{
    return vec4<f32>(fragmentInput.color, 1.0);
}