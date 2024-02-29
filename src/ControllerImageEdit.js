"use strict";

const HANDLE_SIZE = 5;
const HANDLE_SELECT_RANGE = HANDLE_SIZE * 2;

class ControllerImageEdit {
    constructor(canvas, uiColor) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.uiColor = uiColor;
        this.imageEdit = new ImageEdit();

        this.canvasFactor = 1;

        this.defaultTargetDimensions = new Vector2(5, 5);
        this.targetDimensions = this.defaultTargetDimensions.clone();

        this.control = {
            corner: undefined,
        };

        this.canvas.onmousedown = this.processMouseDown.bind(this);
        this.canvas.onmousemove = this.processMouseMove.bind(this);
        this.canvas.onmouseup = this.processMouseUp.bind(this);

        this.onEditChanged = new Delegate("imageURL");
    }

    setImage(img) {
        let setFunc = (_img) => {
            this.imageEdit.setImage(_img);
            this.canvas.width = _img.width;
            this.canvas.height = _img.height;
            if (this.savedCorners) {
                this.boomerangCorners(false);
            }
            this.canvasFactor = _img.width / 200;//dirty: hardcoded on-screen width of canvas
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
        ctx.lineWidth = 1 * this.canvasFactor;
        //clear
        ctx.clearRect(0, 0, width, height);
        //image
        ctx.drawImage(this.imageEdit.original, 0, 0, width, height);
        //Box path
        ctx.beginPath();
        let firstCorner = this.imageEdit.corners[0];
        ctx.moveTo(firstCorner.x, firstCorner.y);
        for (let i = 1; i < this.imageEdit.corners.length; i++) {
            let corner = this.imageEdit.corners[i];
            ctx.lineTo(corner.x, corner.y);
        }
        ctx.lineTo(firstCorner.x, firstCorner.y);
        ctx.stroke();

        //Draw handles
        const handleSize = HANDLE_SIZE * this.canvasFactor;
        const handleSizeHalf = handleSize / 2;
        let handles = [
            //corners
            this.imageEdit.corners,
            //midpoints
            this.imageEdit.midpointList
        ].flat();
        handles.forEach(
            handle => ctx.fillRect(
                handle.x - handleSizeHalf,
                handle.y - handleSizeHalf,
                handleSize,
                handleSize
            )
        );
    }

    updateImage(context) {
        if (!context) { return; }
        let furniture = context.furniture;
        let faceIndex = context.face;
        if (!furniture.validFaceIndex(faceIndex)) { return; }
        let imageURL = furniture.getFace(faceIndex);
        if (isValidImage(imageURL)) {
            this.setImage(imageURL);
        }
        this.targetDimensions = furniture.getFaceDimensions(faceIndex);
        this.targetDimensions.x ||= this.defaultTargetDimensions.x;
        this.targetDimensions.y ||= this.defaultTargetDimensions.y;
    }

    //dirty: boomerang'ing
    boomerangCorners(outBound = true) {
        if (outBound) {
            this.savedCorners = this.imageEdit.cornerList;
        }
        else {
            this.imageEdit.cornerList = this.savedCorners;
            this.savedCorners = undefined;
        }
    }

    getMouseVector(e) {
        //2024-01-30: copied from https://stackoverflow.com/a/18053642/2336212
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.imageEdit.width / rect.width);
        const y = (e.clientY - rect.top) * (this.imageEdit.height / rect.height);
        return new Vector2(x, y);
    }

    processMouseDown(e) {

        let mouse = this.getMouseVector(e);
        this.selectCorners(mouse);
        this.mouseDown = true;
    }
    processMouseMove(e) {
        let mouse = this.getMouseVector(e);
        if (this.mouseDown) {
            if (this.control.corner) {
            mouse.add(this.offset);
            this.control.corner.copy(mouse);
            this.update();
            }
        }
        else {
            //change cursor style
            this.selectCorners(mouse);
            let cursor = CURSOR_AUTO;
            switch (this.control.corner) {
                case this.imageEdit.cornerLT:
                case this.imageEdit.cornerRB:
                    cursor = CURSOR_RESIZE_DIAGONAL_LEFT;
                    break;
                case this.imageEdit.cornerRT:
                case this.imageEdit.cornerLB:
                    cursor = CURSOR_RESIZE_DIAGONAL_RIGHT;
                    break;
                case this.imageEdit.midpointT:
                case this.imageEdit.midpointB:
                    cursor = CURSOR_RESIZE_VERTICAL;
                    break;
                case this.imageEdit.midpointR:
                case this.imageEdit.midpointL:
                    cursor = CURSOR_RESIZE_HORIZONTAL;
                    break;
                default:
                    break;
            }
            this.changeCursor(cursor);
        }
    }
    processMouseUp(e) {
        this.update();
        // this.crop();
        this.mouseDown = false;
    }

    selectCorners(mouse) {
        this.control.corner = undefined;
        this.offset = undefined;
        //select control corner
        let handles = this.imageEdit.handleList;
        const handleSelectRange = HANDLE_SELECT_RANGE * this.canvasFactor;
        handles.forEach(c =>
            c.dist = Math.sqrt(Math.pow(c.x - mouse.x, 2) + Math.pow(c.y - mouse.y, 2))
        );
        handles = handles.filter(c => c.dist <= handleSelectRange);
        if (handles.length > 0) {
            this.control.corner = handles.reduce((a, b) => (a.dist < b.dist) ? a : b);
            //find offset
            this.offset = this.control.corner.clone();
            this.offset.sub(mouse);
        }
    }

    crop() {
        let imageURL = this.imageEdit.convertToAspectRatio(
            this.targetDimensions.x,
            this.targetDimensions.y
        );
        this.onEditChanged.run(imageURL);
    }

    changeCursor(cursorStyle) {
        this.canvas.style.cursor = cursorStyle;
    }
}
