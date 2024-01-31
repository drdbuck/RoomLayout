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
        ctx.drawImage(this.imageEdit.original, 0, 0, this.canvas.width, this.canvas.height);
        ctx.strokeStyle = this.uiColor;
        ctx.fillStyle = this.uiColor;
        //Box path
        ctx.beginPath();
        ctx.moveTo(this.imageEdit.cornerLT.x, this.imageEdit.cornerLT.y);
        ctx.lineTo(this.imageEdit.cornerRT.x, this.imageEdit.cornerRT.y);
        ctx.lineTo(this.imageEdit.cornerRB.x, this.imageEdit.cornerRB.y);
        ctx.lineTo(this.imageEdit.cornerLB.x, this.imageEdit.cornerLB.y);
        ctx.lineTo(this.imageEdit.cornerLT.x, this.imageEdit.cornerLT.y);
        ctx.stroke();
        //Corners
        let cornerSize = 10;
        ctx.fillRect(this.imageEdit.cornerLT.x - cornerSize / 2, this.imageEdit.cornerLT.y - cornerSize / 2, cornerSize, cornerSize);
        ctx.fillRect(this.imageEdit.cornerLB.x - cornerSize / 2, this.imageEdit.cornerLB.y - cornerSize / 2, cornerSize, cornerSize);
        ctx.fillRect(this.imageEdit.cornerRT.x - cornerSize / 2, this.imageEdit.cornerRT.y - cornerSize / 2, cornerSize, cornerSize);
        ctx.fillRect(this.imageEdit.cornerRB.x - cornerSize / 2, this.imageEdit.cornerRB.y - cornerSize / 2, cornerSize, cornerSize);
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
        this.imageEdit.cornerLT = new Vector2(x, y);
        let imageURL = this.imageEdit.convertToResolution(500, 500);
        this.update();
        this.onEditChanged.run(imageURL);
    }
}
