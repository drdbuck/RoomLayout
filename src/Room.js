"use strict";

class Room {
    constructor() {
        this._width = 11;
        this._height = 12;
        this.units = "feet";
        this.onSizeChanged = new Delegate("width", "height");
    }

    get width() {
        return this._width;
    }
    set width(value) {
        this._width = value;
        this.onSizeChanged.run(this._width, this._height);
    }

    get height() {
        return this._height;
    }
    set height(value) {
        this._height = value;
        this.onSizeChanged.run(this._width, this._height);
    }
}
