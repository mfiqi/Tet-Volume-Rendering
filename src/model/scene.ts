import { Cube } from "./cube";
import { Camera } from "./camera";
import { vec3 } from "gl-matrix";
import { mat4 } from "gl-matrix";

export class Scene {
    cubes: Cube[];
    camera: Camera;
    object_data: Float32Array;
    cube_count: number;

    constructor() {
        this.cubes = [];
        // Size of model matrix 16 * 1024 max cubes
        this.object_data = new Float32Array(16 * 1024);
        this.cube_count = 0;

        var i: number = 0;
        for (var y: number = -5; y < 5; y+=2) {
            this.cubes.push(
                new Cube(
                    [2,y,0],
                    0
                )
            );

            var blank_matrix = mat4.create();
            for (var j: number = 0; j < 16; j++) {
                this.object_data[16 * i + j] = <number>blank_matrix.at(j);
            }
            i++;
            this.cube_count++;
        }


        this.camera = new Camera([-2,0,0.5], 0, 0);
    }

    update() {
        var i: number = 0;

        this.cubes.forEach(
            (cube) => {
                cube.update();
                var model = cube.get_model();
                for (var j: number = 0; j<16; j++) {
                    this.object_data[16 * i + j] = <number>model.at(j);
                }
                i++;
            }
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

    get_camera(): Camera {
        return this.camera;
    }

    get_cubes(): Float32Array {
        return this.object_data;
    }
}