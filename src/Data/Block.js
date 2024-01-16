"use strict";

let stringifyBlock = [
    "_scale",
    "_position",
    "units",
];

class Block {
    constructor(scale) {
        this._scale = scale ?? _one.clone();
        this.units = "feet";

        this._position = new Vector3();

        this.onSizeChanged = new Delegate("scale");
        this.onPositionChanged = new Delegate("position");
    }

    get scale() {
        return this._scale;
    }
    set scale(value) {
        this._scale.copy(value);
        this.onSizeChanged.run(this._scale);
    }

    get width() {
        return this._scale.x;
    }
    set width(value) {
        this._scale.x = value;
        this.onSizeChanged.run(this._scale);
    }

    get length() {
        return this._scale.z;
    }
    set length(value) {
        this._scale.z = value;
        this.onSizeChanged.run(this._scale);
    }

    get height() {
        return this._scale.y;
    }
    set height(value) {
        this._scale.y = value;
        this.onSizeChanged.run(this._scale);
    }

    get position() {
        return this._position;
    }
    set position(value) {
        this._position.copy(value);
        this.onPositionChanged.run(this._position);
    }
}

/**
 * Call this inside subtype inflate...() method
 * it only does delegates
 */
function inflateBlock(block) {
    [
        "onSizeChanged",
        "onPositionChanged",
    ]
        .forEach(delkey => block[delkey] = new Delegate());

    Object.setPrototypeOf(block._position, Vector3.prototype);

    backwardsCompatify(block);

    Object.setPrototypeOf(block._scale, Vector3.prototype);

}

function backwardsCompatify(block) {
    //Change: _width, _length, _height --> _scale
    block._scale ??= _one.clone();
    if (block._width) {
        block._scale.x = block._width;
        block._width = undefined;
    }
    if (block._length) {
        block._scale.z = block._length;
        block._length = undefined;
    }
    if (block._height) {
        block._scale.y = block._height;
        block._height = undefined;
    }
}
