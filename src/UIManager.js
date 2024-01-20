"use strict";

function initUI() {

    //textbox events
    [
        "txtWidth",
        "txtLength",
        "txtHeight"
    ]
        .forEach(txtId => {
            let txt = $(txtId);
            txt.onfocus = () => {
                input.clearAllDelegates();
            };
            txt.onblur = () => {
                registerKeyBindings();
            };
        });

    //individual textbox events
    const onChangeFunc = (id, func) =>
        $(id).onchange = (txt) => controllerEdit.selector.forEach(
            context => func(context.obj, parseFloat(txt.target.value))
        );
    //Size
    onChangeFunc("txtWidth", (f, v) => f.width = v);
    onChangeFunc("txtLength", (f, v) => f.length = v);
    onChangeFunc("txtHeight", (f, v) => f.height = v);
    //Position
    onChangeFunc("txtPosX", (f, v) => f.position = f.position.setX(v));
    onChangeFunc("txtPosY", (f, v) => f.position = f.position.setZ(v));
    onChangeFunc("txtAltitude", (f, v) => f.altitude = v);
    onChangeFunc("txtAngle", (f, v) => f.angle = v);
}

//
// ======= Update UI from data =======
//

function updateFurnitureEditPanel(contexts) {
    log("selected count:", controllerEdit.selector.count);
    let furnitures = contexts.map(c => c.obj);
    const reduceFunc = (a, b) => (a === b) ? a : undefined;
    const inequal = "---";
    const defaultText = (furnitures.length > 0) ? undefined : "";
    const valueFunc = (func) => defaultText ?? furnitures.map(func).reduce(reduceFunc) ?? inequal;
    const updateFunc = (id, func) => $(id).value = valueFunc(func);
    //Update UI
    let anySelected = furnitures.length > 0;
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
    contexts.forEach(c => {
        updateFace(c.box, c.face);
    });
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
