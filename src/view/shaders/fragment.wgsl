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

struct TransformData {
    model: mat4x4<f32>,
    view: mat4x4<f32>,
    projection: mat4x4<f32>,
    normal: mat4x4<f32>,
    camera_position: vec3<f32>
};

@binding(0) @group(0) var<uniform> transform: TransformData;

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

// Determines if the ray intersects the triangle
fn ray_triangle_intersection_test(v0: vec3<f32>, v1: vec3<f32>, v2: vec3<f32>, O: vec3<f32>, D: vec3<f32>) -> bool {
var edge1: vec3<f32> = v1 - v0;
    var edge2: vec3<f32> = v2 - v0;

    var p: vec3<f32> = cross(D, edge2); // cross between ray_dir and edge
    var det: f32 = dot(edge1, p);

    var epsilon: f32 = 0;
    
    // Check if ray and triangle are parallel (det close to 0)
    if (abs(det) < epsilon) { return false; }

    var invDet: f32 = 1.0 / det; // Inverse determinant for division

    var T: vec3<f32> = O - v0;
    var u: f32 = dot(T, p) * invDet;

    // If u is not in the range [0, 1], the ray does not intersect.
    if (u < 0 || u > 1) { return false; }

    var Q: vec3<f32> = cross(T, edge1);
    var v: f32 = dot(D, Q) * invDet;

    // If v is not in the range [0, 1 - u], the ray does not intersect.
    if (v < 0 || v > 1 - u) { return false; }

    var t: f32 = dot(edge2, Q) * invDet;

    // If t < epsilon, the intersection is behind the ray origin
    if (t < -epsilon) { return false; }

    return true;
}

fn calculate_barycentric_coords(v0: vec3<f32>, v1: vec3<f32>, v2: vec3<f32>, O: vec3<f32>, D: vec3<f32>) -> vec4<f32> {
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

    return vec4<f32>(u,v,w,t);
}

// Returns the vertices associated with tetrahedron_id
fn get_tetrahedron_vertices(tetrahedron_id: u32) -> array<f32,36> {
    var tetrahedronVertices: array<f32, 36>;
    // Explanation: 
    // (tetrahedron_id * 12) Gets the location of the current tetrahedron
    // (triangle * 9) Gets the location of the current triangle
    for (var i: u32 = 0; i<36; i=i+3) {
        var triangle: u32 = i/3;
        tetrahedronVertices[i] =   tVerts.verts[(tetrahedron_id * 12) + (triangle * 9)+(i)];
        tetrahedronVertices[i+1] = tVerts.verts[(tetrahedron_id * 12) + (triangle * 9)+(i+1)];
        tetrahedronVertices[i+2] = tVerts.verts[(tetrahedron_id * 12) + (triangle * 9)+(i+2)];
    }
    return tetrahedronVertices;
}

fn find_new_entrance_point(tetrahedronVertices: array<f32, 36>, triangleID: u32) {
    var currentTriangle: u32 = triangleID % 4;
}

fn find_next_tetrahedron() {
    
}

// https://www.scratchapixel.com/lessons/3d-basic-rendering/ray-tracing-rendering-a-triangle/ray-triangle-intersection-geometric-solution.html
@fragment
fn fs_main(fragmentInput: FragmentInput) -> @location(0) vec4<f32>
{
    // Triangle_ID
    var t_id: u32 = fragmentInput.triangle_id;

    var O: vec3<f32> = fragmentInput.eyePosition;

    // Normalize the view ray
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
    
    var PVM : mat4x4<f32> = transform.projection * transform.view * transform.model;

    // Correct the vertices
    v0 = (PVM * vec4<f32>(v0,1.0)).xyz;
    v1 = (PVM * vec4<f32>(v1,1.0)).xyz;
    v2 = (PVM * vec4<f32>(v2,1.0)).xyz;

    var barycentricCoords: vec4<f32> = calculate_barycentric_coords(v0,v1,v2,O,D);

    // Obtain first intersection point
    var t: f32 = barycentricCoords.w;
    var P: vec3<f32> = O + t*D; // Intersection point

    // Check other triangles of the same tetrehedron for the "exit point" of the tet and which triangle_id it is
    
    // TODO: Step 1: Find Tetrahedron ID based on Triangle ID
    // The first 4 triangles are part of tetrahedron_0, second four are tetrahedron_1, etc.
    var tetrahedron_id: u32 = u32(t_id/4);

    // TODO: Step 2: Get the other 3 Triangles of the tetrahedron
    var tetrahedron_size: u32 = 36;
    var tetrahedronVertices: array<f32, 36> = get_tetrahedron_vertices(tetrahedron_id);
    
    // TODO: Step 3: Test ray-triangle intersection for the 3 triangles and find new "entrance point"

    var intersections: u32 = 1;

    // We don't need to retest the current triangle
    var currentTriangle: u32 = t_id % 4;

    for (var i: u32 = 0; i<4; i=i+1) {
        if (i == currentTriangle) {
            continue;
        } else {
            v0 = vec3<f32>(tetrahedronVertices[i], 
                           tetrahedronVertices[i+1], 
                           tetrahedronVertices[i+2]);
            v1 = vec3<f32>(tetrahedronVertices[i+3], 
                           tetrahedronVertices[i+4], 
                           tetrahedronVertices[i+5]);
            v2 = vec3<f32>(tetrahedronVertices[i+6], 
                           tetrahedronVertices[i+7], 
                           tetrahedronVertices[i+8]);
            
            // SETTING ORIGIN TO BE THE PREVIOUS POINT!
            //O = P; // TODO: Is this correct?
            while (ray_triangle_intersection_test(v0,v1,v2,O,D)) {
                barycentricCoords = calculate_barycentric_coords(v0,v1,v2,O,D); // new barycentric coords
                t = barycentricCoords.w;
                P = O + t*D; // new entrance point

                intersections++;
                break; // TODO: Ray can only intersect with a single triangle correct?
            }
        }
    }

    if (intersections == 1) {
        return vec4<f32>(1.0,0.0,0.0,1.0);
    } else if (intersections == 2) {
        return vec4<f32>(0.0,1.0,0.0,1.0);
    } else {
        return vec4<f32>(0.0,0.0,1.0,1.0);
    }

    // TODO: Step 3.5: Count the number of intersections

    return vec4<f32>(barycentricCoords.xyz,1.0);
}