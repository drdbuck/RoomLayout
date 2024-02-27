"use strict";

let stringifyUIVars = [
    "_editFaces",
];

const PIXEL_TRANSPARENT = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAANSURBVBhXY2BgYGAAAAAFAAGKM+MAAAAAAElFTkSuQmCC';

/**
 * Stores temporary variables that describe the current state of the UI
 * Might be saved out for the purposes of picking back up where the user last was in the previous session
 */
class UIVars {
    constructor() {
        this._editFaces = false;
        this.onEditFacesChanged = new Delegate("editFaces");

        this._highlightSelectedFace = false;
        this.onHighlightSelectedFaceChanged = new Delegate("highSelectedFace");

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

    get highlightSelectedFace() {
        return this._highlightSelectedFace;
    }
    set highlightSelectedFace(value) {
        //enforce boolean
        value = !!value;
        //
        this._highlightSelectedFace = value;
        this.onHighlightSelectedFaceChanged.run(this._highlightSelectedFace);
    }
}
