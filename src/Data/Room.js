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

    addFurniture(furniture) {
        //early exit: invalid furniture
        if (!furniture) { return; }
        //
        furniture.room = this;
        if (furniture.isKitBash) {
            furniture.items.forEach(item => item.room = this);
        }
        //
        if (!this.furnitures.includes(furniture)) {
            this.furnitures.push(furniture);
            if (furniture.isKitBash) {
                furniture.onItemAdded.add(this.bind_groupItemAdded);
                furniture.onItemRemoved.add(this.bind_groupItemRemoved);
            }
            this.onFurnitureAdded.run(furniture);
            this.onFurnituresChanged.run([...this.furnitures]);
        }
    }

    removeFurniture(furniture) {
        if (furniture?.room == this) {
            furniture.room = undefined;
            if (furniture.isKitBash) {
                furniture.items.forEach(item => item.room = undefined);
            }
        }
        let removed = this.furnitures.remove(furniture);
        if (removed) {
            if (furniture.isKitBash) {
                furniture.onItemAdded.remove(this.bind_groupItemAdded);
                furniture.onItemRemoved.remove(this.bind_groupItemRemoved);
            }
            //delegates
            this.onFurnitureRemoved.run(furniture);
            this.onFurnituresChanged.run([...this.furnitures]);
        }
    }

    group(furnitures) {
        //early exit: not enough furniture to make a group
        if (!(furnitures.length >= 2)) { return; }
        //
        let group = new KitBash(furnitures);
        this.addFurniture(group);
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

    for (let furniture of room.furnitures) {
        //Both
        furniture.room = room;
        //KitBash
        if (furniture._items || furniture.indexs) {
            //backwards compatify: kitbash refactor 1
            if (furniture.indexs) {
                furniture.itemFunc = index => room.furnitures[index];
            }
            //inflate
            inflateKitBash(furniture);
        }
        //Furniture
        else {
            inflateFurniture(furniture);
        }
    }

    backwardsCompatifyRoom(room);

}

function backwardsCompatifyRoom(room) {
    //Change: add groups
    // room.groups ??= [];
    //Change: remove groups
    if (room.groups) {
        for (let group of room.groups) {
            group.itemFunc = index => room.furnitures[index]
            inflateKitBash(group);
        }
    }
}
