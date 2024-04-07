"use strict";

const stringifySelectContext = [
    "uid_obj",
    "uid_furniture",
    "uid_kitbash",
    "face",
]

class SelectContext {
    constructor(select, face = -2) {
        this.obj = select;
        this.furniture = undefined;
        this.kitbash = undefined;
        this.box = undefined;
        this.boxes = undefined;
        this.face = face;
        this.offset = _zero.clone();
    }

    grabInfo() {
        this.grabIds();
        this.grabBoxes();
    }

    grabIds() {
        this.uid_obj = this.obj.uid;
        this.uid_furniture = this.furniture?.uid;
        this.uid_kitbash = this.kitbash?.uid;
    }

    grabBoxes() {
        this.box = getBox(this.furniture ?? this.kitbash?.items[0] ?? this.obj);
        this.boxes = getBoxes(this.kitbash?.items);
        if (this.boxes.length == 0) {
            this.boxes = [this.box];
        }
        return this.box && this.boxes.length > 0;
    }

    inflate(uiVars) {
        if (this.uid_obj) {
            let uid = this.uid_obj;
            let obj = uiVars.findUid(house, uid);
            this.obj = obj;
        }
        if (this.uid_furniture) {
            let uid = this.uid_furniture;
            let obj = uiVars.findUid(house, uid);
            this.furniture = obj;
        }
        if (this.uid_kitbash) {
            let uid = this.uid_kitbash;
            let obj = uiVars.findUid(house, uid);
            this.kitbash = obj;
        }
        //
        this.offset = _zero.clone();
        //
        let boxesGrabbed = this.grabBoxes();
        //
        return this.obj && boxesGrabbed;
    }
}

function inflateSelectContext(context, uiVars){
    inflateObject(context, SelectContext.prototype);
    return context.inflate(uiVars);
}
