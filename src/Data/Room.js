"use strict";

let stringifyRoom = [
    "boxs",
];

class Room extends Block {
    constructor(width = 11, length = 12, height = 9) {
        super(new Vector3(width, height, length));

        this.boxs = [];

        this.onBoxAdded = new Delegate("box");
        this.onBoxRemoved = new Delegate("box");
        this.onBoxsChanged = new Delegate("boxs");

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
        if (!this.boxs.includes(box)) {
            this.boxs.push(box);
            if (box.isKitBash) {
                box.onItemAdded.add(this.bind_groupItemAdded);
                box.onItemRemoved.add(this.bind_groupItemRemoved);
            }
            this.onBoxAdded.run(box);
            this.onBoxsChanged.run([...this.boxs]);
        }
    }

    removeBox(box) {
        if (box?.room == this) {
            box.room = undefined;
            if (box.isKitBash) {
                box.items.forEach(item => item.room = undefined);
            }
        }
        let removed = this.boxs.remove(box);
        if (removed) {
            if (box.isKitBash) {
                box.onItemAdded.remove(this.bind_groupItemAdded);
                box.onItemRemoved.remove(this.bind_groupItemRemoved);
            }
            //delegates
            this.onBoxRemoved.run(box);
            this.onBoxsChanged.run([...this.boxs]);
        }
    }

    group(boxs) {
        //early exit: not enough box to make a group
        if (!(boxs.length >= 2)) { return; }
        //
        let group = new KitBash(boxs);
        this.addBox(group);
        //remove boxs from list
        boxs.forEach(f => this._groupItemAdded(f));
        //
        return group;
    }

    _groupItemAdded(item) {
        if (this.boxs.includes(item)) {
            this.boxs.remove(item);
            //don't call delegates here
            //bc the item is still in the room, just organized differently
        }
    }
    _groupItemRemoved(item) {
        if (!this.boxs.includes(item)) {
            this.boxs.push(item);
            //don't call delegates here
            //bc the item is still in the room, just organized differently
        }
    }

    prepareForSave() {
        const room = this;
        //remove empty groups
        this.boxs = this.boxs.filter(f => !f.isKitBash || f.items.length > 0);
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
    for (let box of room.boxs) {
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
