"use strict";

const stringifyHouse = [
    "units",
    "rooms",
];

class House {
    constructor(emptyRooms = 1, units = UNITS_FEET) {
        this.units = units;

        this.rooms = [];

        this.onRoomsChanged = new Delegate("rooms");

        //add empty rooms
        for (let i = 0; i < emptyRooms; i++) {
            let room = new Room();
            this.addRoom(room);
        }
    }

    addRoom(room) {
        if (!this.rooms.includes(room)) {
            this.rooms.push(room);
            this.onRoomsChanged.run([...this.rooms]);
        }
        room.house = this;
    }

    removeRoom(room) {
        let removed = this.rooms.remove(room);
        if (removed) {
            this.onRoomsChanged.run([...this.rooms]);
        }
    }

    prepareForSave() {
        this.rooms.forEach(r => r.prepareForSave());
    }
}

function inflateHouse(house) {

    inflateObject(house, House.prototype, ["onRoomsChanged"]);

    for (let room of house.rooms) {
        inflateRoom(room);
        room.house = house;
    }

}
