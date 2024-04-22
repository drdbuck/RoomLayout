"use strict";

let stringifyRoom = [
    "boxes",
];

class Room extends Block {
    constructor(width = 11, length = 12, height = 9) {
        super(new Vector3(width, height, length));

        this.boxes = [];

        this.onBoxAdded = new Delegate("box");
        this.onBoxRemoved = new Delegate("box");
        this.onBoxsChanged = new Delegate("boxes");

        this.bind_groupItemAdded = this._groupItemAdded.bind(this);
        this.bind_groupItemRemoved = this._groupItemRemoved.bind(this);
    }

    addBox(box) {
        //early exit: invalid box
        if (!box) { return; }
        //
        box.room = this;
        if (box.isKitBash) {
            box.items.forEach(item => item.room = this);
        }
        //
        if (!this.boxes.includes(box)) {
            this.boxes.push(box);
            if (box.isKitBash) {
                box.onItemAdded.add(this.bind_groupItemAdded);
                box.onItemRemoved.add(this.bind_groupItemRemoved);
            }
            this.onBoxAdded.run(box);
            this.onBoxsChanged.run([...this.boxes]);
        }
    }

    removeBox(box) {
        if (box?.room == this) {
            box.room = undefined;
            if (box.isKitBash) {
                box.items.forEach(item => item.room = undefined);
            }
        }
        let removed = this.boxes.remove(box);
        if (removed) {
            if (box.isKitBash) {
                box.onItemAdded.remove(this.bind_groupItemAdded);
                box.onItemRemoved.remove(this.bind_groupItemRemoved);
            }
            //delegates
            this.onBoxRemoved.run(box);
            this.onBoxsChanged.run([...this.boxes]);
        }
    }

    group(boxes) {
        //early exit: not enough box to make a group
        if (!(boxes.length >= 2)) { return; }
        //
        let group = new KitBash(boxes);
        this.addBox(group);
        //remove boxes from list
        boxes.forEach(f => this._groupItemAdded(f));
        //
        return group;
    }

    _groupItemAdded(item) {
        if (this.boxes.includes(item)) {
            this.boxes.remove(item);
            //don't call delegates here
            //bc the item is still in the room, just organized differently
        }
    }
    _groupItemRemoved(item) {
        if (!this.boxes.includes(item)) {
            this.boxes.push(item);
            //don't call delegates here
            //bc the item is still in the room, just organized differently
        }
    }

    prepareForSave() {
        const room = this;
        //remove empty groups
        this.boxes = this.boxes.filter(f => !f.isKitBash || f.items.length > 0);
    }
}

function inflateRoom(room) {

    let inflated = inflateObject(
        room,
        Room.prototype,
        [
            "onBoxAdded",
            "onBoxRemoved",
            "onBoxsChanged",
        ]);
    if (!inflated) { return; }
    inflateBlock(room);

    //KitBash delegates
    room.bind_groupItemAdded = room._groupItemAdded.bind(room);
    room.bind_groupItemRemoved = room._groupItemRemoved.bind(room);

    //Backwards Compatify
    backwardsCompatifyRoom(room);

    //Box
    for (let box of room.boxes) {
        //Both
        box.room = room;
        //KitBash
        if (box._items) {
            //inflate
            inflateKitBash(box);
            box.onItemAdded.add(room.bind_groupItemAdded);
            box.onItemRemoved.add(room.bind_groupItemRemoved);
        }
        //Box
        else {
            inflateBox(box);
        }
    }

}

function backwardsCompatifyRoom(room) {
}
