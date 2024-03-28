"use strict";

let stringifyUIVars = [
    "_editRooms",
    "_editObjects",
    "_editFaces",
    "_highlightSelectedFace",
    "_viewId",
    "_views",
    //
    "_selection",
    "oId",
    "fId",
    "kbId",
    "face",
];

const VIEW_OVERHEAD = 0;
const VIEW_FIRSTPERSON = 1;
const viewOverhead = new View(new Vector3(0, 10, 0), new Quaternion(-0.7, 0, 0, 0.7));
const viewImmersive = new View(new Vector3(0, 5, 0), new Quaternion(0, 0, 0, 1));

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

        //View
        this._views = [];
        this._views[VIEW_OVERHEAD] = viewOverhead;
        this._views[VIEW_FIRSTPERSON] = viewImmersive;
        this._viewId = VIEW_OVERHEAD;
        this._view = this._views[this._viewId];
        this.onViewIdChanged = new Delegate("viewId", "view");

        //
        // this.selector = new Selector();
        this._selection = [];

        ///


        this.init();

    }
    init() {

        this.nextUid = 1;

        this.undoEnabled = true;

        this.selector = new Selector();
    }
    init2(root) {
        this.selector.selectAll(
            this._selection
                .map(c => {
                    let context = {
                        obj: this.findUid(root, c.oId),
                        furniture: this.findUid(root, c.fId),
                        kitbash: this.findUid(root, c.kbId),
                        face: c.face,
                        offset: _zero.clone(),
                    };
                    if (!context.obj) { return; }
                    context.box = getBox(context.furniture ?? context.kitbash.items?.[0] ?? context.obj);
                    context.boxes = getBoxes(context.kitbash?.items);
                    if (context.boxes.length == 0) {
                        context.boxes = [context.box];
                    }
                    if (!context.box) { return; }
                    if (!context.boxes) { return; }
                    return context;
                })
                .filter(c => c)
        );
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
    get viewId() {
        return this._viewId;
    }
    set viewId(value) {
        if (!this._views[value]) {
            console.error("unknown viewId!", value);
            return;
        }
        //
        this._viewId = value;
        this._view = this._views[this._viewId];
        this.onViewIdChanged.run(this._viewId, this._view);
    }
    get viewInOverhead() {
        return this.viewId == VIEW_OVERHEAD;
    }
    set viewInOverhead(value = !this.viewInOverhead) {
        this.viewId = (value) ? VIEW_OVERHEAD : VIEW_FIRSTPERSON;
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

    prepareForSave() {
        this._selection = this.selector.map(c => {
            return {
                oId: c.obj.uid,
                fId: c.furniture?.uid,
                kbId: c.kitbash?.uid,
                face: c.face,
            };
        });
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
            "onViewIdChanged",
        ]
    );

    uiVars._views.forEach(view => {
        inflateView(view);
    })

    uiVars.init();
}

function getDataStringifyUIVars() {
    return [
        stringifyUIVars,
        stringifyView,
        stringifyVector3,
    ].flat();
}
