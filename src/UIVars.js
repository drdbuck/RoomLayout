"use strict";

let stringifyUIVars = [
    "_editFaces",
];

/**
 * Stores temporary variables that describe the current state of the UI
 * Might be saved out for the purposes of picking back up where the user last was in the previous session
 */
class UIVars{
    constructor() {
        this._editFaces = false;

        this.onEditFacesChanged = new Delegate("editFaces");
    }

    get editFaces() {
        return this._editFaces;
    }

    set editFaces(value) {
        //enforce boolean
        value = !!value;
        //
        this._editFaces = value;
        this.onEditFacesChanged.run(this._editFaces);
    }
}
