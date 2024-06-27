"use strict";

const stringifyBox = [
    "_faces",
    "_scaleTop",
    "_positionTop",
    "_degrees",
];

const delegateListBox = [
    "onFaceChanged",
    "onScaleTopChanged",
    "onPositionTopChanged",
    "onDegreesChanged",
];

const FACE_DEFAULT = -1;
const FACE_NONE = -2;

class Box extends Block {
    constructor(width = 1, length = 1, height = 1) {
        super(new Vector3(width, height, length));

        this._scaleTop = undefined;
        this._positionTop = undefined;

        this._degrees = undefined;

        this._faces = [];

        this.units = UNITS_INCHES;

        this.onScaleTopChanged = new Delegate("scaleTop");
        this.onPositionTopChanged = new Delegate("positionTop");
        this.onDegreesChanged = new Delegate("degrees");
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
            return this._scaleTop.clone();
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
        return this._scaleTop ?? this.scale.clone();
    }
    set scaleTop(value) {
        this._scaleTop = value;
        this.onScaleTopChanged.run(this._scaleTop);
    }

    get widthTop() {
        return this._scaleTop?.x ?? this.scale.x;
    }
    set widthTop(value) {
        value ||= 0;//NaN prevention
        value ||= this.scale.x;
        this._scaleTop ??= this.scale.clone();
        this._scaleTop.x = value;
        this.onScaleTopChanged.run(this._scaleTop);
    }

    get depthTop() {
        return this._scaleTop?.z ?? this.scale.z;
    }
    set depthTop(value) {
        value ||= 0;//NaN prevention
        value ||= this.scale.z;
        this._scaleTop ??= this.scale.clone();
        this._scaleTop.z = value;
        this.onScaleTopChanged.run(this._scaleTop);
    }

    get positionTop() {
        return this._positionTop ?? _zero.clone();
    }
    set positionTop(value) {
        this._positionTop = value;
        this.onPositionTopChanged.run(this._positionTop);
    }

    get degrees() {
        return this._degrees;
    }
    set degrees(value) {
        this._degrees = loopAngle(value);
        this.onDegreesChanged.run(this._degrees);
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

    get faceListCompiled() {
        const sideCount = 6;
        let faceList = this.faceList;
        for (let i = 0; i < sideCount; i++) {
            faceList[i] = (this.validFaceIndex(i)) ? faceList[i] : PIXEL_TRANSPARENT;
        }
        return faceList;
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
        return validList;
    }

    validFaceIndex(index) {
        let faceDimensions = this.getFaceDimensions(index);
        return index == FACE_DEFAULT || between(index, 0, 6 - 1) && faceDimensions.x > 0 && faceDimensions.y > 0;//dirty: hardcoding 6-sided shape
    }

    hasInside() {
        return false
            //box is not a rectangle
            || (this.width > 0 && this.depth > 0 && this.height > 0)
            //or has an invisible face
            || this.getValidFaceIndexes().some(i => this.getFace(i) == PIXEL_TRANSPARENT);
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
        delegateListBox
    );
    if (!inflated) { return; }
    inflateBlock(box);

    backwardsCompatifyBox(box);

    if (box._scaleTop) {
        validifyVector3(box._scaleTop, 1);
    }
    if (box._positionTop) {
        validifyVector3(box._positionTop, 0);
    }

    box.bind_ScaleFactorChanged = box.onScaleFactorChanged.bind(box);
    box.bind_GroupPositionChanged = box.onGroupPositionChanged.bind(box);
    box.bind_GroupAngleChanged = box.onGroupAngleChanged.bind(box);

}

function backwardsCompatifyBox(box) {
}
