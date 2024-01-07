"use strict";

class Room {
    constructor(width, length, height) {
        this._width = width ?? 11;
        this._length = length ?? 12;
        this._height = height ?? 9;
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
