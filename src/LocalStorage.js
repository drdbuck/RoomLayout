"use strict";

const houseSaveKey = "RoomLayout_house";

function saveHouse(house) {
    let json = house;
    if (!isString(json)) {
        house.prepareForSave();
        json = JSON.stringify(house, getDataStringify());
    }
    localStorage.setItem(houseSaveKey, json);
}

function loadHouse() {
    let json = localStorage.getItem(houseSaveKey);
    let house = JSON.parse(json);
    if (house) {
        inflateHouse(house);
    }
    else {
        house = new House();
    }
    return house;
}
