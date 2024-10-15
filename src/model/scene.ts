import { Cube } from "../Archive/cube";
import { Camera } from "./camera";
import { Light } from "./light";
import { vec3 } from "gl-matrix";
import { mat4 } from "gl-matrix";
import { RenderData } from "./definitions";

export class Scene {
    cube: Cube;
    camera: Camera;
    light: Light;

    constructor() {
        this.cube = new Cube([0,0,0], 0);
        this.camera = new Camera([-5,0,0], 0, 0);
        //this.camera = new Camera([0,18,12], 0, 0);
        this.light = new Light([2, 2, 2]);
    }

    update(rotate_cube: boolean) {
        this.cube.update(rotate_cube);
        this.camera.update();
    }

    spin_camera(dX: number, dY: number) {
        this.camera.theta -= dX;
        this.camera.theta %= 360;

        this.camera.phi = Math.min(
            89, Math.max(
                -89,
                this.camera.phi + dY
            )
        );
    }

    move_camera(forwards_amount: number, right_amount: number) {
        vec3.scaleAndAdd(
            this.camera.position,
            this.camera.position,
            this.camera.forwards,
            forwards_amount
        );
        vec3.scaleAndAdd(
            this.camera.position,
            this.camera.position,
            this.camera.right,
            right_amount
        );
    }
    get_camera(): Camera {
        return this.camera;
    }

    get_renderables(): RenderData {
        return {
            view_transform: this.camera.get_view(),
            model_transform: this.cube.get_model(),
            eye_position: new Float32Array(this.camera.get_eye_position()),
            light: this.light
        };
    }
}