struct FragmentInput {
    @builtin(position) pixel: vec4<f32>,
    @location(0) ray_direction : vec3<f32>,
    //@location(1) eyePosition : vec3<f32>,
    @location(1) @interpolate(flat) eyePosition : vec3<f32>,
    @location(2) @interpolate(flat) color : vec3<f32>,  
    @location(3) @interpolate(flat) triangle_id : u32
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
// fn ray_triangle_intersection_test(v0: vec3<f32>, v1: vec3<f32>, v2: vec3<f32>, P: vec3<f32>, N: vec3<f32>) -> bool {
//     // Performs the inside outside test
//     var edge0: vec3<f32> = v1 - v0;
//     var edge1: vec3<f32> = v2 - v1;
//     var edge2: vec3<f32> = v0 - v2;
//     var C0: vec3<f32> = P - v0;
//     var C1: vec3<f32> = P - v1;
//     var C2: vec3<f32> = P - v2;
//     if (dot(N, cross(edge0, C0)) >= 0 && 
//         dot(N, cross(edge1, C1)) >= 0 &&
//         dot(N, cross(edge2, C2)) >= 0) {
//         // P is inside the triangle
//         return true; 
//     }
//     return false; 
// }

fn calculate_barycentric_coords(v0: vec3<f32>, v1: vec3<f32>, v2: vec3<f32>, O: vec3<f32>, D: vec3<f32>) -> vec3<f32> {
var edge1: vec3<f32> = v1 - v0;
    var edge2: vec3<f32> = v2 - v0;

    var p: vec3<f32> = cross(D, edge2); // cross between ray_dir and edge
    var det: f32 = dot(edge1, p);

    var epsilon: f32 = 0;
    
    // Check if ray and triangle are parallel (det close to 0)
    if (abs(det) < epsilon) { discard; }

    var invDet: f32 = 1.0 / det; // Inverse determinant for division

    var T: vec3<f32> = O - v0;
    var u: f32 = dot(T, p) * invDet;

    // If u is not in the range [0, 1], the ray does not intersect.
    if (u < 0 || u > 1) { discard; }

    var Q: vec3<f32> = cross(T, edge1);
    var v: f32 = dot(D, Q) * invDet;

    // If v is not in the range [0, 1 - u], the ray does not intersect.
    if (v < 0 || v > 1 - u) { discard; }

    var t: f32 = dot(edge2, Q) * invDet;

    // If t < epsilon, the intersection is behind the ray origin
    if (t < -epsilon) { discard; }

    var P: vec3<f32> = O + t*D;

    var w: f32 = 1 - u - v;

    return vec3<f32>(u,v,w);
}


struct TransformData {
    model: mat4x4<f32>,
    view: mat4x4<f32>,
    projection: mat4x4<f32>,
    normal: mat4x4<f32>,
    camera_position: vec3<f32>
};

@binding(0) @group(0) var<uniform> transform: TransformData;

// https://www.scratchapixel.com/lessons/3d-basic-rendering/ray-tracing-rendering-a-triangle/ray-triangle-intersection-geometric-solution.html
@fragment
fn fs_main(fragmentInput: FragmentInput) -> @location(0) vec4<f32>
{
    var t_id: u32 = fragmentInput.triangle_id;

    var O: vec3<f32> = fragmentInput.eyePosition;

    // Step 1: Normalize the view ray
    var D: vec3<f32> = normalize(fragmentInput.ray_direction);

    // Use the triangle_ID to obtain the normal vector for the current triangle
    var N: vec3<f32> = vec3<f32>(normalVectors.normal[(t_id*3)], normalVectors.normal[(t_id*3) + 1], normalVectors.normal[(t_id*3) + 2]);

    // Checks if ray and plane intersect
    ray_plane_intersection_test(D, N);
    
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

    //return vec4<f32>((v0 + v1 + v2)/3.0,1.0);
    
    var PVM : mat4x4<f32> = transform.projection * transform.view * transform.model;

    v0 = (PVM * vec4<f32>(v0,1.0)).xyz;
    v1 = (PVM * vec4<f32>(v1,1.0)).xyz;
    v2 = (PVM * vec4<f32>(v2,1.0)).xyz;

    var barycentricCoords: vec3<f32> = calculate_barycentric_coords(v0,v1,v2,O,D);

    return vec4<f32>(barycentricCoords,1.0);
}