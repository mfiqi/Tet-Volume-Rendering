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

// Determines if the ray intersects the plane defined by the triangle normal
fn ray_plane_intersection_test(ray: vec3<f32>, planeNorm: vec3<f32>) {
    // If the ray and the plane are parallel, they will not intersect so we will discard pixel
    if (dot(ray, planeNorm) == 0) {
        discard; // causes holes??
    }
}

// Determines if the intersection point falls within the triangle?
fn ray_triangle_intersection_test(v0: vec3<f32>, v1: vec3<f32>, v2: vec3<f32>, P: vec3<f32>, N: vec3<f32>) -> bool {
    // Performs the inside outside test

    // Step 2: Inside-Outside Test
    var C: vec3<f32>; // Vector perpendicular to triangle's plane
 
    // Edge 0
    var edge0: vec3<f32> = v1 - v0; 
    var vp0: vec3<f32> = P - v0;
    C = cross(edge0,vp0);
    if (dot(N,C) < 0) {
        return false; // P is on the right side
    }
 
    // Edge 1
    var edge1: vec3<f32> = v2 - v1; 
    var vp1: vec3<f32> = P - v1;
    C = cross(edge1,vp1);
    if (dot(N,C) < 0) { 
        return false; // P is on the right side 
    }
 
    // Edge 2
    var edge2: vec3<f32> = v0 - v2; 
    var vp2: vec3<f32> = P - v2;
    C = cross(edge2,vp2);
    if (dot(N,C) < 0) { 
        return false; // P is on the right side 
    }

    return true; // This ray hits the triangle

    // var edge0: vec3<f32> = v1 - v0;
    // var edge1: vec3<f32> = v2 - v1;
    // var edge2: vec3<f32> = v0 - v2;
    // var C0: vec3<f32> = P - v0;
    // var C1: vec3<f32> = P - v1;
    // var C2: vec3<f32> = P - v2;
    // if (dot(N, cross(edge0, C0)) > 0 && 
    //     dot(N, cross(edge1, C1)) > 0 &&
    //     dot(N, cross(edge2, C2)) > 0) {
    //     // P is inside the triangle
    //     return true; 
    // }
    // return false; 
}

// https://www.scratchapixel.com/lessons/3d-basic-rendering/ray-tracing-rendering-a-triangle/ray-triangle-intersection-geometric-solution.html
@fragment
fn fs_main(fragmentInput: FragmentInput) -> @location(0) vec4<f32>
{
    var t_id = fragmentInput.triangle_id;
    var origin: vec3<f32> = fragmentInput.eyePosition;

    // Step 1: Normalize the view ray
    var rayDir: vec3<f32> = normalize(fragmentInput.ray_direction);

    // Use the triangle_ID to obtain the normal vector for the current triangle
    var N: vec3<f32> = vec3<f32>(normalVectors.normal[(t_id*3)],
                                      normalVectors.normal[(t_id*3) + 1],
                                      normalVectors.normal[(t_id*3) + 2]);

    // Checks if ray and plane intersect
    ray_plane_intersection_test(rayDir, N);
    
    // v0 is the first vertex in triangle with t_id, v0 is a point on the plane
    var v0: vec3<f32> = vec3<f32>(tVerts.verts[(t_id * 9)], 
                                  tVerts.verts[(t_id * 9) + 1],
                                  tVerts.verts[(t_id * 9) + 2]);
    var v1: vec3<f32> = vec3<f32>(tVerts.verts[(t_id * 9) + 3], 
                                  tVerts.verts[(t_id * 9) + 4],
                                  tVerts.verts[(t_id * 9) + 5]);
    var v2: vec3<f32> = vec3<f32>(tVerts.verts[(t_id * 9) + 6], 
                                  tVerts.verts[(t_id * 9) + 7],
                                  tVerts.verts[(t_id * 9) + 8]);
    
    // D is the distance from the origin to the plane
    var D: f32 = -1 * dot(N, v0);

    // t is the distance from the ray origin to p_hit
    var t: f32 = -1 * (dot(N, origin) + D) / dot(N, rayDir);

    // If a plane is "behind" the ray, it shouldn't be considered for an intersection.
    // if (t < 0) {
    //     discard; // TODO: fix this
    // }

    // Point where the ray intersects the triangle
    var P = origin + t*rayDir;

    // Test if normals is being calculated correctly
    if (N.x < 0) {N.x *= -1;}
    if (N.y < 0) {N.y *= -1;}
    if (N.z < 0) {N.z *= -1;}
    return vec4<f32>(N, 1.0);

    // if (ray_triangle_intersection_test(v0, v1, v2, P, N)) { 
    //     return vec4<f32>(1.0, 1.0, 1.0, 1.0); // white
    // } else {
    //     return vec4<f32>(0.0, 0.0, 0.0, 1.0); // black
    // }

    // return vec4<f32>(fragmentInput.color, 1.0);
}