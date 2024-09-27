import { Renderer } from "../view/Renderer/renderer";
import { Scene } from "../model/scene";
import { event } from "jquery";
import $ from "jquery"
import { SetupRenderer } from "../view/Renderer/RenderSetup";

export class App {
    canvas: HTMLCanvasElement;
    renderer: Renderer;
    setup: SetupRenderer;
    scene: Scene;

    keyLabel: HTMLElement;
    mouseXLabel: HTMLElement;
    mouseYLabel: HTMLElement;

    forwards_amount: number;
    right_amount: number;

    rotate_cube: boolean;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.renderer = new Renderer(canvas);
        this.setup = new SetupRenderer(this.renderer);
        this.scene = new Scene();

        this.forwards_amount = 0;
        this.right_amount = 0;
        this.rotate_cube = false;

        this.keyLabel = <HTMLElement>document.getElementById("key-label");
        $(document).on("keydown",(event) => {this.handle_keypress(event)});
        $(document).on("keyup",(event) => {this.handle_keyrelease(event)});

        this.mouseXLabel = <HTMLElement>document.getElementById("mouse-x-label");
        this.mouseYLabel = <HTMLElement>document.getElementById("mouse-y-label");

        this.canvas.onclick = () => {
            this.canvas.requestPointerLock();
        }
        this.canvas.addEventListener(
            "mousemove",
            (event) => {this.handle_mouse_move(event);}
        );
    }

    async initialize() {
        await this.setup.Initialize();
    }

    run = () => {
        var running: boolean = true;

        this.scene.update(this.rotate_cube);
        this.rotate_cube = false;
        this.scene.move_camera(
            this.forwards_amount, 
            this.right_amount
        );

        this.renderer.render(
            this.scene.get_renderables()
        );
        
        // if (running) {
        //     requestAnimationFrame(this.run);
        // }
    }

    handle_keypress(event: JQuery.KeyDownEvent) {
        this.keyLabel.innerText = event.code;

        if (event.code == "KeyW") {
            this.forwards_amount = 0.05;
        }
        if (event.code == "KeyS") {
            this.forwards_amount = -0.05;
        }
        if (event.code == "KeyA") {
            this.right_amount = -0.05;
        }
        if (event.code == "KeyD") {
            this.right_amount = 0.05;
        }

        if (event.code == "KeyE") {
            this.rotate_cube = true;
        }
    }

    handle_keyrelease(event: JQuery.KeyUpEvent) {
        this.keyLabel.innerText = event.code;
        
        if (event.code == "KeyW") {
            this.forwards_amount = 0;
        }
        if (event.code == "KeyS") {
            this.forwards_amount = 0;
        }
        if (event.code == "KeyA") {
            this.right_amount = 0;
        }
        if (event.code == "KeyD") {
            this.right_amount = 0;
        }
    }

    handle_mouse_move(event: MouseEvent) {
        this.mouseXLabel.innerText = event.clientX.toString();
        this.mouseYLabel.innerText = event.clientY.toString();

        this.scene.spin_camera(event.movementX * 0.07,event.movementY * -1 * 0.07)
    }
}