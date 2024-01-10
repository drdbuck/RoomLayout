"use strict";

let stringifyBlock = [
    "_width",
    "_length",
    "_height",
    "units",
];

class Block {
    constructor(width = 1, length = 1, height = 1) {
        this._width = width;
        this._length = length;
        this._height = height;
        this.units = "feet";
        this.onSizeChanged = new Delegate("width", "length", "height");
    }

    get width() {
        return this._width;
    }
    set width(value) {
        this._width = value;
        this.onSizeChanged.run(this._width, this._length, this._height);
    }

    get length() {
        return this._length;
    }
    set length(value) {
        this._length = value;
        this.onSizeChanged.run(this._width, this._length, this._height);
    }

    get height() {
        return this._height;
    }
    set height(value) {
        this._height = value;
        this.onSizeChanged.run(this._width, this._length, this._height);
    }
}

/**
 * Call this inside subtype inflate...() method
 * it only does delegates
 */
function inflateBlock(block) {
    [
        "onSizeChanged",
    ]
        .forEach(delkey => block[delkey] = new Delegate());

    Object.setPrototypeOf(this._position, Vector3.prototype);
}
