"use strict";

let stringifyRoom = [
    "furnitures",
];

class Room extends Block {
    constructor(width = 11, length = 12, height = 9) {
        super(new Vector3(width, height, length));

        this.furnitures = [];

        this.onFurnitureAdded = new Delegate("furniture");
        this.onFurnitureRemoved = new Delegate("furniture");
        this.onFurnituresChanged = new Delegate("furnitures");

        this.bind_groupItemAdded = this._groupItemAdded.bind(this);
        this.bind_groupItemRemoved = this._groupItemRemoved.bind(this);
    }

    addFurniture(box) {
        //early exit: invalid box
        if (!box) { return; }
        //
        box.room = this;
        if (box.isKitBash) {
            box.items.forEach(item => item.room = this);
        }
        //
        if (!this.furnitures.includes(box)) {
            this.furnitures.push(box);
            if (box.isKitBash) {
                box.onItemAdded.add(this.bind_groupItemAdded);
                box.onItemRemoved.add(this.bind_groupItemRemoved);
            }
            this.onFurnitureAdded.run(box);
            this.onFurnituresChanged.run([...this.furnitures]);
        }
    }

    removeFurniture(box) {
        if (box?.room == this) {
            box.room = undefined;
            if (box.isKitBash) {
                box.items.forEach(item => item.room = undefined);
            }
        }
        let removed = this.furnitures.remove(box);
        if (removed) {
            if (box.isKitBash) {
                box.onItemAdded.remove(this.bind_groupItemAdded);
                box.onItemRemoved.remove(this.bind_groupItemRemoved);
            }
            //delegates
            this.onFurnitureRemoved.run(box);
            this.onFurnituresChanged.run([...this.furnitures]);
        }
    }

    group(furnitures) {
        //early exit: not enough box to make a group
        if (!(furnitures.length >= 1)) { return; }
        //
        let group = new KitBash(furnitures);
        this.addFurniture(group);
        //remove furnitures from list
        furnitures.forEach(f => this._groupItemAdded(f));
        //
        return group;
    }

    _groupItemAdded(item) {
        if (this.furnitures.includes(item)) {
            this.furnitures.remove(item);
            //don't call delegates here
            //bc the item is still in the room, just organized differently
        }
    }
    _groupItemRemoved(item) {
        if (!this.furnitures.includes(item)) {
            this.furnitures.push(item);
            //don't call delegates here
            //bc the item is still in the room, just organized differently
        }
    }

    prepareForSave() {
        const room = this;
        //remove empty groups
        this.furnitures = this.furnitures.filter(f => !f.isKitBash || f.items.length > 0);
    }
}

function inflateRoom(room) {

    let inflated = inflateObject(
        room,
        Room.prototype,
        [
            "onFurnitureAdded",
            "onFurnitureRemoved",
            "onFurnituresChanged",
        ]);
    if (!inflated) { return; }
    inflateBlock(room);

    //KitBash delegates
    room.bind_groupItemAdded = room._groupItemAdded.bind(room);
    room.bind_groupItemRemoved = room._groupItemRemoved.bind(room);

    //Backwards Compatify
    backwardsCompatifyRoom(room);

    //Box
    for (let box of room.furnitures) {
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
