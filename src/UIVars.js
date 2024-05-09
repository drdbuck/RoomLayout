"use strict";

let stringifyUIVars = [
    "_editRooms",
    "_editObjects",
    "_editBoxes",
    "_viewPanelFace",
    "_viewPanelFaceEdit",
    "_highlightSelectedFace",
    "_viewId",
    "_views",
    //
    "_selection",
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

        this._editBoxes = true;
        this.onEditBoxesChanged = new Delegate("editBoxes");

        this._viewPanelFace = true;
        this.onViewPanelFaceChanged = new Delegate("viewPanelFace");
        this._viewPanelFaceEdit = false;
        this.onViewPanelFaceEditChanged = new Delegate("viewPanelFaceEdit");

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

        this.undoEnabled = true;

        this.selector = new Selector();
        const root = house;//dirty: hardcoded
        this.selector.selectAll(
            this._selection
                .filter(c => inflateSelectContext(c, this))
        );

        //init uids
        this.nextUid = 1;
        this.clearUids(root);
        this.giveUids(root);
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

    get editBoxes() {
        return this._editBoxes;
    }
    set editBoxes(value) {
        //enforce boolean
        value = !!value;
        //
        this._editBoxes = value;
        this.onEditBoxesChanged.run(this._editBoxes);
    }

    get viewPanelFace() {
        return this._viewPanelFace;
    }
    set viewPanelFace(value) {
        //enforce boolean
        value = !!value;
        //
        this._viewPanelFace = value;
        this.onViewPanelFaceChanged.run(this._viewPanelFace);
    }
    get viewPanelFaceEdit() {
        return this._viewPanelFaceEdit;
    }
    set viewPanelFaceEdit(value) {
        //enforce boolean
        value = !!value;
        //
        this._viewPanelFaceEdit = value;
        this.onViewPanelFaceEditChanged.run(this._viewPanelFaceEdit);
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

    clearUids(obj) {
        //give uid
        obj.uid = undefined;
        //check for more objects
        //if house
        obj.rooms?.forEach(room => this.clearUids(room));
        //if room
        obj.furnitures?.forEach(box => this.clearUids(box));
        //if kitbash
        obj.items?.forEach(item => this.clearUids(item));
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
        obj.furnitures?.forEach(box => this.giveUids(box));
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
            ?.map(box => this.findUid(box, uid))
            .filter(box => box)
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
        this._selection = this.selector.selection;
    }
}

function inflateUIVars(uiVars) {
    inflateObject(
        uiVars,
        UIVars.prototype,
        [
            "onEditRoomsChanged",
            "onEditObjectsChanged",
            "onEditBoxesChanged",
            "onViewPanelFaceChanged",
            "onViewPanelFaceEditChanged",
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
        stringifySelectContext,
    ].flat();
}
