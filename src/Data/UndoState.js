"use strict";

class UndoState {
    constructor(obj, stringify, changeName = "") {
        this.json = JSON.stringify(obj, stringify);
        this.changeName = changeName;
    }

    get obj() {
        return JSON.parse(this.json);
    }
}
