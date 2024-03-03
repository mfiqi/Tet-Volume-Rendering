import { vec3, mat4, vec4 } from "gl-matrix";

export class Light {

    position: vec3;

    ambient: vec3;
    diffuse: vec3;
    specular: vec3;

    mat_ambient: vec3;
    mat_diffuse: vec3;
    mat_specular: vec3;
    mat_shine: vec3;

    constructor(position: vec3) {
        this.position = position;

        this.ambient = [0, 0, 0];
        this.diffuse = [.8, .8, .8];
        this.specular = [1, 1, 1];

        this.mat_ambient = [0, 0, 0];
        this.mat_diffuse = [0, 1, 1];
        this.mat_specular = [.9, .9, .9];
        this.mat_shine = [50,0,0];
    }

    static NormalMatrix(V: mat4, M: mat4): mat4 {
        var N: mat4 = mat4.create();
        mat4.identity(N);
        mat4.multiply(N,N,V);
        mat4.multiply(N,N,M);
        mat4.invert(N,N);
        mat4.transpose(N,N);
        return N;
    }
}