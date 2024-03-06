/* 
* Source code for obtaining volume dimensions of a dataset. 
* https://github.com/Twinklebear/webgpu-volume-pathtracer/blob/main/src/volume.js
*/

export async function uploadImage(device: GPUDevice, imageSrc: string) {
    var image = new Image();
    image.src = imageSrc;
    await image.decode();
    var bitmap = await createImageBitmap(image);

    var texture = device.createTexture({
        size: [bitmap.width, bitmap.height, 1],
        format: "rgba8unorm",
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST |
            GPUTextureUsage.RENDER_ATTACHMENT
    });

    var src = {source: bitmap};
    var dst = {texture: texture};
    device.queue.copyExternalImageToTexture(src, dst, [bitmap.width, bitmap.height]);
    await device.queue.onSubmittedWorkDone();
    
    console.log("Successfully uploaded image!");
    return texture;
}

// TODO: Add padding for volumes that are not 256x256x256
export async function fetchVolume(file: string) {
    const volumeDims = [256,256,256];
    const volumeSize = volumeDims[0] * volumeDims[1] * volumeDims[2];
    
    const response = await fetch(file);
    
    var reader: ReadableStreamDefaultReader<Uint8Array>;
    if (response.body != undefined) {
        reader = response.body.getReader();

        var receivedSize = 0;
        var buf = new Uint8Array(volumeSize);
        while (true) {
            var result = await reader.read();
            if (result?.done) {
                break;
            }
            var value = result?.value;
            buf.set(value, receivedSize);
        }
        
        console.log("Successfully fetched volume!");
        return buf;
    } else {
        console.log("ERROR: fetchVolume() in volume.ts");
        process.exit();
    }
}

export async function uploadVolume(device: GPUDevice, volumeDims: number[], volumeData: Uint8Array) {
    var volumeTexture = device.createTexture({
        size: volumeDims,
        format: "r8unorm",
        dimension: "3d",
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
    });

    var uploadBuf = device.createBuffer(
        {size: volumeData.length, usage: GPUBufferUsage.COPY_SRC, mappedAtCreation: true});
    new Uint8Array(uploadBuf.getMappedRange()).set(volumeData);
    uploadBuf.unmap();

    var commandEncoder = device.createCommandEncoder();

    var src = {
        buffer: uploadBuf,
        // Volumes must be aligned to 256 bytes per row, fetchVolume does this padding
        bytesPerRow: alignTo(volumeDims[0], 256),
        rowsPerImage: volumeDims[1]
    };
    var dst = {texture: volumeTexture};
    commandEncoder.copyBufferToTexture(src, dst, volumeDims);

    device.queue.submit([commandEncoder.finish()]);
    await device.queue.onSubmittedWorkDone();
    
    console.log("Successfully uploaded volume!");
    return volumeTexture;
}

function alignTo(val: number, align: number): number {
    return Math.floor((val + align - 1) / align) * align;
};