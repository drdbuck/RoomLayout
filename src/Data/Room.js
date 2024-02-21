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
    }

    addFurniture(furniture) {
        if (!this.furnitures.includes(furniture)) {
            this.furnitures.push(furniture);
            furniture.room = this;
            this.onFurnitureAdded.run(furniture);
            this.onFurnituresChanged.run([...this.furnitures]);
        }
        furniture.room = this;
    }

    removeFurniture(furniture) {
        let removed = this.furnitures.remove(furniture);
        if (removed) {
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
