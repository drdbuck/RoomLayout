"use strict";

class ImageEdit {
    constructor(img) {
        if (img) {
            this.setImage(img);
        }
        //
        //this canvas is for utility purposes only!
        //it is volatile and not meant for storing any image
        //use this.imgData for getting the stored image
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    }

    get cornerList() {
        return [...this.corners];
    }
    set cornerList(corners) {
        this.corners = corners;
        this._listToCorners();
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

    _cornersToList() {
        this.corners = [this.cornerLT, this.cornerRT, this.cornerRB, this.cornerLB];
    }
    _listToCorners() {
        this.cornerLT = this.corners[0];
        this.cornerRT = this.corners[1];
        this.cornerRB = this.corners[2];
        this.cornerLB = this.corners[3];
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

    setImage(img, resetCorners = false) {
        this.original = img;
        this.imgData = getImageData(this.original);
        this.width = img.width;
        this.height = img.height;
        //points that define where to pull pixels from
        //default: use whole image
        if (resetCorners || !this.corners) {
            this.cornerLT = new Vector2(0, 0);
            this.cornerLB = new Vector2(0, this.height);
            this.cornerRT = new Vector2(this.width, 0);
            this.cornerRB = new Vector2(this.width, this.height);
            this._cornersToList();
            //
            this._updateMidPoints();
        }
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

    convertToAspectRatio(width = 0, height = 0) {
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
        //
        width ||= longestEdge;
        height ||= longestEdge;
        //calculate resolution
        let w = width || longestEdge;
        let h = height || longestEdge;
        if (width > height) {
            w = longestEdge;
            h = w * height / width;
        }
        else if (height > width) {
            h = longestEdge;
            w = h * width / height;
        }
        else {
            w = longestEdge;
            h = longestEdge;
        }
        //convert
        return this.convertToResolution(w, h);
    }

    convertToResolution(width, height) {
        //defaults
        width ??= Math.max(this.cornerLT.distanceTo(this.cornerRT), this.cornerLB.distanceTo(this.cornerRB));
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

    setTransparent() {
        const canvas = this.canvas;
        const ctx = this.ctx;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        const width = Math.max(this.cornerLT.distanceTo(this.cornerRT), this.cornerLB.distanceTo(this.cornerRB));
        const height = Math.max(this.cornerLT.distanceTo(this.cornerLB), this.cornerRT.distanceTo(this.cornerRB));
        const imgData = this.imgData;
        const blankPixel = new Uint8ClampedArray(0, 0, 0, 0);
        for (let i = 0; i < width; i++) {// "<=" ?
            for (let j = 0; j < height; j++) {// "<=" ?
                const pt = this.pullVector(i / width, j / height);
                pt.x = Math.round(pt.x);
                pt.y = Math.round(pt.y);
                this.pushPixel(imgData, blankPixel, pt.x, pt.y);
            }
        }
        ctx.putImageData(imgData, 0, 0);
        return canvas.toDataURL();
    }

    adjustOpacity(delta) {
        const canvas = this.canvas;
        const ctx = this.ctx;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        const width = Math.max(this.cornerLT.distanceTo(this.cornerRT), this.cornerLB.distanceTo(this.cornerRB));
        const height = Math.max(this.cornerLT.distanceTo(this.cornerLB), this.cornerRT.distanceTo(this.cornerRB));
        const imgData = this.imgData;
        for (let i = 0; i < width; i++) {// "<=" ?
            for (let j = 0; j < height; j++) {// "<=" ?
                const pt = this.pullVector(i / width, j / height);
                pt.x = Math.round(pt.x);
                pt.y = Math.round(pt.y);
                const pixel = this.pullPixel(pt.x, pt.y);
                if (pixel[3] > 0) {
                    pixel[3] = Math.clamp(pixel[3] + delta, 10, 255);
                }
                this.pushPixel(imgData, pixel, pt.x, pt.y);
            }
        }
        ctx.putImageData(imgData, 0, 0);
        return canvas.toDataURL();
    }

    adjustBrightness(delta) {
        const canvas = this.canvas;
        const ctx = this.ctx;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        const width = Math.max(this.cornerLT.distanceTo(this.cornerRT), this.cornerLB.distanceTo(this.cornerRB));
        const height = Math.max(this.cornerLT.distanceTo(this.cornerLB), this.cornerRT.distanceTo(this.cornerRB));
        const imgData = this.imgData;
        for (let i = 0; i < width; i++) {// "<=" ?
            for (let j = 0; j < height; j++) {// "<=" ?
                const pt = this.pullVector(i / width, j / height);
                pt.x = Math.round(pt.x);
                pt.y = Math.round(pt.y);
                let pixel = this.pullPixel(pt.x, pt.y);
                // if (pixel.slice(0, 3).every(v => Math.between(v + delta, 0, 255))) {
                let alpha = pixel[3];
                pixel = pixel.map(v => v + delta);
                pixel[3] = alpha;
                // }
                this.pushPixel(imgData, pixel, pt.x, pt.y);
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
        this._cornersToList();
    }

    rotate(degrees) {
        if (!(degrees % 90 == 0)) {
            console.error("degrees must be a multiple of 90!", degrees);
            return;
        }
        const width = this.width;
        const height = this.height;
        const centerOld = new Vector2(width / 2, height / 2);
        const centerNew = new Vector2(height / 2, width / 2);
        const rotationCount = ((360 + degrees) % 360) / 90;//make sure its positive
        const rotatePoint = (v) => {
            return new Vector2(-v.y, v.x);
        };
        //
        let newCorners = this.corners
            //rotate vectors
            .map(corner => {
                let cv = corner.clone();
                cv.sub(centerOld);
                for (let i = 0; i < rotationCount; i++) {
                    cv = rotatePoint(cv);
                }
                cv.add(centerNew);
                return cv;
            })
            //switch corners
            .map((c, i, arr) => arr[(i + rotationCount) % arr.length]);
        this.cornerList = newCorners;
    }

}
