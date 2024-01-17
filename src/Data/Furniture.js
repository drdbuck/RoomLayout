"use strict";

let stringifyFurniture = [
    "faces",
];

class Furniture extends Block {
    constructor(imageURL, width = 1, length = 1, height = 1) {
        super(new Vector3(width, height, length));

        this.faces = [
            imageURL,
        ];
    }
}

function inflateFurniture(furniture) {

    let inflated = inflateObject(furniture, Furniture.prototype);
    if (!inflated) { return; }
    inflateBlock(furniture);

    backwardsCompatify(furniture);

}

function backwardsCompatify(furniture) {
    //Change: imageURL --> faces[]
    if (furniture.imageURL) {
        furniture.faces ??= [];
        furniture.faces.push(furniture.imageURL);
        furniture.imageURL = undefined;
    }
}
