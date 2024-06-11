"use strict";

const HANDLE_SIZE = 5;
const HANDLE_SELECT_RANGE = HANDLE_SIZE * 2;
const FACE_ZOOM_MAX = 2;
const FACE_ZOOM_MIN = 0.5;

class ControllerImageEdit {
    constructor(canvas, uiColor) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.uiColor = uiColor;
        this.imageEdit = new ImageEdit();

        this.canvasFactor = 1;
        this.zoom = 1;//changes with zoom buttons
        this.offset = _zero.clone();

        this.targetDimensions = _zero.clone();

        this.control = {
            handle: undefined,
            corners: [],
            origHandle: undefined,
        };

        this.prevContext = undefined;

        this.canvas.onmousedown = this.processMouseDown.bind(this);
        this.canvas.onmousemove = this.processMouseMove.bind(this);
        this.canvas.onmouseup = this.processMouseUp.bind(this);
        this.canvas.onmouseleave = this.processMouseLeave.bind(this);

        this.onEditChanged = new Delegate("imageURL");
    }

    setImage(img, resetSelection = false) {
        let setFunc = (_img) => {
            this.imageEdit.setImage(_img, resetSelection);
            this.canvas.width = _img.width;
            this.canvas.height = _img.height;
            if (this.savedCorners) {
                this.boomerangCorners(false);
            }
            this.canvasFactor = _img.width / 200;//dirty: hardcoded on-screen width of canvas
            this.update();
        };
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
        //clear
        ctx.clearRect(0, 0, width, height);
        //paint transparency grid
        const handleSize = HANDLE_SIZE * this.canvasFactor;
        ctx.fillStyle = "#555555";
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "#CCCCCC";
        let gridCountW = width / handleSize;
        let gridCountH = height / handleSize;
        for (let ix = 0; ix < gridCountW; ix++) {
            for (let iy = 0; iy < gridCountH; iy++) {
                //alternate where these sqaures are drawn
                if ((ix + iy) % 2 == 0) {
                    //draw the square
                    ctx.fillRect(ix * handleSize, iy * handleSize, handleSize, handleSize);
                }
            }
        }
        //
        ctx.strokeStyle = this.uiColor;
        ctx.fillStyle = this.uiColor;
        ctx.lineWidth = 1 * this.canvasFactor;
        //image
        ctx.drawImage(this.imageEdit.original, this.toX(0), this.toY(0), this.toWidth(width), this.toHeight(height));
        //Box path
        ctx.beginPath();
        let firstCorner = this.imageEdit.corners[0];
        ctx.moveTo(this.toX(firstCorner.x), this.toY(firstCorner.y));
        for (let i = 1; i < this.imageEdit.corners.length; i++) {
            let corner = this.imageEdit.corners[i];
            ctx.lineTo(this.toX(corner.x), this.toY(corner.y));
        }
        ctx.lineTo(this.toX(firstCorner.x), this.toY(firstCorner.y));
        ctx.stroke();

        //Draw handles
        const handleSizeHalf = handleSize / 2;
        let handles = [
            //corners
            this.imageEdit.corners,
            //midpoints
            this.imageEdit.midpointList
        ].flat();
        handles.forEach(
            handle => ctx.fillRect(
                this.toX(handle.x - handleSizeHalf),
                this.toY(handle.y - handleSizeHalf),
                handleSize,
                handleSize
            )
        );

        //Median line
        if (this.control.medianLine) {
            ctx.lineWidth = 0.5 * this.canvasFactor;
            ctx.beginPath();
            ctx.moveTo(this.toX(this.control.medianLine.start.x), this.toY(this.control.medianLine.start.y));
            ctx.lineTo(this.toX(this.control.medianLine.end.x), this.toY(this.control.medianLine.end.y));
            ctx.stroke();
        }
    }

    updateImage(context) {
        //early exit: no context
        if (!context?.validFaceIndex()) { return; }
        //set face
        let imageURL = context.Face;
        if (isValidImage(imageURL)) {
            this.setImage(imageURL, !context.equals(this.prevContext));
            this.prevContext = copyObject(context, stringifySelectContext);
        }
        this.targetDimensions = (context.face == FACE_DEFAULT)
            ? _zero.clone()
            : context.box?.getFaceDimensions(context.face) ?? _zero.clone();
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
        return new Vector2(this.fromX(x), this.fromY(y));
    }

    processMouseDown(e) {

        let mouse = this.getMouseVector(e);
        this.selectHandles(mouse);
        this.mouseDown = true;
    }
    processMouseMove(e) {
        let mouse = this.getMouseVector(e);
        if (this.mouseDown) {
            if (this.control.handle) {
                //Corner
                if (this.control.isCorner) {
                    mouse.add(this.offset);
                    this.control.handle.copy(mouse);
                    this.update();
                }
                //Midpoint
                else if (this.control.isMidpoint) {
                    let posOffset = mouse.clone();
                    posOffset.add(this.offset);

                    //determine closest point on median line to posOffset
                    let target = new Vector3();
                    let posOffset3 = new Vector3(posOffset.x, posOffset.y, 0);
                    let point3 = this.control.medianLine.closestPointToPoint(posOffset3, true, target);
                    let point = new Vector2(point3.x, point3.y);

                    //move median to that position
                    // this.control.handle.copy(point);

                    //determine location of corners
                    // let origTBar = new Line3(this.control.origCorners[0].clone(), this.control.origCorners[1].clone());
                    let moveDir = point.clone().sub(this.control.origHandle);
                    // let newTBar = new Line3(
                    //     this.control.origCorners[0].clone().add(moveDir),
                    //     this.control.origCorners[1].clone().add(moveDir)
                    // )
                    // let track1 = new Line3(this.control.stableCorners[0], this.control.origCorners[0]);
                    // let track2 = new Line3(this.control.stableCorners[1], this.control.origCorners[1]);
                    // this.control.corners[0].copy(intersectsLine(track1,newTBar));
                    // this.control.corners[1].copy(track2.intersects(newTBar));
                    this.control.corners[0].copy(this.control.origCorners[0].clone().add(moveDir));//temp
                    this.control.corners[1].copy(this.control.origCorners[1].clone().add(moveDir));//temp

                    //make sure points are within bounds
                    this.imageEdit.checkPoints();

                    //update
                    this.update();
                }
                //Unknown
                else {
                    console.error("unknown handle!", this.control.handle);
                }
            }
        }
        else {
            //change cursor style
            this.selectHandles(mouse);
            this.updateCursor();
        }
    }
    processMouseUp(e) {
        this.releaseHandles();
        // this.crop();
        this.update();
        this.mouseDown = false;
    }
    processMouseLeave(e) {
        this.releaseHandles();
        this.update();
        this.mouseDown = false;
    }

    selectHandles(mouse) {
        this.control.handle = undefined;
        this.offset = undefined;
        //select control handle
        let handles = this.imageEdit.handleList;
        const handleSelectRange = HANDLE_SELECT_RANGE * this.canvasFactor;
        handles.forEach(c =>
            c.dist = Math.sqrt(Math.pow(c.x - mouse.x, 2) + Math.pow(c.y - mouse.y, 2))
        );
        handles = handles.filter(c => c.dist <= handleSelectRange);
        if (handles.length > 0) {
            this.control.handle = handles.reduce((a, b) => (a.dist < b.dist) ? a : b);
            //find offset
            this.offset = this.control.handle.clone();
            this.offset.sub(mouse);
            this.control.isCorner = true;
            this.control.isMidpoint = false;
            this.control.medianLine = undefined;
            //midpoint selection
            if (this.imageEdit.isMidpoint(this.control.handle)) {
                this.control.isCorner = false;
                this.control.isMidpoint = true;

                this.control.origHandle = this.control.handle.clone();

                //corners
                this.control.corners = [];
                this.control.stableCorners = [];
                switch (this.control.handle) {
                    case this.imageEdit.midpointT:
                        this.control.corners = [this.imageEdit.cornerLT, this.imageEdit.cornerRT];
                        this.control.stableCorners = [this.imageEdit.cornerLB, this.imageEdit.cornerRB];
                        break;
                    case this.imageEdit.midpointR:
                        this.control.corners = [this.imageEdit.cornerRB, this.imageEdit.cornerRT];
                        this.control.stableCorners = [this.imageEdit.cornerLB, this.imageEdit.cornerLT];
                        break;
                    case this.imageEdit.midpointB:
                        this.control.corners = [this.imageEdit.cornerLB, this.imageEdit.cornerRB];
                        this.control.stableCorners = [this.imageEdit.cornerLT, this.imageEdit.cornerRT];
                        break;
                    case this.imageEdit.midpointL:
                        this.control.corners = [this.imageEdit.cornerLB, this.imageEdit.cornerLT];
                        this.control.stableCorners = [this.imageEdit.cornerRB, this.imageEdit.cornerRT];
                        break;
                    default:
                        console.error("unknown midpoint!", this.control.handle);
                        break;
                }

                //orig corners
                this.control.origCorners = this.control.corners
                    .map(c => copyObject(c, undefined, Vector2.prototype));

                //median line
                let rayStart = this.control.origHandle.clone();
                let rayEnd = this.control.stableCorners[0].midpointTo(this.control.stableCorners[1]);
                let rayDir = rayEnd.clone().sub(rayStart);

                //stretch median line to ends of image
                let width = this.imageEdit.width;
                let height = this.imageEdit.height;
                while (between(rayStart.x, 0, width) && between(rayStart.y, 0, height)) {
                    rayStart.sub(rayDir);
                }
                while (between(rayEnd.x, 0, width) && between(rayEnd.y, 0, height)) {
                    rayEnd.add(rayDir);
                }
                // rayDir = rayEnd.clone().sub(rayStart);
                // rayDir.normalize();
                // let medianLine = new Ray(rayStart, rayDir);
                let rayStart3 = new Vector3(rayStart.x, rayStart.y, 0);
                let rayEnd3 = new Vector3(rayEnd.x, rayEnd.y, 0);
                let medianLine = new Line3(rayStart3, rayEnd3);
                this.control.medianLine = medianLine;
            }
        }
    }
    releaseHandles() {
        this.control.medianLine = undefined;
        this.control.handle = undefined;
    }

    reset() {
        this.prevContext = undefined;
    }

    crop() {
        let imageURL = this.imageEdit.convertToAspectRatio(
            this.targetDimensions.x,
            this.targetDimensions.y
        );
        this.reset();
        this.onEditChanged.run(imageURL);
    }

    erase() {
        let imageURL = this.imageEdit.setTransparent();
        this.reset();
        this.onEditChanged.run(imageURL);
    }

    adjustOpacity(delta) {
        let imageURL = this.imageEdit.adjustOpacity(delta);
        this.onEditChanged.run(imageURL);
    }

    setZoom(zoom) {
        let prevZoom = this.zoom;
        this.zoom = Math.clamp(zoom, FACE_ZOOM_MIN, FACE_ZOOM_MAX);
        this.update();
        //TODO: change offset too
    }
    adjustZoom(factor) {
        this.setZoom(this.zoom * factor);
    }

    updateCursor() {
        let cursor = CURSOR_AUTO;
        switch (this.control.handle) {
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

    changeCursor(cursorStyle) {
        this.canvas.style.cursor = cursorStyle;
    }

    /**
     * Converts from image X to canvas X
     * @param {*} x 
     */
    toX(x) {
        return x * this.zoom;
    }
    /**
     * Converts from image Y to canvas Y
     * @param {*} y 
     */
    toY(y) {
        return y * this.zoom;
    }

    /**
     * Converts from image width to canvas width
     * @param {*} x 
     */
    toWidth(width) {
        return width * this.zoom;
    }
    /**
     * Converts from image height to canvas height
     * @param {*} x 
     */
    toHeight(height) {
        return height * this.zoom;
    }

    /**
     * Converts from canvas X to image X
     * @param {*} x 
     */
    fromX(x) {
        return x / this.zoom;
    }
    /**
    * Converts from canvas Y to image Y
    * @param {*} y 
    */
    fromY(y) {
        return y / this.zoom;
    }
}
