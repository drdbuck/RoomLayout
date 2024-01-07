"use strict";

let stringifyFurniture = [
    "imageURL",
];

class Furniture extends Block {
    constructor(imageURL, width, length, height) {
        super(width, length, height);

        this.imageURL = imageURL;
        this.image = undefined;//
    }
}
