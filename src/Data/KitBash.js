"use strict";

const stringifyKitBash = [
    "_items",
];

class KitBash extends Block {
    constructor(items = []) {
        super();

        this.isKitBash = true;

        this._items = [];
        items.filter(i => i).forEach(item => this.add(item));

        //Position
        let pos = _zero.clone();
        let sumX = this._items.sum(f => f.position.x);
        pos.x = sumX / this._items.length;
        let sumZ = this._items.sum(f => f.position.z);
        pos.z = sumZ / this._items.length;
        let minY = this._items.min(f => f.altitude);
        pos.y = minY;
        this._position.copy(pos);

        //Rotation
        let sumAngle = this._items.sum(f => loopAngle(f.angle));
        this._angle = sumAngle / this._items.length;

        //Scale
        //TODO: account for rotation of individual parts
        let maxHalfWidth = this._items.max(f => pos.distanceTo(f.position) + (f.width / 2));
        let maxHalfDepth = this._items.max(f => pos.distanceTo(f.position) + (f.depth / 2));

        //Delegates
        this.onItemAdded = new Delegate("item");
        this.onItemRemoved = new Delegate("item");
        this.onFaceChanged = new Delegate("index", "imageURL");
    }

    get items() {
        return [...this._items];
    }

    add(item) {
        //early exit: invalid item
        if (!item) { return; }
        //early exit: item is kitbash
        if (item.isKitBash) { return; }
        //
        //tell item its in a new group now
        item.group = this;
        //
        if (!this._items.includes(item)) {
            this._items.push(item);
            //remove from other group if necessary
            item.group?.remove(item);
            //register delegate
            item.onFaceChanged.add(this.onFaceChanged.run);
            //
            this.onItemAdded.run(item);
        }
    }

    remove(item) {
        if (item?.group == this) {
            item.group = undefined;
        }
        if (this._items.includes(item)) {
            this._items.remove(item);
            //unregister delegate
            item.onFaceChanged.remove(this.onFaceChanged.run);
            //
            this.onItemRemoved.run(item);
        }
    }

    has(item) {
        return this._items.includes(item);
    }

    //Position
    get position() {
        let pos = new Vector2();
        let sumX = this._items.sum(f => f.position.x);
        pos.x = sumX / this._items.length;
        let sumZ = this._items.sum(f => f.position.z);
        pos.z = sumZ / this._items.length;
        let minY = this._items.min(f => f.altitude);
        pos.y = minY;
        return pos;
    }
    set position(value) {
        //get offset
        const oldPos = this.position;
        let offset = value.clone();
        offset.subtract(oldPos);
        //offset each individual piece of furniture
        this._items.forEach(item => {
            let newPos = item.position.clone();
            newPos.add(offset);
            item.position = newPos;
        });
        //delegate
        super.position = value;
    }

    //Rotation
    get angle() {
        let sumAngle = this._items.sum(f => loopAngle(f.angle));
        return sumAngle / this._items.length;
    }
    set angle(value) {
        const oldAngle = this.angle;
        let offset = n - oldAngle;
        const center = this.position;
        this._items.forEach(item => {
            //update angle
            item.angle += offset;
            //update position
            let poffset = item.position.clone();
            poffset.sub(c.center);
            let radians = toRadians(offset);
            poffset.applyAxisAngle(_up, radians);
            poffset.add(c.center);
            item.position = poffset;
        });
        super.angle = value;
    }

    //Scale
    get scale() {
        let width = this.width;
        let depth = this.depth;
        let height = this.height;
        return new Vector2(width, height, depth);
    }
    set scale(value) {
        this.width = value.x;
        this.depth = value.z;
        this.height = value.y;
        //
        super.scale = value;
    }

    get width() {
        //TODO: calculate size
        return this._items[0].width;
    }
    set width(value) {
        const oldWidth = this.width;
        const factor = value / oldWidth;
        const center = this.position;
        this._items.forEach(item => {
            //adjust dimensions
            item.width *= factor;
            //move
            //TODO: account for rotation
            let offset = item.position.clone();
            offset.subtract(center);
            offset.x *= factor;
            offset.add(center);
            item.position = offset;
        });
        super.width = value;
    }

    get depth() {
        //TODO: calculate size
        return this._items[0].depth;
    }
    set depth(value) {
        const prev = this.depth;
        let factor = value / prev;
        this._items.forEach(item => {
            //adjust dimensions
            item.depth *= factor;
            //move
            //TODO: account for rotation
            let offset = item.position.clone();
            offset.subtract(center);
            offset.z *= factor;
            offset.add(center);
            item.position = offset;
        });
        super.depth = value;
    }

    get length() {
        //TODO: calculate size
        return this._items[0].length;
    }
    set length(value) {
        const prev = this.length;
        let factor = value / prev;
        this._items.forEach(item => {
            //adjust dimensions
            item.length *= factor;
            //move
            //TODO: account for rotation
            let offset = item.position.clone();
            offset.subtract(center);
            offset.z *= factor;
            offset.add(center);
            item.position = offset;
        });
        super.length = value;
    }

    get height() {
        //TODO: account for rotation / recline
        return this._items.max(f => f.altitude + f.height) - this.altitude;
    }
    set height(value) {
        const prev = this.height;
        let factor = value / prev;
        this._items.forEach(item => {
            //adjust dimensions
            item.height *= factor;
            //move
            //TODO: account for rotation / recline
            let offset = item.position.clone();
            offset.subtract(center);
            offset.y *= factor;
            offset.add(center);
            item.position = offset;
        });
        super.height = value;
    }


    get faceList() {
        return this._items.map(i => i.faceList).flat();
    }

    getFace(index) {
        //dirty: using only first item
        return this._items[0].getFace(index);

        // if (index == FACE_DEFAULT) {
        //     return this.defaultFace;
        // }
        // return this._faces[index];
    }
    setFace(index, imageURL) {
        //error checking
        if (index < 0 && index != FACE_DEFAULT) {
            console.error("Invalid index!", index);
            return;
        }
        //

        //dirty: using only first item
        return this._items[0].setFace(index, imageURL);
    }

    getFaceDimensions(index) {
        //dirty: using only first item instead of selected one
        return this._items[0].getFaceDimensions(index);
    }
    validFaceIndex(index) {
        //dirty: using only first item instead of selected one
        return this._items[0].validFaceIndex(index);
    }

}

function inflateKitBash(kitbash) {

    kitbash.isKitBash = true;

    let inflated = inflateObject(
        kitbash,
        KitBash.prototype,
        ["onItemAdded", "onItemRemoved", "onFaceChanged"]
    );
    if (!inflated) { return; }

    inflateBlock(kitbash);

    backwardsCompatifyKitBash(kitbash);

    for (let item of kitbash._items) {
        item.room = kitbash.room;
        item.group = kitbash;
        inflateFurniture(item);
    }

}

function backwardsCompatifyKitBash(kitbash) {
    //Refactor 1: list -> selectable object
    if (kitbash.indexs) {
        kitbash._items = kitbash.indexs.map(kitbash.itemFunc);
    }
}
