"use strict";

class ImageEdit {
    constructor(img) {
        this.original = img;
        this.imgData = getImageData(this.original);
        this.width = img.width;
        this.height = img.height;
        //points that define where to pull pixels from
        //default: use whole image
        this.cornerLT = new Vector2(0, 0);
        this.cornerLB = new Vector2(0, this.height);
        this.cornerRT = new Vector2(this.width, 0);
        this.cornerRB = new Vector2(this.width, this.height);
        //
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext('2d');
    }

    getIndex(x, y, width = this.width) {
        if (!isNumber(x)) {
            let v = x;
            x = v.x;
            y = v.y;
        }
        //2024-01-30: copied from https://stackoverflow.com/a/35690009/2336212
        return 4 * (x + y * width);
    };

    /**
     * Pull pixel from the original image
     * @param {number} px Percent X: 0 = left, 1 = right
     * @param {*} py Percent Y: 0 = top, 1 = bottom
     */
    pullPixel(px, py) {
        let temp;
        //left point
        let cornerL = this.cornerLT.clone();
        temp = this.getDir(this.cornerLT, this.cornerLB);
        temp.multiplyScalar(py);
        cornerL.add(temp);
        //right point
        let cornerR = this.cornerRT.clone();
        temp = this.getDir(this.cornerRT, this.cornerRB);
        temp.multiplyScalar(py);
        cornerR.add(temp);
        //mid point
        let pt = cornerL.clone();
        temp = this.getDir(cornerL, cornerR);
        temp.multiplyScalar(px);
        pt.add(temp);
        //pull pixel
        let index = this.getIndex(pt);
        return this.imgData.data.slice(index, index + 4);
    }

    getDir(from, to) {
        let dir = to.clone();
        dir.sub(from);
        return dir;
    }


    convertToResolution(width, height) {
        const canvas = this.canvas;
        const ctx = this.ctx;
        canvas.width = width;
        canvas.height = height;
        const imgData = ctx.getImageData(0, 0, width, height);
        for (let i = 0; i < width; i++){// "<=" ?
            for (let j = 0; j < height; j++){// "<=" ?
                const pixel = this.pullPixel(i / width, j / height);
                this.pushPixel(imgData, pixel, i, j);
            }
        }
        ctx.putImageData(imgData, 0, 0);
        return canvas.toDataURL();
    }

    pushPixel(imgData, pixel, x, y) {
        let index = this.getIndex(x, y, imgData.width);
        for (let i = 0; i < 4; i++) {
            imgData.data[index + i] = pixel[i];
        }
    }

}
