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
