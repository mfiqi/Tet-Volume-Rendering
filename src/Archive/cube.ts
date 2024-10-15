import { vec3, mat4 } from "gl-matrix";
import { Deg2Rad } from "../model/math";

export class Cube {
    position: vec3;
    eulers: vec3;
    model: mat4;

    constructor(position: vec3, degrees: number) {
        this.position = position;
        this.eulers = vec3.create();
        this.eulers[2] = degrees;
        this.model = mat4.create();
    }

    update(rotate: boolean) {
        if (rotate) {
            mat4.rotateY(this.model, this.model, Deg2Rad(1));
        }
    }

    rotateY(degree: number) {
        mat4.rotateY(this.model, this.model, Deg2Rad(degree));
    }
    
    rotateX(degree: number) {
        mat4.rotateX(this.model, this.model, Deg2Rad(degree));
    }

    /*update() {
        this.eulers[2] += 0.1;
        if (this.eulers[2] >= 360) 
            this.eulers[2] = 0;

        this.model = mat4.create();
        mat4.translate(this.model, this.model, this.position);
        mat4.rotateZ(this.model, this.model, Deg2Rad(this.eulers[2]));
    }*/

    get_model(): mat4 {
        return this.model;
    }
}