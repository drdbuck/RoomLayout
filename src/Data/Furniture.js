"use strict";

let stringifyFurniture = [
    "_faces",
    "defaultFace",
];

const FACE_DEFAULT = -1;

class Furniture extends Block {
    constructor(imageURL, width = 1, length = 1, height = 1) {
        super(new Vector3(width, height, length));

        this._faces = [];
        this.defaultFace = imageURL;

        this.onFaceChanged = new Delegate("index", "imageURL");
    }

    get faceList() {
        return this._faces;
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
            this.defaultFace = imageURL;
        }
        else {
            this._faces[index] = imageURL;
        }
        this.onFaceChanged.run(index, imageURL);
    }

    validFaceIndex(index) {
        return index == FACE_DEFAULT || between(index, 0, 6 - 1);//dirty: hardcoding 6-sided shape
    }
}

function inflateFurniture(furniture) {

    let inflated = inflateObject(furniture, Furniture.prototype, ["onFaceChanged"]);
    if (!inflated) { return; }
    inflateBlock(furniture);

    backwardsCompatifyFurniture(furniture);

}

function backwardsCompatifyFurniture(furniture) {
    //Change: imageURL --> faces[]
    if (furniture.imageURL) {
        furniture.faces ??= [];
        furniture.faces.push(furniture.imageURL);
        furniture.imageURL = undefined;
    }
    //Change: add defaultFace
    furniture.defaultFace ??= furniture.faces[2] ?? furniture.faces[0];
    //Change: faces[] -> _faces[]
    furniture._faces ??= furniture.faces;
}
