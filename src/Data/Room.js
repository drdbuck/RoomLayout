"use strict";

let stringifyRoom = [
    "furnitures",
    "groups",
];

class Room extends Block {
    constructor(width = 11, length = 12, height = 9) {
        super(new Vector3(width, height, length));

        this.furnitures = [];
        this.groups = [];

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
            //groups
            this.groups.forEach(g => g.remove(furniture));
            //delegates
            this.onFurnitureRemoved.run(furniture);
            this.onFurnituresChanged.run([...this.furnitures]);
        }
    }

    group(furnitures) {
        let group = new KitBash();
        furnitures.forEach(f => group.add(f));
        this.groups.push(group);
    }

    prepareForSave() {
        const room = this;
        //remove empty groups and those with one item
        this.groups = this.groups.filter(g => g.items.length > 1);
        //prepare each group for save
        this.groups.forEach(g => g.prepareForSave(
            item => room.furnitures.indexOf(item)
        ));
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
        inflateFurniture(furniture);
        furniture.room = room;
    }

    backwardsCompatifyRoom(room);

    for (let group of room.groups) {
        inflateKitBash(group);
        group.constructAfterLoad(
            index => room.furnitures[index]
        );
    }


}

function backwardsCompatifyRoom(room) {
    //Change: add groups
    room.groups ??= [];
}
