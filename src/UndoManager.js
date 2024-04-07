"use strict";

const stringifyUndo = [
    "uid",
    "imageIds",
    "defaultImageId",
    //undo state
    "root",
    "selection",
];

class UndoManager {
    constructor() {

        //store imageURLs separately so they don't take up space in the undo state
        this.imageURLs = [];

        //init undo system

        //make stringify variable for undo system
        let exclude = [
            "_faces",
            "defaultFace",
        ];
        let stringify = [
            getDataStringify(),
            stringifyUndo,
            stringifySelectContext,
        ]
            .flat(Infinity)
            .filter(str => !exclude.includes(str));

        //UndoSystem()
        const undoManager = this;
        this._undoSystem = new UndoSystem(
            () => {
                const root = house;
                undoManager._injectImageIds(root);
                return {
                    root: root,//can't call it "house" because of circular references
                    selection: uiVars.selector.selection,
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
                let contexts = selection.filter(c => inflateSelectContext(c, uiVars));
                uiVars.selector.selectAll(contexts);
            }
        );

        //Delegates
        this.onUndo = new Delegate("undoState");
        this.onRedo = new Delegate("undoState");
        this.onRecordUndo = new Delegate();
    }

    /**
     * Records the current state into the undo stream
     * @param {string} changeName A label for what changed (ex: "create object")
     */
    recordUndo(changeName) {
        if (!uiVars.undoEnabled) { return; }//TEMP: while the undo system is still not optimized
        let undoState = this._undoSystem.recordUndo(changeName);

        //
        player.animate();//dirty: this doesn't belong here
        this.onRecordUndo.run();
        return undoState;
    }

    undo() {
        if (!uiVars.undoEnabled) { return; }//TEMP: while the undo system is still not optimized
        this._undoSystem.undo();
        this.onUndo.run(this._undoSystem.state);
    }

    redo() {
        if (!uiVars.undoEnabled) { return; }//TEMP: while the undo system is still not optimized
        this._undoSystem.redo();
        this.onRedo.run(this._undoSystem.state);
    }

    get stateIndex() {
        return this._undoSystem.index;
    }
    get stateCount() {
        return this._undoSystem.stateList.length;
    }
    getState(offset = 0) {
        let index = this._undoSystem.index + offset;
        return this._undoSystem.stateList[index];
    }
    getStateLabel(offset = 0) {
        let index = this._undoSystem.index + offset;
        return this._undoSystem.stateList[index]?.changeName ?? "";
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
