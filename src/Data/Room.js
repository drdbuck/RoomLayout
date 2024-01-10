"use strict";

let stringifyRoom = [
    "furnitures",
];

class Room extends Block {
    constructor(width = 11, length = 12, height = 9) {
        super(width, length, height);

        this.furnitures = [];

        this.onFurnituresChanged = new Delegate("furnitures");
    }

    addFurniture(furniture) {
        if (!this.furnitures.includes(furniture)) {
            this.furnitures.push(furniture);
            this.onFurnituresChanged.run([...this.furnitures]);
        }
    }

    removeFurniture(furniture) {
        let removed = this.furnitures.remove(furniture);
        if (removed) {
            this.onFurnituresChanged.run([...this.furnitures]);
        }
    }
}

function inflateRoom(room) {

    let inflated = inflateObject(room, Room.prototype, ["onFurnituresChanged"]);
    if (!inflated) { return; }
    inflateBlock(room);

    for (let furniture of room.furnitures) {
        inflateFurniture(furniture);
    }

}
