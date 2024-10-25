using System.Numerics;

public class Program
{
    public static void Main(string[] args)
    {
        Vector3 v0 = new Vector3(1.0f, 0.0f, 0.0f);
        Vector3 v1 = new Vector3(0.0f, 1.0f, 0.0f);
        Vector3 v2 = new Vector3(0.0f, 0.0f, 0.0f);

        Vector3 N = new Vector3(0.0f, 0.0f, 1.0f);
        Vector3 origin = new Vector3(0.0f, 0.0f, -3.0f);
        Vector3 rayDir = Vector3.Normalize(v0 - origin);

        // D is the distance from the origin to the plane
        float D = -1 * Vector3.Dot(N, v0);
        // t is the distance from the ray origin to p_hit
        float t = -1 * (Vector3.Dot(N, origin) + D) / Vector3.Dot(N, rayDir);

        Vector3 P = origin + t * rayDir;

        P = new Vector3(0.5f, 0.5f, 0.0f);
        P = new Vector3(22.5f, 22.5f, 22.0f);

        Console.WriteLine(RayTriangleIntersectionTest(v0,v1,v2,P,N,rayDir,origin));
    }

    public static bool RayTriangleIntersectionTest(Vector3 v0, Vector3 v1, Vector3 v2,
                                                   Vector3 P, Vector3 N, Vector3 D, Vector3 O)
    {
        // Calculate edges
        Vector3 edge1 = v1 - v0;
        Vector3 edge2 = v2 - v0;

        // Cross product of ray direction and edge2
        Vector3 p = Vector3.Cross(D, edge2);

        // Determinant
        float det = Vector3.Dot(edge1, p);

        float epsilon = 1e-8f;

        // Check if ray and triangle are parallel
        if (Math.Abs(det) < epsilon)
        {
            return false;
        }

        // Inverse determinant
        float invDet = 1.0f / det;

        // Vector from vertex 0 to ray origin
        Vector3 T = O - v0;

        // Calculate u parameter and test bounds
        float u = Vector3.Dot(T, p) * invDet;
        if (u < 0 || u > 1)
        {
            return false;
        }

        // Prepare to test v parameter
        Vector3 Q = Vector3.Cross(T, edge1);
        float v = Vector3.Dot(D, Q) * invDet;
        if (v < 0 || v > 1 - u)
        {
            return false;
        }

        // Calculate t, ray intersects triangle if t > epsilon
        float t = Vector3.Dot(edge2, Q) * invDet;
        if (t < -epsilon)
        {
            return false;
        }

        return true;
    }

    /*static bool ray_triangle_intersection_test(Vector3 v0, Vector3 v1, Vector3 v2, Vector3 P, Vector3 N)
    {
        Vector3 edge0 = v1 - v0;
        Vector3 edge1 = v2 - v1;
        Vector3 edge2 = v0 - v2;

        Vector3 C0 = P - v0;
        Vector3 C1 = P - v1;
        Vector3 C2 = P - v2;

        if (Vector3.Dot(N, Vector3.Cross(edge0, C0)) >= 0 &&
        Vector3.Dot(N, Vector3.Cross(edge1, C1)) >= 0 &&
        Vector3.Dot(N, Vector3.Cross(edge2, C2)) >= 0)
        {
            // P is inside the triangle
            return true;
        }

        return false;
    }*/
}