"use strict";

let _contexts = [];//dirty
let _furnitures = [];//dirty
const reduceFunc = (a, b) => (a === b) ? a : undefined;
const inequal = "---";
const DIGITS_OF_PRECISION = 3;
const updateFunc = (id, func) => {
    //early exit: this txt is active
    if (document.activeElement.id === id) { return; }
    //processing
    let value = _furnitures.map(func).reduce(reduceFunc);
    if (value) {
        value = Math.cut(value, DIGITS_OF_PRECISION);
    }
    $(id).value = value ?? inequal;
}

function initUI() {


    //individual textbox listeners
    const onChangeFunc = (id, func, allowFootNotation = true) =>
        $(id).onchange = (txt) => {
            const rawvalue = txt.target.value;
            let value = undefined;
            if (allowFootNotation) {
                value = parseFootInchInput(rawvalue);
            }
            value ??= parseFloatInput(rawvalue);
            if (value == undefined) { return; }
            controllerEdit.selector.forEach(
                context => func(context.obj, value)
            );
        };
    //Size
    onChangeFunc("txtWidth", (f, v) => f.width = v);
    onChangeFunc("txtLength", (f, v) => f.length = v);
    onChangeFunc("txtHeight", (f, v) => f.height = v);
    //Position
    onChangeFunc("txtPosX", (f, v) => controllerEdit.setFurniturePosition(f, f.position.setX(v)));
    onChangeFunc("txtPosY", (f, v) => controllerEdit.setFurniturePosition(f, f.position.setZ(v)));
    onChangeFunc("txtAltitude", (f, v) => controllerEdit.setFurnitureAltitude(f, v));
    onChangeFunc("txtAngle", (f, v) => controllerEdit.setFurnitureAngle(f, v), false);
}

//
// ======= Update UI from data =======
//

function updateFurnitureEditPanel(contexts) {
    log("selected count:", controllerEdit.selector.count);
    _contexts = contexts;
    _furnitures = contexts.map(c => c.obj);
    _updateFurnitureEditPanel();
}
function _updateFurnitureEditPanel() {
    //Update UI
    let anySelected = _furnitures.length > 0;
    $("divPanelEdit").hidden = !anySelected;
    if (anySelected) {
        //Size
        updateFunc("txtWidth", f => f.width);
        updateFunc("txtLength", f => f.length);
        updateFunc("txtHeight", f => f.height);
        //Position
        updateFunc("txtPosX", f => f.position.x);
        updateFunc("txtPosY", f => f.position.z);
        updateFunc("txtAltitude", f => f.altitude);
        updateFunc("txtAngle", f => f.angle);
    }
    else {
        $("divFaceEdit").hidden = true;
    }
    //Update selected faces
    _contexts.forEach(c => {
        updateFace(c.box, c.face);
    });
}

function registerUIDelegates(furniture, register) {
    if (register) {
        furniture.onSizeChanged.add(_updateFurnitureEditPanel);
        furniture.onPositionChanged.add(_updateFurnitureEditPanel);
        furniture.onAngleChanged.add(_updateFurnitureEditPanel);
    }
    else {
        furniture.onSizeChanged.remove(_updateFurnitureEditPanel);
        furniture.onPositionChanged.remove(_updateFurnitureEditPanel);
        furniture.onAngleChanged.remove(_updateFurnitureEditPanel);
    }
}

function updateFaceEditPanel(faces) {
    const reduceFunc = (a, b) => (a === b) ? a : undefined;
    const inequal = -2;
    const defaultValue = (faces?.length > 0) ? undefined : -1;
    let face = defaultValue ?? faces.reduce(reduceFunc) ?? inequal;
    let faceText = "";
    switch (face) {
        case 0:
            faceText = "Right";
            break;
        case 1:
            faceText = "Left";
            break;
        case 2:
            faceText = "Top";
            break;
        case 3:
            faceText = "Bottom";
            break;
        case 4:
            faceText = "Back";
            break;
        case 5:
            faceText = "Front";
            break;
        case -1:
            faceText = "None";
            break;
        case -2:
            faceText = "---";
            break;
    }
    $("spnFaceName").innerHTML = faceText;
}


//
// ======= UI Controls =======
//

function btnFaceEdit() {
    $("divFaceEdit").hidden = false;
    controller.selectNextFace(1);
}

function btnExitFaceEdit() {
    $("divFaceEdit").hidden = true;
    controller.selectNextFace();
}
