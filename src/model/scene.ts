import { Cube } from "./cube";
import { Camera } from "./camera";
import { vec3 } from "gl-matrix";

export class Scene {
    cubes: Cube[];
    camera: Camera;

    constructor() {
        this.cubes = [];
        this.cubes.push(
            new Cube(
                [2,0,0],
                0
            )
        ); 

        this.camera = new Camera([-2,0,0.5], 0, 0);
    }

    update() {
        this.cubes.forEach(
            (cube) => cube.update()
        );

        this.camera.update();
    }

    spin_camera(dX: number, dY: number) {
        this.camera.eulers[2] -= dX;
        this.camera.eulers[2] %= 360;

        this.camera.eulers[1] = Math.min(
            89, Math.max(
                -89,
                this.camera.eulers[1] + dY
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

    get_player(): Camera {
        return this.camera;
    }

    get_cubes(): Cube[] {
        return this.cubes;
    }
}