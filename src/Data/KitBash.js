"use strict";

const stringifyKitBash = [
    "_items",
    "defaultFace",
    "_scaleFactor",
];

class KitBash extends Block {
    constructor(items = [], imageURL) {
        super();

        this.isKitBash = true;
        this.defaultFace = imageURL
            ?? items
                .map(box => box._faces)
                .flat(Infinity)
                .find(iu => iu)
            ?? PIXEL_WHITE;
        this._scaleFactor = 1;

        //Delegates
        this.onItemAdded = new Delegate("item");
        this.onItemRemoved = new Delegate("item");
        this.onFaceChanged = new Delegate("index", "imageURL");
        this.bind_FaceChanged = this.onFaceChanged.run.bind(this.onFaceChanged);
        this.onScaleFactorChanged = new Delegate("scaleFactor");

        //Add items
        this._items = [];
        items.filter(i => i).forEach(item => this.add(item));

        //Name
        let name = this._items[0].name ?? ""
        this.name = ((name) ? `${name} Group` : "Group") + ` (${this._items.length} count)`;

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

    }

    get items() {
        return [...this._items];
    }

    add(item) {
        //early exit: invalid item
        if (!item) { return; }
        //early exit: item is kitbash
        if (item.isKitBash) { return; }
        //array handling
        if (Array.isArray(item)) {
            item.forEach(itm => this.add(itm));
            return;
        }
        //
        if (!this._items.includes(item)) {
            this._items.push(item);
            //remove from other group if necessary
            item.group?.remove(item);
            //tell item its in a new group now
            item.group = this;
            //register delegate
            item.onFaceChanged.add(this.bind_FaceChanged);
            this.onScaleFactorChanged.add(item.bind_ScaleFactorChanged);
            this.onPositionChanged.add(item.bind_GroupPositionChanged);
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
            this.onScaleFactorChanged.remove(item.bind_ScaleFactorChanged);
            this.onPositionChanged.remove(item.bind_GroupPositionChanged);
            //
            this.onItemRemoved.run(item);
        }
    }

    has(item) {
        return this._items.includes(item);
    }

    indexOf(item) {
        return this._items.indexOf(item);
    }

    nextItem(item, dir) {
        let index = this._items.indexOf(item);
        if (!(index >= 0)) { return undefined; }
        const length = this._items.length;
        return this._items[(index + dir + length) % length];
    }

    //Position
    get altitude() {
        return this._items.min(f => f.altitude)
    }
    set altitude(value) {
        const prev = this.altitude;
        const offset = value - prev;
        this._items.forEach(item => {
            let newPos = item.position.clone();
            newPos.y += offset;
            item.position = newPos;
        });
        //delegate
        super.altitude = value;
    }

    //Rotation
    get angle() {
        let sumAngle = this._items.sum(f => loopAngle(f.angle));
        return sumAngle / this._items.length;
    }
    set angle(value) {
        const oldAngle = this.angle;
        let offset = value - oldAngle;
        const center = this.position;
        this._items.forEach(item => {
            //update angle
            item.angle += offset;
            //update position
            let poffset = item.position.clone();
            poffset.sub(center);
            let radians = toRadians(offset);
            poffset.applyAxisAngle(_up, radians);
            poffset.add(center);
            item.position = poffset;
        });
        super.angle = value;
    }

    //Scale
    get scale() {
        let width = this.width;
        let depth = this.depth;
        let height = this.height;
        return new Vector3(width, height, depth);
    }
    set scale(value) {
        this.width = value.x;
        this.depth = value.z;
        this.height = value.y;
        //
        super.scale = value;
    }

    get scaleFactor() {
        return this._scaleFactor;
    }
    set scaleFactor(value) {
        //
        value ??= 1;
        value = Math.clamp(value, 0.001, 100);
        this._scaleFactor = value;
        //delegates
        this.onScaleFactorChanged.run(this._scaleFactor);
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
            offset.sub(center);
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
        const center = this.position;
        this._items.forEach(item => {
            //adjust dimensions
            item.depth *= factor;
            //move
            //TODO: account for rotation
            let offset = item.position.clone();
            offset.sub(center);
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
        const center = this.position;
        this._items.forEach(item => {
            //adjust dimensions
            item.length *= factor;
            //move
            //TODO: account for rotation
            let offset = item.position.clone();
            offset.sub(center);
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
        const center = this.position;
        this._items.forEach(item => {
            //adjust dimensions
            item.height *= factor;
            //move
            //TODO: account for rotation / recline
            let offset = item.position.clone();
            offset.sub(center);
            offset.y *= factor;
            offset.add(center);
            item.position = offset;
        });
        super.height = value;
    }



}

function inflateKitBash(kitbash) {

    kitbash.isKitBash = true;

    let inflated = inflateObject(
        kitbash,
        KitBash.prototype,
        [
            "onItemAdded",
            "onItemRemoved",
            "onFaceChanged",
            "onScaleFactorChanged",
        ]
    );
    if (!inflated) { return; }

    inflateBlock(kitbash);

    kitbash.bind_FaceChanged = kitbash.onFaceChanged.run.bind(kitbash.onFaceChanged);

    for (let item of kitbash._items) {
        item.room = kitbash.room;
        item.group = kitbash;
        inflateBox(item);
        //register delegate
        item.onFaceChanged.add(kitbash.bind_FaceChanged);
        kitbash.onScaleFactorChanged.add(item.bind_ScaleFactorChanged);
        kitbash.onPositionChanged.add(item.bind_GroupPositionChanged);
    }

    backwardsCompatifyKitBash(kitbash);
    
}

function backwardsCompatifyKitBash(kitbash) {
    //Change: scaleFactor
    kitbash._scaleFactor ??= 1;
}