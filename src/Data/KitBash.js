"use strict";

const stringifyKitBash = [
    "_items",
    "_defaultFace",
    "_scaleFactor",
    "_faces",
];

class KitBash extends Block {
    constructor(items = [], imageURL) {
        super();

        this.isKitBash = true;
        this._defaultFace = imageURL
            ?? items
                .map(box => box._faces)
                .flat(Infinity)
                .find(iu => iu)
            ?? PIXEL_WHITE;
        this._scaleFactor = 1;
        this._faces = [this._defaultFace].filter(url => isValidImage(url));

        this.units = UNITS_INCHES;

        //Delegates
        this.onItemAdded = new Delegate("item");
        this.onItemRemoved = new Delegate("item");
        this.onFaceChanged = new Delegate("index", "imageURL");
        this.bind_FaceChanged = this.onFaceChanged.run.bind(this.onFaceChanged);
        this.onDefaultFaceChanged = new Delegate("imageURL");
        this.onScaleFactorChanged = new Delegate("scaleFactor");

        //Add items
        this._items = [];
        items.filter(i => i).forEach(item => this.add(item));

        //Name
        let name = this._items[0]?.name ?? "";
        this.name = ((name) ? `${name} Group` : "Group");

        if (this._items.length > 0) {
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
            this.recalculateSize();
        }
        else {
            this._position = _zero.clone();
            this._angle = 0;
            this._scaleFactor = 1;
        }

    }

    get items() {
        return [...this._items];
    }

    get count() {
        return this._items.length;
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
            //change position
            item.position.sub(this.position);
            //register delegate
            item.onFaceChanged.add(this.bind_FaceChanged);
            this.onScaleFactorChanged.add(item.bind_ScaleFactorChanged);
            this.onPositionChanged.add(item.bind_GroupPositionChanged);
            this.onAngleChanged.add(item.bind_GroupAngleChanged);
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

            //change position
            item.position.add(this.position);
            //unregister delegate
            item.onFaceChanged.remove(this.bind_FaceChanged);
            this.onScaleFactorChanged.remove(item.bind_ScaleFactorChanged);
            this.onPositionChanged.remove(item.bind_GroupPositionChanged);
            this.onAngleChanged.remove(item.bind_GroupAngleChanged);
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

    //Face
    get defaultFace() {
        return this._defaultFace;
    }
    set defaultFace(value) {
        let imageURL = value;
        this._defaultFace = imageURL;
        this.onFaceChanged.run(FACE_DEFAULT, imageURL);
        this.onDefaultFaceChanged.run(imageURL);
    }

    addFace(imgURL) {
        if (!isValidImage(imgURL)) { return; }
        if (this._faces.includes(imgURL)) { return; }
        
        this._faces.push(imgURL);
    }

    //Position
    get altitude() {
        return this._items.min(f => f.altitude);
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

    //Scale
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

    //
    //
    //

    recenterPivot() {
        //store existing position
        let prevPos = this._position.clone();

        //calculate new pivot position
        let pos = _zero.clone();
        let sumX = this._items.sum(f => f.worldPosition.x);
        pos.x = sumX / this._items.length;
        let sumZ = this._items.sum(f => f.worldPosition.z);
        pos.z = sumZ / this._items.length;
        let minY = this._items.min(f => f.worldPosition.y);
        pos.y = minY;
        this.position = pos;

        //move all components (so they effectively dont move)
        let offset = prevPos.clone().sub(this._position);
        this._items.forEach(item => item.worldPosition = item.worldPosition.add(offset));
    }

    recalculateSize() {
        this.recenterPivot();
        //TODO: account for rotation of individual parts
        let maxHalfWidth = this._items.max(f => f.position.x + (f.width / 2));
        let maxHalfDepth = this._items.max(f => f.position.z + (f.depth / 2));
        let maxHeight = this._items.max(f => f.altitude + f.height) - this.altitude;
        this.scale = new Vector3(maxHalfWidth * 2, maxHeight, maxHalfDepth * 2);
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
            "onDefaultFaceChanged",
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
        kitbash.onAngleChanged.add(item.bind_GroupAngleChanged);
    }

    backwardsCompatifyKitBash(kitbash);

}

function backwardsCompatifyKitBash(kitbash) {
    //Change: scaleFactor
    kitbash._scaleFactor ??= 1;
    //Change: defaultFace -> _defaultFace
    kitbash._defaultFace ??= kitbash.defaultFace;
    //Change: add _faces
    kitbash._faces ??= [];
}
