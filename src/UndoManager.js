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
