"use strict";

class UndoManager {
    constructor() {
        this._undoSystem = new UndoSystem(
            () => house,
            getDataStringify().concat(["uid"]),
            (obj) => {
                controllerEdit.selector.clear();
                house = obj;
                inflateHouse(house);
                let scene = construct(house);
                player.setScene(scene);
                controllerEdit.scene = scene;
                //re-hook up selection
                setTimeout(() => {
                    return false;
                let contexts = [];
                controllerEdit.selector.forEach(c => {
                    let context = {};
                    if (c.obj) {
                        let uid = c.obj.id;
                        let obj = uiVars.findUid(house, uid);
                        context.obj = obj;
                        context.box = getBox(obj);
                    }
                    if (c.furniture) {
                        let uid = c.furniture.id;
                        let obj = uiVars.findUid(house, uid);
                        context.furniture = obj;
                        context.box = getBox(obj);
                    }
                    if (c.kitbash) {
                        let uid = c.kitbash.id;
                        let obj = uiVars.findUid(house, uid);
                        context.kitbash = obj;
                        context.boxes = getBoxes(obj.items);
                    }
                    context.boxes ??= [context.box];
                    context.face = c.face;
                    contexts.push(context);
                });
                controllerEdit.selector.clear();
                    controllerEdit.selector.selectAll(contexts);
                }, 1000);//dirty: using timeout instead of listening for async func to finish (waiting for construct edge to return)
            }
        );
    }

    recordUndo() {
        this._undoSystem.recordUndo();
    }

    undo() {
        this._undoSystem.undo();
    }

    redo() {
        this._undoSystem.redo();
    }

}
