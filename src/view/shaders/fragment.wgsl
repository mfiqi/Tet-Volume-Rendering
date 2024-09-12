struct FragmentInput {
    @builtin(position) pixel: vec4<f32>,
    @location(0) ray_direction : vec3<f32>,
    //@location(1) eyePosition : vec3<f32>,
    @location(1) @interpolate(flat) eyePosition : vec3<f32>,
    @location(2) @interpolate(flat) color : vec3<f32>,  
    @location(3) @interpolate(flat) triangle_id : u32   // Triangle ID that is currently being shaded
};

fn linear_to_srgb(x: f32) -> f32 {
	if (x <= 0.0031308) {
		return 12.92 * x;
	}
	return 1.055 * pow(x, 1.0 / 2.4) - 0.055;
}

struct NormalVectors {
    normal: array<f32>
};
@binding(1) @group(0) var<storage, read> normalVectors: NormalVectors;

// Does the ray intersect the plane defined by the triangle?
fn ray_plane_intersection_test() {

}

// If so, does the intersection point fall within the triangle?
fn ray_triangle_intersection_test() {
    
}

@fragment
fn fs_main(fragmentInput: FragmentInput) -> @location(0) vec4<f32>
{
    // Use the triangle_ID to obtain the normal vector for the current triangle
    var normal: vec3<f32>;
    normal.x = normalVectors.normal[(fragmentInput.triangle_id * 3)];
    normal.y = normalVectors.normal[(fragmentInput.triangle_id * 3) + 1];
    normal.z = normalVectors.normal[(fragmentInput.triangle_id * 3) + 2];

    // Perform ray-triangle intersection
    return vec4<f32>(fragmentInput.color, 1.0);
}