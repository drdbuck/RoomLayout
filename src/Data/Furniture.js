"use strict";

let stringifyFurniture = [
    "imageURL",
];

class Furniture extends Block {
    constructor(imageURL, width = 1, length = 1, height = 1) {
        super(width, length, height);

        this.imageURL = imageURL;
        this.image = undefined;//
    }
}

function inflateFurniture(furniture) {

    let inflated = inflateObject(furniture, Furniture.prototype);
    if (!inflated) { return; }
    inflateBlock(furniture);

}
