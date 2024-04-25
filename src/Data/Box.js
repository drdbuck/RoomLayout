"use strict";

let stringifyBox = [
    "_faces",
];

const FACE_DEFAULT = -1;

class Box extends Block {
    constructor(width = 1, length = 1, height = 1) {
        super(new Vector3(width, height, length));

        this._faces = [];

        this.onFaceChanged = new Delegate("index", "imageURL");

        this.bind_ScaleFactorChanged = onScaleFactorChanged.bind(this);

        //processing variables
        this.lastImage = undefined;
    }

    get defaultFace() {
        if (!this.group) {
            console.error("box with no group!", this.name);
        }
        return this.group?.defaultFace
            ?? this.defaultFace //semi backwards compatibility
            ?? PIXEL_WHITE;
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
                this.lastImage = this._faces[index]
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

    get scaledScale(){
        let scale = this.group?.scaleFactor ?? 1;
        return this.scale.clone().multiplyScalar(scale);
    }

    onScaleFactorChanged(scale){
        this.onSizeChanged(scale);
    }
}

function inflateBox(box) {

    let inflated = inflateObject(box, Box.prototype, ["onFaceChanged"]);
    if (!inflated) { return; }
    inflateBlock(box);

    backwardsCompatifyBox(box);

}

function backwardsCompatifyBox(box) {
}
