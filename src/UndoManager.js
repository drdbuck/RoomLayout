"use strict";

class UndoManager {
    constructor() {
        this._undoSystem = new UndoSystem(
            () => house,
            getDataStringify().concat(["uid"]),
            (obj) => {
                house = obj;
                inflateData(house);
                let scene = construct(house);
                player.setScene(scene);
                //re-hook up selection
                controllerEdit.selector.forEach(c => {
                    if (c.obj) {
                        let uid = c.obj.id;
                        let obj = uiVars.findUid(house, uid);
                        c.obj = obj;
                        c.box = getBox(obj);
                    }
                    if (c.furniture) {
                        let uid = c.furniture.id;
                        let obj = uiVars.findUid(house, uid);
                        c.furniture = obj;
                        c.box = getBox(obj);
                    }
                    if (c.kitbash) {
                        let uid = c.kitbash.id;
                        let obj = uiVars.findUid(house, uid);
                        c.kitbash = obj;
                        c.boxes = getBoxes(obj.items);
                    }
                });
                //remove contexts that can't be found
                controllerEdit.selector.filter(c => c.obj);
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
