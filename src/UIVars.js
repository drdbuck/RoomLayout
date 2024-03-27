"use strict";

let stringifyUIVars = [
    "_editRooms",
    "_editObjects",
    "_editFaces",
    "_highlightSelectedFace",
    "_view",
];

const VIEW_OVERHEAD = 1;
const VIEW_FIRSTPERSON = 2;

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

        this._view = VIEW_OVERHEAD;
        this.onViewChanged = new Delegate("view");

        ///

        this.nextUid = 1;

        this.undoEnabled = true;

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

    get view() {
        return this._view;
    }
    set view(value) {
        if (![VIEW_OVERHEAD, VIEW_FIRSTPERSON].includes(value)) {
            console.error("unknown view!", value);
            return;
        }
        //
        this._view = value;
        this.onViewChanged.run(this._view);
    }
    get viewInOverhead() {
        return this.view == VIEW_OVERHEAD;
    }
    set viewInOverhead(value = !this.viewInOverhead) {
        this.view = (value) ? VIEW_OVERHEAD : VIEW_FIRSTPERSON;
    }

    giveUids(obj) {
        //give uid
        if (!obj.uid) {
            obj.uid = this.nextUid;
            this.nextUid++;
        }
        //check for more objects
        //if house
        obj.rooms?.forEach(room => this.giveUids(room));
        //if room
        obj.furnitures?.forEach(furniture => this.giveUids(furniture));
        //if kitbash
        obj.items?.forEach(item => this.giveUids(item));
    }

    findUid(obj, uid) {
        if (obj.uid == uid) {
            return obj;
        }
        //
        let retobj;
        //house
        retobj = obj.rooms
            ?.map(room => this.findUid(room, uid))
            .filter(room => room)
            .at(0);
        if (retobj) { return retobj; }
        //room
        retobj = obj.furnitures
            ?.map(furniture => this.findUid(furniture, uid))
            .filter(furniture => furniture)
            .at(0);
        if (retobj) { return retobj; }
        //kitbash
        retobj = obj.items
            ?.map(item => this.findUid(item, uid))
            .filter(item => item)
            .at(0);
        if (retobj) { return retobj; }
        //not found
        return undefined;
    }
}

function inflateUIVars(uiVars) {
    inflateObject(
        uiVars,
        UIVars.prototype,
        [
            "onEditRoomsChanged",
            "onEditObjectsChanged",
            "onEditFacesChanged",
            "onHighlightSelectedFaceChanged",
            "onViewChanged",
        ]
    );
}
