export class Volume {
    constructor() {
        var rainbow: string = "dist/color/rainbow.png";
        var bonsai: string = "dist/data/bonsai_256x256x256_uint8.raw";
    }

    getVolumeDimensions() {
        return [256,256,256];
    }

    alignTo(val: number, align: number) {
        return Math.floor((val + align - 1) / align) * align;
    }
}