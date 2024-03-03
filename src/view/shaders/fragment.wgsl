struct FragmentInput {
    @builtin(position) pixel: vec4<f32>,
    @location(0) ray_direction : vec3<f32>,
    @location(1) @interpolate(flat) transformed_eye : vec3<f32>,
    @location(2) color : vec4<f32>
};

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

@fragment
fn fs_main(fragmentInput: FragmentInput) -> @location(0) vec4<f32>
{
    var color : vec4<f32>;

    // Step 1: Normalize the view ray
	var rayDir: vec3<f32> = normalize(fragmentInput.ray_direction);

	// Step 2: Intersect the ray with the volume bounds to find the interval
	// along the ray overlapped by the volume.
	var t_hit: vec2<f32> = intersect_box(fragmentInput.transformed_eye, rayDir);
	//if (t_hit.x > t_hit.y) {
	//	discard;
	//}

    // We don't want to sample voxels behind the eye if it's
	// inside the volume, so keep the starting point at or in front
	// of the eye
	t_hit.x = max(t_hit.x, 0.0);

    //var stepSize: f32 = 0.01;
    //// March the ray through the volume
    //for (var i = t_hit.x; i<t_hit.y; i+=stepSize) {
    //    i= 0.0;
    //}

    return fragmentInput.color;
}

// ---------Beer-Lambert law-----------------------------
// vec3 background_color {xr, xg, xb};
// float sigma_a = 0.1; // absorption coefficient
// float distance = 10;
// float T = exp(-distance * sigma_a);
// vec3 background_color_through_volume = T * background_color;