import { Cube } from "./cube";
import { Quad } from "./quad";
import { Camera } from "./camera";
import { vec3 } from "gl-matrix";
import { mat4 } from "gl-matrix";
import { object_types, RenderData } from "./definitions";

export class Scene {
    cubes: Cube[];
    quads: Quad[];
    camera: Camera;
    object_data: Float32Array;
    cube_count: number;
    quad_count: number;

    constructor() {
        this.cubes = [];
        this.quads = [];
        // Size of model matrix 16 * 1024 max cubes
        this.object_data = new Float32Array(16 * 1024);
        this.cube_count = 0;
        this.quad_count = 0;

        this.create_cubes();
        this.create_quads();

        this.camera = new Camera([-2,0,0.5], 0, 0);
    }

    create_cubes() {
        var i: number = 0;
        for (var y: number = -5; y <= 5; y+=2) {
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
    }
    
    create_quads() {
        // i = cube_count: makes sure quad model matrices are being written after cube model matrices
        var i: number = this.cube_count;
        for (var x: number = -10; x <= 10; x++) {
            for (var y: number = -10; y < 10; y++) {
                this.quads.push(
                    new Quad(
                        [x,y,0]
                    )
                );
    
                var blank_matrix = mat4.create();
                for (var j: number = 0; j < 16; j++) {
                    this.object_data[16 * i + j] = <number>blank_matrix.at(j);
                }
                i++;
                this.quad_count++;
            }
        }
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

        this.quads.forEach(
            (quad) => {
                quad.update();
                var model = quad.get_model();
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

    get_renderables(): RenderData {
        return {
            view_transform: this.camera.get_view(),
            model_transforms: this.object_data,
            object_counts: {
                [object_types.CUBE]: this.cube_count,
                [object_types.QUAD]: this.quad_count
            }
        };
    }
}