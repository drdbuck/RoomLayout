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
            this.onFurnitureAdded.run(furniture);
            this.onFurnituresChanged.run([...this.furnitures]);
        }
        furniture.room = this;
    }

    removeFurniture(furniture) {
        let removed = this.furnitures.remove(furniture);
        if (removed) {
            this.onFurnitureRemoved.run(furniture);
            this.onFurnituresChanged.run([...this.furnitures]);
        }
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

}
