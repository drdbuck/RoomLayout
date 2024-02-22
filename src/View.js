"use strict";

class View {
    constructor(position, quaternion) {
        this._position = position;
        this._quaternion = quaternion;
    }

    get position() {
        return this._position;
    }
    set position(value) {
        this._position.copy(value);
    }

    get quaternion() {
        return this._quaternion;
    }
    set quaternion(value) {
        this._quaternion.copy(value);
    }
}
