"use strict";

class ControllerImageEdit {
    constructor(canvas, uiColor) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.uiColor = uiColor;
        this.imageEdit = new ImageEdit();

        this.canvas.onclick = this.processMouseClick.bind(this);

        this.onEditChanged = new Delegate("imageURL");
    }

    setImage(img) {
        let setFunc = (_img) => {
            this.imageEdit.setImage(_img);
            this.canvas.width = _img.width;
            this.canvas.height = _img.height;
            this.update();
        }
        if (isString(img)) {
            let image = new Image();
            image.src = img;
            image.onload = () => setFunc(image);
        }
        else {
            setFunc(img);
        }
    }

    update() {
        let ctx = this.ctx;
        let width = this.canvas.width;
        let height = this.canvas.height;
        ctx.strokeStyle = this.uiColor;
        ctx.fillStyle = this.uiColor;
        //clear
        ctx.clearRect(0, 0, width, height);
        //image
        ctx.drawImage(this.imageEdit.original, 0, 0, width, height);
        //Box path
        ctx.beginPath();
        let firstCorner = this.imageEdit.corners[0];
        ctx.moveTo(firstCorner.x, firstCorner.y);
        for (let i = 1; i < this.imageEdit.corners.length; i++){
            let corner = this.imageEdit.corners[i];
            ctx.lineTo(corner.x, corner.y);
        }
        ctx.lineTo(firstCorner.x, firstCorner.y);
        ctx.stroke();
        //Corners
        let cornerSize = 10;
        this.imageEdit.corners.forEach(
            corner => ctx.fillRect(
                corner.x - cornerSize / 2,
                corner.y - cornerSize / 2,
                cornerSize,
                cornerSize
            )
        );
    }

    updateImage(context) {
        let furniture = context.obj;
        let faceIndex = context.face;
        if (faceIndex >= -1) {
            let imageURL = (faceIndex >= 0) ? furniture.faces[faceIndex] : furniture.defaultFace;
            if (imageURL) {
                this.setImage(imageURL);
            }
        }
    }

    processMouseClick(e) {
        //2024-01-30: copied from https://stackoverflow.com/a/18053642/2336212
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.imageEdit.width / rect.width);
        const y = (e.clientY - rect.top) * (this.imageEdit.height / rect.height);
        //
        this.imageEdit.cornerLT.set(x, y);
        this.update();
        let imageURL = this.imageEdit.convertToResolution(500, 500);
        this.onEditChanged.run(imageURL);
    }
}
