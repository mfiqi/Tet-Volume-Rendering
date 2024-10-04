import vertexShader from "./shaders/vertex.wgsl";
import fragmentShader from "./shaders/fragment.wgsl";

import { RenderData } from "../../model/definitions";
import { ReadonlyVec3, mat4, vec4 } from "gl-matrix";
import { vec3 } from "gl-matrix";
import { Deg2Rad } from "../../model/math";
import { Light } from "../../model/light";

/* Source */
import { TetrahedralMesh } from "../Tetmesh/TetrahedralMesh";
import { ReadFile } from "../Tetmesh/ReadFile";
import { ExtractShell } from "../Tetmesh/ExtractShell";
import { TetBuffers } from "../Tetmesh/TetBuffers";
import { GPURenderContext } from "./GPURenderContext";

export class Renderer {

    canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement){
        this.canvas = canvas;
    }

    async render(renderables: RenderData) {
        //Early exit tests
        if (!GPURenderContext.device || !GPURenderContext.pipeline) {
            return;
        }

        /* Gets Transforms */
        const model = renderables.model_transform;
        const view = renderables.view_transform;
        const projection = mat4.create();
        mat4.perspective(projection, Deg2Rad(45), 800/600, 0.1, 100);
        const normal = Light.NormalMatrix(view, model);

        /* Write to transform buffer */
        GPURenderContext.device.queue.writeBuffer(GPURenderContext.transformBuffer, 0, <ArrayBuffer>model);
        GPURenderContext.device.queue.writeBuffer(GPURenderContext.transformBuffer, 64, <ArrayBuffer>view);
        GPURenderContext.device.queue.writeBuffer(GPURenderContext.transformBuffer, 128, <ArrayBuffer>projection);
        GPURenderContext.device.queue.writeBuffer(GPURenderContext.transformBuffer, 192, <ArrayBuffer>normal);
        GPURenderContext.device.queue.writeBuffer(GPURenderContext.transformBuffer, 256, <ArrayBuffer>renderables.eye_position);
        
        GPURenderContext.device.queue.writeBuffer(TetBuffers.uniqueVertsBuffer, 0, <ArrayBuffer>TetrahedralMesh.uniqueVerts);
        GPURenderContext.device.queue.writeBuffer(TetBuffers.uniqueIndexBuffer, 0, <ArrayBuffer>TetrahedralMesh.uniqueIndices);
        GPURenderContext.device.queue.writeBuffer(TetrahedralMesh.normalBuffer, 0, <ArrayBuffer>TetrahedralMesh.normalVectors);

        if (!this.printed)
            this.printInfo();

        //command encoder: records draw commands for submission
        const commandEncoder : GPUCommandEncoder = GPURenderContext.device.createCommandEncoder();
        
        //texture view: image view to the color buffer in GPURenderContext case
        const textureView : GPUTextureView = GPURenderContext.context.getCurrentTexture().createView();
        //renderpass: holds draw commands, allocated from command encoder
        const renderpass : GPURenderPassEncoder = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: textureView, //TODO: Possibly undefined
                clearValue: { r: GPURenderContext.clearColor, g: GPURenderContext.clearColor, b: GPURenderContext.clearColor, a: 1.0 }, 
                loadOp: "clear",
                storeOp: "store"
            }],
            depthStencilAttachment: GPURenderContext.depthStencilAttachment
        });

        renderpass.setPipeline(GPURenderContext.pipeline);
        renderpass.setVertexBuffer(0, TetBuffers.uniqueVertsBuffer);
        renderpass.setVertexBuffer(1, TetBuffers.tetColorBuffer);
        // triangle id 
        renderpass.setIndexBuffer(TetBuffers.uniqueIndexBuffer, "uint32");
        renderpass.setBindGroup(0, GPURenderContext.bindGroup);
        renderpass.drawIndexed(
            TetrahedralMesh.uniqueIndices.length,
            1, 0, 0
        );
        renderpass.end();

        GPURenderContext.device.queue.submit([commandEncoder.finish()]);
    }

    /* Debugging Info */
    printed: boolean = false;
    printInfo() {
        this.printed = true;
        console.log("\nVertices\n");
        for (let i = 0; i < TetrahedralMesh.tetVertices.length; i+=3) {
            console.log("Vertex "+i/3+": ("+TetrahedralMesh.tetVertices[i]+","
                                        +TetrahedralMesh.tetVertices[i+1]+","
                                        +TetrahedralMesh.tetVertices[i+2]+")");
        }

        console.log("\nIndices\n");
        for (let i = 0; i < TetrahedralMesh.tetShellIndices.length; i+=3) {
            console.log("Triangle "+i/3+": ("+TetrahedralMesh.tetShellIndices[i]+","
                                        +TetrahedralMesh.tetShellIndices[i+1]+","
                                        +TetrahedralMesh.tetShellIndices[i+2]+")");
        }

        console.log("\nUnique Vertices\n");
        for (let i = 0; i < TetrahedralMesh.uniqueVerts.length; i+=3) {
            console.log("Vertex "+i/3+": ("+TetrahedralMesh.uniqueVerts[i]+","
                                        +TetrahedralMesh.uniqueVerts[i+1]+","
                                        +TetrahedralMesh.uniqueVerts[i+2]+")");
        }

        console.log("\nUnique Indices\n");
        for (let i = 0; i < TetrahedralMesh.uniqueIndices.length; i+=3) {
            console.log("Triangle "+i/3+": ("+TetrahedralMesh.uniqueIndices[i]+","
                                        +TetrahedralMesh.uniqueIndices[i+1]+","
                                        +TetrahedralMesh.uniqueIndices[i+2]+")");
        }

        console.log("\nNormal Vectors\n");
        for (let i = 0; i < TetrahedralMesh.normalVectors.length; i+=3) {
            console.log("Normal "+i/3+": ("+TetrahedralMesh.normalVectors[i]+","
                                        +TetrahedralMesh.normalVectors[i+1]+","
                                        +TetrahedralMesh.normalVectors[i+2]+")");
        }

        console.log("\nIndices Lnegth\n");
        console.log(TetrahedralMesh.uniqueIndices.length);

        console.log("\nUnique Verts Buffer\n");
        console.log(TetBuffers.uniqueVertsBuffer)
    }
}