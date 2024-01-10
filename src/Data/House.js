"use strict";

let stringifyHouse = [
    "units",
    "rooms",
];

class House {
    constructor(units = "feet") {
        this.units = units;

        this.rooms = [];

        this.onRoomsChanged = new Delegate("rooms");
    }

    addRoom(room) {
        if (!this.rooms.includes(room)) {
            this.rooms.push(room);
            this.onRoomsChanged.run([...this.rooms]);
        }
    }

    removeRoom(room) {
        let removed = this.rooms.remove(room);
        if (removed) {
            this.onRoomsChanged.run([...this.rooms]);
        }
    }
}

function inflateHouse(house) {

    //Early exit
    if (!house) {
        console.error("Cannot inflate null house!", house);
        return;
    }

    //Prototype
    Object.setPrototypeOf(house, House.prototype);

    //Delegates
    house.onRoomsChanged = new Delegate("rooms");

}
