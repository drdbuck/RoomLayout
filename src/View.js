"use strict";

const stringifyView = [
    "_position",
    "_quaternion",
];

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

function inflateView(view) {
    inflateObject(view, View.prototype);

    inflateObject(view._position, Vector2.prototype);
    view._quaternion = new Quaternion(...view._quaternion);//convert from stored array to quaternion
}
