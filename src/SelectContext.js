"use strict";

const stringifySelectContext = [
    "uid_obj",
    "uid_box",
    "uid_kitbash",
    "face",
];

class SelectContext {
    constructor(select, face = -2, autoGrab = true) {
        this.obj = select;
        this.box = undefined;
        this.kitbash = undefined;
        this.mesh = undefined;
        this.meshes = undefined;
        this.meshBounds = undefined;
        this.face = face;
        this.offset = _zero.clone();
        this.stable = true;
        //
        if (autoGrab) {
            if (this.obj.isKitBash || this.obj._items) {
                this.kitbash = this.obj;
            }
            else {
                this.box = this.obj;
                this.kitbash = this.obj.group;
            }
            this.grabInfo();
        }
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
        if (this.obj.isKitBash) {
            this.meshes = getBoxes(this.kitbash.items);
        }
        else {
            this.meshes = [this.mesh];
        }
        this.mesh ??= this.meshes[0];
        this.meshBounds = getBoxBounds(this.kitbash);
        return this.mesh && this.meshes.length > 0;
    }

    inflate(uiVars) {
        if (this.uid_obj) {
            let uid = this.uid_obj;
            let obj = uiVars.findUid(house, uid);
            this.obj = obj;
        }
        if (!this.obj) {
            console.error("unable to find object with id", this.uid_obj);
            return;
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
        if (!this.kitbash) {
            console.error("unable to find kitbash with id", this.uid_kitbash);
            return;
        }
        //
        this.offset = _zero.clone();
        //
        let meshesGrabbed = this.grabBoxes();
        //
        return this.obj && meshesGrabbed;
    }
}

function inflateSelectContext(context, uiVars) {
    if (!context) {
        console.error("must pass in a context!", context);
        return;
    }
    inflateObject(context, SelectContext.prototype);
    return context.inflate(uiVars);
}
