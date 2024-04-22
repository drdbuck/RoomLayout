"use strict";

const stringifySelectContext = [
    "uid_obj",
    "uid_box",
    "uid_kitbash",
    "face",
]

class SelectContext {
    constructor(select, face = -2) {
        this.obj = select;
        this.box = undefined;
        this.kitbash = undefined;
        this.mesh = undefined;
        this.meshes = undefined;
        this.face = face;
        this.offset = _zero.clone();
    }

    grabInfo() {
        this.grabIds();
        this.grabBoxes();
    }

    grabIds() {
        this.uid_obj = this.obj.uid;
        this.uid_box = this.box?.uid;
        this.uid_kitbash = this.kitbash?.uid;
    }

    grabBoxes() {
        this.mesh = getBox(this.box ?? this.kitbash?.items[0] ?? this.obj);
        this.meshes = getBoxes(this.kitbash?.items);
        if (this.meshes.length == 0) {
            this.meshes = [this.mesh];
        }
        return this.mesh && this.meshes.length > 0;
    }

    inflate(uiVars) {
        if (this.uid_obj) {
            let uid = this.uid_obj;
            let obj = uiVars.findUid(house, uid);
            this.obj = obj;
        }
        if (this.uid_box) {
            let uid = this.uid_box;
            let obj = uiVars.findUid(house, uid);
            this.box = obj;
        }
        if (this.uid_kitbash) {
            let uid = this.uid_kitbash;
            let obj = uiVars.findUid(house, uid);
            this.kitbash = obj;
        }
        //
        this.offset = _zero.clone();
        //
        let meshesGrabbed = this.grabBoxes();
        //
        return this.obj && meshesGrabbed;
    }
}

function inflateSelectContext(context, uiVars){
    inflateObject(context, SelectContext.prototype);
    return context.inflate(uiVars);
}
