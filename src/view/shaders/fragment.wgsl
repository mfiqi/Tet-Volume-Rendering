struct FragmentInput {
    @builtin(position) pixel: vec4<f32>,
    @location(0) ray_direction : vec3<f32>,
    @location(1) @interpolate(flat) eyePosition : vec3<f32>,
    @location(2) color : vec3<f32>
};

@group(0) @binding(3) var volume: texture_3d<f32>;
@group(0) @binding(4) var colormap: texture_2d<f32>;
@group(0) @binding(5) var tex_sampler: sampler;
@group(0) @binding(6) var accum_buffer: texture_storage_2d<rgba32float, read_write>; //TODO: Possibly use two storage variables

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
    // Step 1: Normalize the view ray
	var rayDir: vec3<f32> = normalize(fragmentInput.ray_direction);

	// Step 2: Intersect the ray with the volume bounds to find the interval
	// along the ray overlapped by the volume.
	var t_hit: vec2<f32> = intersect_box(fragmentInput.eyePosition, rayDir);
    var t_enter = t_hit.x;
    var t_exit = t_hit.y;

    var sigma_a: f32 = 0.1; 
    var T = exp(-t_enter * sigma_a);

    var stepSize = (t_enter - t_exit) / 25.0;
    for (var t = t_enter; t<t_exit; t+=stepSize) {
        
    }
    
    return vec4<f32>(fragmentInput.eyePosition + (rayDir*t_enter),1.0);
    //return vec4<f32>(fragmentInput.color,1.0);
}

// ---------------------------------- NOTES -------------------------------------

// ---------Beer-Lambert law-----------------------------
// vec3 background_color {xr, xg, xb};
// float sigma_a = 0.1; // absorption coefficient
// float distance = 10;
// float T = exp(-distance * sigma_a);
// vec3 background_color_through_volume = T * background_color;

// ---------------------- Alternative intersect box function -----------------------------------------
// https://www.scratchapixel.com/lessons/3d-basic-rendering/minimal-ray-tracer-rendering-simple-shapes/ray-box-intersection.html
//fn intersect_box(origin: vec3<f32>, rayDir: vec3<f32>) -> vec2<f32>
//{
//    var tmin: f32; 
//    var tmax: f32; 
//    var tymin: f32; 
//    var tymax: f32; 
//    var tzmin: f32; 
//    var tzmax: f32;
//
//    var box_min: vec3<f32> = vec3<f32>(0.0,0.0,0.0);
//    var box_max: vec3<f32> = vec3<f32>(1.0,1.0,1.0);
//
//    var bounds: array<vec3<f32>,2>;
//    bounds[0] = box_min;
//    bounds[1] = box_max; 
//
//    var inv_dir: vec3<f32>  = 1.0 / rayDir;
//    var sign: vec3<i32>;
//
//    if (inv_dir.x < 0.0) {sign.x = 1;} else {sign.x = 0;}
//    if (inv_dir.y < 0.0) {sign.y = 1;} else {sign.y = 0;}
//    if (inv_dir.z < 0.0) {sign.z = 1;} else {sign.z = 0;}
//
//    tmin = (bounds[sign.x].x - origin.x) * inv_dir.x;
//    tmax = (bounds[1-sign.x].x - origin.x) * inv_dir.x;
//    tymin = (bounds[sign.y].y - origin.y) * inv_dir.y;
//    tymax = (bounds[1-sign.x].y - origin.y) * inv_dir.y;
//
//    //if ((tmin > tymax) || (tymin > tmax)) {discard;}
//
//    if (tymin > tmin) {tmin = tymin;}
//    if (tymax < tmax) {tmax = tymax;}
//
//    tzmin = (bounds[sign.z].z - origin.z) * inv_dir.z;
//    tzmax = (bounds[1-sign.z].z - origin.z) * inv_dir.z;
//       
//    //if ((tmin > tzmax) || (tzmin > tmax)) {discard;}
//    if (tzmin > tmin) {tmin = tzmin;}
//    if (tzmax < tmax) {tmax = tzmax;}
//        
//    return vec2<f32>(tmin,tmax);
//}