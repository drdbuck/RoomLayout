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

    //Furniture
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
            furniture.onItemAdded.add(room.bind_groupItemAdded);
            furniture.onItemRemoved.add(room.bind_groupItemRemoved);
        }
        //Furniture
        else {
            inflateFurniture(furniture);
        }
    }

}

function backwardsCompatifyRoom(room) {
    //Change: add groups
    // room.groups ??= [];
    //Change: remove groups (kitbash refactor 1)
    if (room.groups) {
        let itemFunc = index => room.furnitures[index];
        //Add each group
        for (let group of room.groups) {
            group._items = group.indexs.map(itemFunc);
            room.furnitures.push(group);
        }
        //Remove each identified furniture from the furnitures list
        let indexList = room.groups
            .map(g => g.indexs)
            .flat()
            .removeDuplicates()
            .sort();
        room.furnitures = room.furnitures
            .filter((f, i) => !indexList.includes(i));
        //Remove groups variable
        room.groups = undefined;
    }
}
