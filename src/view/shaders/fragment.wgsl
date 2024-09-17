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


struct TriangleVerts {
    verts: array<f32>
};
@binding(2) @group(0) var<storage, read> tVerts: TriangleVerts;

// Does the ray intersect the plane defined by the triangle?
fn ray_plane_intersection_test(ray: vec3<f32>, planeNorm: vec3<f32>) {
    // If the ray and the plane are parallel, they will not intersect so we will discard pixel
    if (dot(ray, planeNorm) == 0) {
        discard;
    }
}

// If so, does the intersection point fall within the triangle?
fn ray_triangle_intersection_test() {
    
}

// https://www.scratchapixel.com/lessons/3d-basic-rendering/ray-tracing-rendering-a-triangle/ray-triangle-intersection-geometric-solution.html
@fragment
fn fs_main(fragmentInput: FragmentInput) -> @location(0) vec4<f32>
{
    var t_id = fragmentInput.triangle_id;
    var n_vector_size: u32 = 3;
    var triangle_size: u32 = 9; // Each Triangle Contains 9 Values, v0.x, v0.y, ..., v2.y, v2.z
    var origin: vec3<f32> = fragmentInput.eyePosition;

    // Step 1: Normalize the view ray
    var rayDir: vec3<f32> = normalize(fragmentInput.ray_direction);

    // Use the triangle_ID to obtain the normal vector for the current triangle
    var normal: vec3<f32> = vec3<f32>(normalVectors.normal[(t_id * n_vector_size)],
                                      normalVectors.normal[(t_id * n_vector_size) + 1],
                                      normalVectors.normal[(t_id * n_vector_size) + 2]);

    // Checks if ray and plane intersect
    ray_plane_intersection_test(rayDir, normal);
    
    // v0 is the first vertex in triangle with t_id, v0 is a point on the plane
    var v0: vec3<f32> = vec3<f32>(tVerts.verts[t_id * triangle_size], 
                                  tVerts.verts[(t_id * triangle_size) + 1],
                                  tVerts.verts[(t_id * triangle_size) + 2]);
    
    // D is the distance from the origin to the plane
    var D: f32 = -1 * dot(normal, v0);

    // t is the distance from the ray origin to p_hit
    var t: f32 = -1 * (dot(normal, origin) + D) / dot(normal, rayDir);

    // If a plane is "behind" the ray, it shouldn't be considered for an intersection.
    if (t < 0) {
        discard;
    }

    // Point where the ray intersects the triangle
    var P_hit = origin + t*rayDir;

    // Perform ray-triangle intersection
    return vec4<f32>(fragmentInput.color, 1.0);
}