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
