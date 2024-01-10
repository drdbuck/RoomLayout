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

    //Early exit
    if (!furniture) {
        console.error("Cannot inflate null furniture!", furniture);
        return;
    }

    //Prototype
    Object.setPrototypeOf(furniture, Furniture.prototype);

}
