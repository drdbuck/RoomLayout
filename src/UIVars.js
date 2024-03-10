"use strict";

let stringifyUIVars = [
    "_editObjects",
    "_editFaces",
    "_highlightSelectedFace",
];

/**
 * Stores temporary variables that describe the current state of the UI
 * Might be saved out for the purposes of picking back up where the user last was in the previous session
 */
class UIVars {
    constructor() {

        this._editRooms = false;
        this.onEditRoomsChanged = new Delegate("editRooms");

        this._editObjects = true;
        this.onEditObjectsChanged = new Delegate("editObjects");

        this._editFaces = true;
        this.onEditFacesChanged = new Delegate("editFaces");

        this._highlightSelectedFace = false;
        this.onHighlightSelectedFaceChanged = new Delegate("highSelectedFace");

    }

    get editRooms() {
        return this._editRooms;
    }
    set editRooms(value) {
        //enforce boolean
        value = !!value;
        //
        this._editRooms = value;
        this.onEditRoomsChanged.run(this._editRooms);
    }

    get editObjects() {
        return this._editObjects;
    }
    set editObjects(value) {
        //enforce boolean
        value = !!value;
        //
        this._editObjects = value;
        this.onEditObjectsChanged.run(this._editObjects);
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
