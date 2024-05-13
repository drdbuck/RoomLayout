"use strict";

let stringifyBox = [
    "_faces",
];

const FACE_DEFAULT = -1;

class Box extends Block {
    constructor(width = 1, length = 1, height = 1) {
        super(new Vector3(width, height, length));

        this._scaleTop = undefined;
        this._positionTop = undefined;

        this._faces = [];

        this.onScaleTopChanged = new Delegate("scaleTop");
        this.onPositionTopChanged = new Delegate("positionTop");
        this.onFaceChanged = new Delegate("index", "imageURL");

        this.bind_ScaleFactorChanged = this.onScaleFactorChanged.bind(this);
        this.bind_GroupPositionChanged = this.onGroupPositionChanged.bind(this);
        this.bind_GroupAngleChanged = this.onGroupAngleChanged.bind(this);

        //processing variables
        this.lastImage = undefined;
    }

    get worldScale() {
        if (!this._validGroup) {
            return this.scale;
        }
        return this.scale.clone().multiplyScalar(this.group.scaleFactor);
    }

    get worldPosition() {
        if (!this._validGroup) {
            return this.position;
        }
        // (pos^gangle * factor) + gpos
        let groupPos = this.group.position;
        let groupScaleFactor = this.group.scaleFactor;
        let groupAngle = degToRad(this.group.angle);
        let pos = this.position.clone();
        return pos.applyAxisAngle(_up, groupAngle).multiplyScalar(groupScaleFactor).add(groupPos);
    }
    set worldPosition(value) {
        if (!this._validGroup) {
            this.position = value;
            return;
        }
        // ((wpos - gpos) / factor)^-gangle
        let groupPos = this.group.position;
        let groupScaleFactor = this.group.scaleFactor;
        let groupAngle = degToRad(this.group.angle);
        let worldPos = value.clone();
        this.position = worldPos.sub(groupPos).divideScalar(groupScaleFactor).applyAxisAngle(_up, -groupAngle);
    }

    get worldAngle() {
        if (!this._validGroup) {
            return this.angle;
        }
        return this.group.angle + this.angle;
    }

    get worldScaleTop() {
        if (!this._validGroup) {
            return this._scaleTop;
        }
        return this._scaleTop.clone().multiplyScalar(this.group.scaleFactor);
    }

    get worldPositionTop() {
        let pos = this.worldPosition;
        if (this._positionTop) {
            pos.add(this._positionTop);
        }
        return pos;
    }

    get scaleTop() {
        return this._scaleTop;
    }
    set scaleTop(value) {
        this._scaleTop = value;
        this.onScaleTopChanged.run(this._scaleTop);
    }

    get positionTop() {
        return this._positionTop;
    }
    set positionTop(value) {
        this._positionTop = value;
        this.onPositionTopChanged.run(this._positionTop);
    }

    get defaultFace() {
        if (!this._validGroup) {
        }
        return this.group?.defaultFace
            ?? PIXEL_WHITE;
    }
    set defaultFace(value) {
        if (!this._validGroup) {
            return;
        }
        this.group.defaultFace = value;
    }

    get faceList() {
        return [...this._faces];
    }

    getFace(index) {
        if (index == FACE_DEFAULT) {
            return this.defaultFace;
        }
        return this._faces[index];
    }
    setFace(index, imageURL) {
        //error checking
        if (index < 0 && index != FACE_DEFAULT) {
            console.error("Invalid index!", index);
            return;
        }
        //
        if (index == FACE_DEFAULT) {
            console.error("cant set default face on box! must set on group", index, this.name);
        }
        else {
            if (!isValidImage(imageURL) && this._faces[index]) {
                this.lastImage = this._faces[index];
            }
            this._faces[index] = imageURL;
        }
        if (isValidImage(imageURL)) {
            this.lastImage = imageURL;
        }
        this.onFaceChanged.run(index, imageURL);
    }

    getFaceDimensions(index) {
        //dirty: assumes 6-sided shape
        switch (index) {
            case FACE_DEFAULT:
                return _zero;
            case 0:
                // "Right";
                return new Vector2(this.depth, this.height);
            case 1:
                // "Left";
                return new Vector2(this.depth, this.height);
            case 2:
                // "Top";
                return new Vector2(this.width, this.depth);
            case 3:
                // "Bottom";
                return new Vector2(this.width, this.depth);
            case 4:
                // "Back";
                return new Vector2(this.width, this.height);
            case 5:
                // "Front";
                return new Vector2(this.width, this.height);
            default:
                console.error("Unknown index:", index);
        }
    }

    getValidFaceIndexes() {
        const sideCount = 6;//dirty: assumes 6 sides
        let validList = [...Array(sideCount).keys()]
            .map(n => this.getFaceDimensions(n))
            .map(v => v.x > 0 && v.y > 0)
            .map((b, i) => (b) ? i : undefined)
            .filter(i => i >= 0);
        //if only two valid faces,
        if (validList.length == 2) {
            //only keep the one (to avoid user confusion while editing)
            validList = [validList[0]];
        }
        return validList;
    }

    validFaceIndex(index) {
        return index == FACE_DEFAULT || between(index, 0, 6 - 1);//dirty: hardcoding 6-sided shape
    }

    onScaleFactorChanged(scale) {
        this.onSizeChanged.run(this.scale);
    }
    onGroupPositionChanged(pos) {
        this.onPositionChanged.run(this.position);
    }
    onGroupAngleChanged(angle) {
        this.onAngleChanged.run(this.angle);
    }

    get _validGroup() {
        if (!this.group) {
            console.error("box with no group!", this.name);
            return false;
        }
        return true;
    }
}

function inflateBox(box) {

    let inflated = inflateObject(
        box,
        Box.prototype,
        [
            "onFaceChanged",
            "onScaleTopChanged",
            "onPositionTopChanged",
        ]
    );
    if (!inflated) { return; }
    inflateBlock(box);

    backwardsCompatifyBox(box);

    box.bind_ScaleFactorChanged = box.onScaleFactorChanged.bind(box);
    box.bind_GroupPositionChanged = box.onGroupPositionChanged.bind(box);
    box.bind_GroupAngleChanged = box.onGroupAngleChanged.bind(box);

}

function backwardsCompatifyBox(box) {
}
