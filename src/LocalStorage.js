"use strict";

const houseSaveKey = "RoomLayout_house";
const uiVarsSaveKey = "RoomLayout_uiVars";

function saveHouse(house) {
    let json = house;
    if (!isString(json)) {
        house.prepareForSave();
        json = JSON.stringify(house, getDataStringify().concat("uid"));
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

function saveUIVars(uiVars) {
    let json = uiVars;
    if (!isString(json)) {
        uiVars.prepareForSave();
        json = JSON.stringify(uiVars, getDataStringifyUIVars());
    }
    localStorage.setItem(uiVarsSaveKey, json);
}

function loadUIVars() {
    let json = localStorage.getItem(uiVarsSaveKey);
    let uiVars = JSON.parse(json);
    if (uiVars) {
        inflateUIVars(uiVars);
    }
    else {
        uiVars = new UIVars();
    }
    return uiVars;
}
