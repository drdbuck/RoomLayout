"use strict";

class UndoManager {
    constructor() {
        this._undoSystem = new UndoSystem(
            () => house,
            getDataStringify().concat(["uid"]),
            (obj) => {
                let selection = controllerEdit.selector.selection;
                controllerEdit.selector.clear();
                //
                house = obj;
                inflateHouse(house);
                let scene = construct(house);
                player.setScene(scene);
                controllerEdit.scene = scene;
                //re-hook up selection
                let contexts = [];
                selection.forEach(c => {
                    let context = {};
                    if (c.obj) {
                        let uid = c.obj.uid;
                        let obj = uiVars.findUid(house, uid);
                        context.obj = obj;
                        context.box = getBox(obj);
                    }
                    if (!context.obj) {
                        return;
                    }
                    if (c.furniture) {
                        let uid = c.furniture.uid;
                        let obj = uiVars.findUid(house, uid);
                        context.furniture = obj;
                        context.box = getBox(obj);
                    }
                    if (c.kitbash) {
                        let uid = c.kitbash.uid;
                        let obj = uiVars.findUid(house, uid);
                        context.kitbash = obj;
                        context.boxes = getBoxes(obj.items);
                    }
                    context.boxes ??= [context.box];
                    context.face = c.face;
                    context.offset = c.offset;
                    contexts.push(context);
                });
                    controllerEdit.selector.selectAll(contexts);
            }
        );
    }

    recordUndo() {
        if (!uiVars.undoEnabled) { return; }//TEMP: while the undo system is still not optimized
        this._undoSystem.recordUndo();
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
