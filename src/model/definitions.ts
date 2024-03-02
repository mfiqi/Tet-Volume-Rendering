import { mat4 } from "gl-matrix";
import { vec3 } from "gl-matrix";

export interface RenderData {
    view_transform: mat4;
    model_transform: mat4;
    eye_position: vec3;
}