struct FragmentInput {
    @builtin(position) pixel: vec4<f32>,
    @location(0) ray_direction : vec3<f32>,
    @location(1) eyePosition : vec3<f32>,
    //@location(1) @interpolate(flat) eyePosition : vec3<f32>,
    @location(2) color : vec3<f32>
};

@group(0) @binding(3) var volume: texture_3d<f32>;
@group(0) @binding(4) var colormap: texture_2d<f32>;
@group(0) @binding(5) var tex_sampler: sampler;
@group(0) @binding(6) var accum_buffer_in: texture_2d<f32>;
@group(0) @binding(7) var accum_buffer: texture_storage_2d<rgba32float, write>;

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
    // Step 1: Normalize the view ray
	var rayDir: vec3<f32> = normalize(fragmentInput.ray_direction);

	// Step 2: Intersect the ray with the volume bounds to find the interval
	// along the ray overlapped by the volume.
	var t_hit: vec2<f32> = intersect_box(fragmentInput.eyePosition, rayDir);
    var t_enter = t_hit.x;
    var t_exit = t_hit.y;

	// if (t_enter > t_exit) {
	// 	discard;
	// }

    // So we don't sample voxels behind the eye
    t_enter = max(t_enter, 0.0);

    // Step 3: Compute the step size to march through the volume grid
	var dt_vec: vec3<f32> = 1.0 / (vec3<f32>(256.0, 256.0, 256.0) * abs(rayDir));
    var dt_scale: f32 = 1.0;
	var dt: f32 = dt_scale * min(dt_vec.x, min(dt_vec.y, dt_vec.z));
	//var dt: f32 = min(dt_vec.x, min(dt_vec.y, dt_vec.z));

    // Step 4: Starting from the entry point, march the ray through the volume
	// and sample it
	var p: vec3<f32> = fragmentInput.eyePosition + t_enter * rayDir;

    var color: vec4<f32> = vec4<f32>(0.0,0.0,0.0,0.0);// = vec3<f32>(0.1,0.5,0.7);

    for (var t = t_enter; t < t_exit; t += dt) {
		// Step 4.1: Sample the volume, and color it by the transfer function.
		// Note that here we don't use the opacity from the transfer function,
		// and just use the sample value as the opacity
		var val: f32 = textureSampleLevel(volume, tex_sampler, p, 0.0).r;
		var val_color: vec4<f32> = vec4<f32>(textureSampleLevel(colormap, tex_sampler, vec2<f32>(val, 0.5),0.0).rgb, val);

		// Opacity correction
		val_color.a = 1.0 - pow(1.0 - val_color.a, dt_scale);

        // if (val_color.a == 0.0) {
        //     color = vec4<f32>(1.0, 0.0, 0.0, val);
        //     break;
        // }

		// Step 4.2: Accumulate the color and opacity using the front-to-back
		// compositing equation
        var tmp: vec3<f32> = color.rgb + (1.0 - color.a) * val_color.a * val_color.xyz; 
		color.r = tmp.r;
		color.g = tmp.g;
		color.b = tmp.b;
        color.a += (1.0 - color.a) * val_color.a;

		// Optimization: break out of the loop when the color is near opaque
		if (color.a >= 0.95) {
			break;
		}
		p += rayDir * dt;
	}

    color.r = linear_to_srgb(color.r);
    color.g = linear_to_srgb(color.g);
    color.b = linear_to_srgb(color.b);
    return vec4<f32>(color);
    //return vec4<f32>(textureSample(volume, tex_sampler, p).rgb, 1.0);
    //return vec4<f32>(fragmentInput.eyePosition + rayDir * t_enter, 1.0);
}