"use strict";

class ImageEdit {
    constructor(img) {
        if (img) {
            this.setImage(img);
        }
        //
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    }

    get cornerList() {
        return [...this.corners];
    }
    set cornerList(corners) {
        this.corners = corners;
        //dirty: relies on corner order set in setImage()
        this.cornerLT = corners[0];
        this.cornerRT = corners[1];
        this.cornerRB = corners[2];
        this.cornerLB = corners[3];
    }

    get midpointList() {
        this._updateMidPoints();//TODO: make it so you dont have to update everytime its retrieved
        return this.midpoints;
    }

    _updateMidPoints() {
        this.midpointT = this.cornerLT.midpointTo(this.cornerRT);
        this.midpointR = this.cornerRB.midpointTo(this.cornerRT);
        this.midpointB = this.cornerLB.midpointTo(this.cornerRB);
        this.midpointL = this.cornerLB.midpointTo(this.cornerLT);
        this.midpoints = [this.midpointT, this.midpointR, this.midpointB, this.midpointL];
    }

    get handleList() {
        this._updateMidPoints();//TODO: refactor so dont have to update every time
        return [this.corners, this.midpoints].flat();
    }

    isCorner(handle) {
        return this.corners.includes(handle);
    }

    isMidpoint(handle) {
        return this.midpoints.includes(handle);
    }

    checkPoints() {
        this.corners.forEach(c => {
            c.x = Math.clamp(c.x, 0, this.width);
            c.y = Math.clamp(c.y, 0, this.height);
        });
    }

    setImage(img) {
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
        this.corners = [this.cornerLT, this.cornerRT, this.cornerRB, this.cornerLB];
        //
        this._updateMidPoints();
    }

    getIndex(x, y, width) {
        if (!isNumber(x)) {
            let v = x;
            x = v.x;
            y = v.y;
        }
        //2024-01-30: copied from https://stackoverflow.com/a/35690009/2336212
        return 4 * (x + y * width);
    };

    /**
     * Pull vector from the original image
     * @param {number} px Percent X: 0 = left, 1 = right
     * @param {*} py Percent Y: 0 = top, 1 = bottom
     */
    pullVector(px, py) {
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
        //return
        return pt;
    }

    pullPixel(x, y) {
        //pull pixel
        let index = this.getIndex(x, y, this.width);
        return this.imgData.data.slice(index, index + 4);
    }

    getDir(from, to) {
        let dir = to.clone();
        dir.sub(from);
        return dir;
    }

    convertToAspectRatio(width = 1, height = 1) {
        //find longest edge
        let longestEdge = 0;
        let cornerCount = this.corners.length;
        for (let i = 0; i < cornerCount; i++) {
            let c1 = this.corners[i];
            let i2 = (i + 1) % cornerCount;
            let c2 = this.corners[i2];
            let edge = c1.distanceTo(c2);
            longestEdge = Math.max(edge, longestEdge);
        }
        //calculate resolution
        let w = width;
        let h = height;
        if (width > height) {
            w = longestEdge;
            h = w * height / width;
        }
        else {
            h = longestEdge;
            w = h * width / height;
        }
        //convert
        return this.convertToResolution(w, h);
    }

    convertToResolution(width, height) {
        //defaults
        width ??= Math.max(this.cornerLT.distanceTo(this.cornerRT), this.cornerLB.distanceTo(cornerRB));
        height ??= Math.max(this.cornerLT.distanceTo(this.cornerLB), this.cornerRT.distanceTo(this.cornerRB));
        //
        const canvas = this.canvas;
        const ctx = this.ctx;
        canvas.width = width;
        canvas.height = height;
        const imgData = ctx.getImageData(0, 0, width, height);
        for (let i = 0; i < width; i++) {// "<=" ?
            for (let j = 0; j < height; j++) {// "<=" ?
                const pt = this.pullVector(i / width, j / height);
                pt.x = Math.round(pt.x);
                pt.y = Math.round(pt.y);
                const pixel = this.pullPixel(pt.x, pt.y);
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


    flip(flipX, flipY) {
        const width = this.width;
        const height = this.height;
        this.corners.forEach(corner => {
            if (flipX) {
                corner.x = width - corner.x;
            }
            if (flipY) {
                corner.y = height - corner.y;
            }
        });
        if (flipX) {
            let swapT = this.cornerLT;
            this.cornerLT = this.cornerRT;
            this.cornerRT = swapT;

            let swapB = this.cornerLB;
            this.cornerLB = this.cornerRB;
            this.cornerRB = swapB;
        }
        if (flipY) {
            let swapL = this.cornerLT;
            this.cornerLT = this.cornerLB;
            this.cornerLB = swapL;

            let swapR = this.cornerRT;
            this.cornerRT = this.cornerRB;
            this.cornerRB = swapR;
        }
        this.corners = [this.cornerLT, this.cornerRT, this.cornerRB, this.cornerLB];
    }

}
