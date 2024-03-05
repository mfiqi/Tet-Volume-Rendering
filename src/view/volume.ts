export async function makeVolume(device: GPUDevice) {
    var volumeDims = [256,256,256];
    
    const longestAxis = Math.max(volumeDims[0], Math.max(volumeDims[1], volumeDims[2]));

    var volumeScale = [
        volumeDims[0] / longestAxis,
        volumeDims[1] / longestAxis,
        volumeDims[2] / longestAxis
    ];

    var colormapTexture = await uploadImage(device, "rainbow.png");

    /*var volumeTexture = await fetchVolume(volumes["Bonsai"])
        .then((volumeData) => { return uploadVolume(this.device, volumeDims, volumeData); });
    
    var accumBuffers = [
        this.device.createTexture({
            size: [this.canvas.width, this.canvas.height, 1],
            format: "rgba32float",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING
        }),
        this.device.createTexture({
            size: [this.canvas.width, this.canvas.height, 1],
            format: "rgba32float",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING
        })
    ];*/
}

async function uploadImage(device: GPUDevice, imageSrc: string) {
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

    return texture;
}