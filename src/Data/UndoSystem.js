"use strict";

class UndoSystem {
    /**
     * Create an undo system
     * @param {() => *} recordFunc Gets called in recordUndo(), should return an object to save
     * @param {string} stringify What to pass into the stringify param for JSON
     * @param {(obj: *) => void} retrieveFunc Gets called in undo() and redo(), should accept an object to load
     */
    constructor(recordFunc, stringify, retrieveFunc) {
        this.recordFunc = recordFunc;
        this.stateList = [];
        this.stringify = stringify;
        this.index = -1;
        this.retrieveFunc = retrieveFunc;

        this.recordUndo();
    }

    recordUndo(changeName) {
        let obj = this.recordFunc();
        let state = new UndoState(obj, this.stringify, changeName);
        this.index++;
        this.stateList[this.index] = state;
        //remove any states after this index
        this.stateList.length = this.index + 1;

        return state;
    }

    undo() {
        this._goToState(this.index - 1);
    }

    redo() {
        this._goToState(this.index + 1);
    }

    _goToState(index) {
        let prevIndex = this.index;
        this.index = Math.clamp(index, 0, this.stateList.length - 1);
        //
        if (this.index == prevIndex) { return; }
        //
        let state = this.stateList[this.index];
        let obj = state.obj;
        this.retrieveFunc(obj);
    }

    get state() {
        return this.stateList[this.index];
    }
}
