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

    //Early exit
    if (!room) {
        console.error("Cannot inflate null room!", room);
        return;
    }

    //Prototype
    Object.setPrototypeOf(room, Room.prototype);

    //Delegates
    room.onFurnituresChanged = new Delegate("furnitures");

}
