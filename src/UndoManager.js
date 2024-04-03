"use strict";

const stringifyUndo = [
    "uid",
    "imageIds",
    "defaultImageId",
    //undo state
    "root",
    "selection",
    //select context
    //REMINDER: variables added here need to be set in the parameter passed into the UndoSystem constructor
    "uid_obj",
    "uid_furniture",
    "uid_kitbash",
    "face",
];

class UndoManager {
    constructor() {

        //store imageURLs separately so they don't take up space in the undo state
        this.imageURLs = [];

        //init undo system

        //make stringify variable for undo system
        let stringify = [
            getDataStringify(),
            stringifyUndo
        ].flat(Infinity);
        [
            "_faces",
            "defaultFace",
        ].forEach(attr => stringify.remove(attr));

        //UndoSystem()
        const undoManager = this;
        this._undoSystem = new UndoSystem(
            () => {
                const root = house;
                undoManager._injectImageIds(root);
                return {
                    root: root,//can't call it "house" because of circular references
                    selection: uiVars.selector.selection.map(c => {
                        return {
                            uid_obj: c.obj.uid,
                            uid_furniture: c.furniture?.uid,
                            uid_kitbash: c.kitbash?.uid,
                            face: c.face,
                        };
                    }),
                };
            },
            stringify,
            (obj) => {
                let selection = obj.selection;
                uiVars.selector.clear();
                //
                house = obj.root;
                inflateHouse(house);
                undoManager._inflateImageIds(house);
                let scene = construct(house);
                player.setScene(scene);
                controllerEdit.scene = scene;
                //re-hook up selection
                let contexts = [];
                selection.forEach(c => {
                    let context = {};
                    if (c.uid_obj) {
                        let uid = c.uid_obj;
                        let obj = uiVars.findUid(house, uid);
                        context.obj = obj;
                        context.box = getBox(obj);
                    }
                    if (!context.obj) {
                        return;
                    }
                    if (c.uid_furniture) {
                        let uid = c.uid_furniture;
                        let obj = uiVars.findUid(house, uid);
                        context.furniture = obj;
                        context.box = getBox(obj) ?? context.box;
                    }
                    if (c.uid_kitbash) {
                        let uid = c.uid_kitbash;
                        let obj = uiVars.findUid(house, uid);
                        context.kitbash = obj;
                        context.boxes = getBoxes(obj.items);
                    }
                    context.boxes ??= [context.box];
                    if (!context.box) {
                        return;
                    }
                    if (!(context.boxes?.length > 0)) {
                        return;
                    }
                    context.face = c.face;
                    context.offset = new Vector2();
                    contexts.push(context);
                });
                uiVars.selector.selectAll(contexts);
            }
        );

        //Delegates
        this.onUndo = new Delegate();
        this.onRedo = new Delegate();
        this.onRecordUndo = new Delegate();
    }

    recordUndo() {
        if (!uiVars.undoEnabled) { return; }//TEMP: while the undo system is still not optimized
        this._undoSystem.recordUndo();

        //
        player.animate();//dirty: this doesn't belong here
        this.onRecordUndo.run();
    }

    undo() {
        if (!uiVars.undoEnabled) { return; }//TEMP: while the undo system is still not optimized
        this._undoSystem.undo();
        this.onUndo.run();
    }

    redo() {
        if (!uiVars.undoEnabled) { return; }//TEMP: while the undo system is still not optimized
        this._undoSystem.redo();
        this.onRedo.run();
    }

    get stateIndex() {
        return this._undoSystem.index;
    }
    get stateCount() {
        return this._undoSystem.stateList.length;
    }

    _recordImageURL(imageURL) {
        if (!this.imageURLs.includes(imageURL)) {
            this.imageURLs.push(imageURL);
        }
        let index = this.imageURLs.indexOf(imageURL);
        return index;
    }
    _retrieveImageURL(index) {
        return this.imageURLs[index];
    }

    _injectImageIds(obj) {
        //inject image id
        if (obj._faces) {
            obj.imageIds = obj._faces.map(f => this._recordImageURL(f));
        }
        if (obj.defaultFace) {
            obj.defaultImageId = this._recordImageURL(obj.defaultFace);
        }
        //check for more objects
        //if house
        obj.rooms?.forEach(room => this._injectImageIds(room));
        //if room
        obj.furnitures?.forEach(furniture => this._injectImageIds(furniture));
        //if kitbash
        obj.items?.forEach(item => this._injectImageIds(item));
    }
    _inflateImageIds(obj) {
        //inflate image id
        if (obj.imageIds) {
            obj._faces = obj.imageIds.map(id => this._retrieveImageURL(id));
        }
        if (obj.defaultImageId != undefined) {
            obj.defaultFace = this._retrieveImageURL(obj.defaultImageId);
        }
        //check for more objects
        //if house
        obj.rooms?.forEach(room => this._inflateImageIds(room));
        //if room
        obj.furnitures?.forEach(furniture => this._inflateImageIds(furniture));
        //if kitbash
        obj.items?.forEach(item => this._inflateImageIds(item));
    }

}
