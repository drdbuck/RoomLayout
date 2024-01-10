"use strict";

const houseSaveKey = "RoomLayout_house";

function saveHouse(house) {
    let json = house;
    if (!isString(json)) {
        json = JSON.stringify(house, getDataStringify());
    }
    localStorage.setItem(houseSaveKey, json);
}

function loadHouse() {
    let json = localStorage.getItem(houseSaveKey);
    let house = JSON.parse(json);
    if (!house) {
        house = new House();
    }
    return house;
}
