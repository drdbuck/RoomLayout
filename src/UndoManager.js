"use strict";

const stringifyUndo = [
    "uid",
    //undo state
    "root",
    "selection",
    //select context
    "uid_obj",
    "uid_furniture",
    "uid_kitbash",
    "face",
];

class UndoManager {
    constructor() {
        this._undoSystem = new UndoSystem(
            () => {
                return {
                    root: house,//can't call it "house" because of circular references
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
            getDataStringify().concat(stringifyUndo),
            (obj) => {
                let selection = obj.selection;
                uiVars.selector.clear();
                //
                house = obj.root;
                inflateHouse(house);
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
    }

    recordUndo() {
        if (!uiVars.undoEnabled) { return; }//TEMP: while the undo system is still not optimized
        this._undoSystem.recordUndo();

        //
        player.animate();//dirty: this doesn't belong here
    }

    undo() {
        if (!uiVars.undoEnabled) { return; }//TEMP: while the undo system is still not optimized
        this._undoSystem.undo();
    }

    redo() {
        if (!uiVars.undoEnabled) { return; }//TEMP: while the undo system is still not optimized
        this._undoSystem.redo();
    }

}
