"use strict";

let _contexts = [];//dirty
let _furnitures = [];//dirty
const reduceFunc = (a, b) => (a === b) ? a : undefined;
const inequal = "---";
const DIGITS_OF_PRECISION = 3;
const updateFunc = (id, func, float = true) => {
    //early exit: this txt is active
    if (document.activeElement.id === id) { return; }
    //processing
    let value = _furnitures.map(func).reduce(reduceFunc);
    if (value && float) {
        value = Math.cut(value, DIGITS_OF_PRECISION);
    }
    $(id).value = value ?? inequal;
}

function initUI() {


    //individual textbox listeners
    const onChangeFunc = (id, func, float = true, allowFootNotation = true) =>
        $(id).onkeyup = (txt) => {
            const rawvalue = txt.target.value;
            let value = undefined;
            if (float) {
                if (allowFootNotation) {
                    value = parseFootInchInput(rawvalue);
                }
                value ??= parseFloatInput(rawvalue);
            }
            else {
                value = rawvalue;
            }
            if (value == undefined) { return; }
            controllerEdit.selector.forEach(
                context => func(context.obj, value)
            );
        };
    //Name
    onChangeFunc("txtName", (f, v) => f.name = v, false);
    //Size
    onChangeFunc("txtWidth", (f, v) => f.width = v);
    onChangeFunc("txtLength", (f, v) => f.length = v);
    onChangeFunc("txtHeight", (f, v) => f.height = v);
    //Position
    onChangeFunc("txtPosX", (f, v) => controllerEdit.setFurniturePosition(f, f.position.setX(v)));
    onChangeFunc("txtPosY", (f, v) => controllerEdit.setFurniturePosition(f, f.position.setZ(v)));
    onChangeFunc("txtAltitude", (f, v) => controllerEdit.setFurnitureAltitude(f, v));
    onChangeFunc("txtAngle", (f, v) => controllerEdit.setFurnitureAngle(f, v), true, false);
}

//
// ======= Update UI from data =======
//

function updateFurnitureEditPanel(contexts) {
    log("selected count:", controllerEdit.selector.count);
    _contexts = contexts;
    _furnitures = contexts.map(c => c.obj);

    $("txtName").disabled = !(contexts.length == 1);

    _updateFurnitureEditPanel();
}
function _updateFurnitureEditPanel() {
    //Update UI
    let anySelected = _furnitures.length > 0;
    $("divPanelEdit").hidden = !anySelected;
    if (anySelected) {
        //Name
        updateFunc("txtName", f => f.name, false);
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

    //
    if (_contexts.some(c => c.face >= -1)) {
        updateFaceEditPanel(_contexts.map(c => c.face));
    }
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

    $("divFaceEdit").hidden = !(faces.some(f => f >= -1));

    //spnFaceName
    const inequal = -3;
    const defaultValue = (faces?.length > 0) ? undefined : -2;
    let face = defaultValue ?? faces.reduce(reduceFunc) ?? inequal;
    let faceText = "";
    switch (face) {
        case (face >= 0) ? face : undefined:
            faceText = `Face ${face + 1}`;
            break;
        case -1:
            faceText = "[Default]";
            break;
        case -2:
            faceText = "None";
            break;
        case -3:
            faceText = "---";
            break;
        default:
            console.error("Unknown face index:", face);
    }
    $("spnFaceName").innerHTML = faceText;

    //divFaceDrop
    const lblDropFace = "<label>Drop face image here</label>";
    let usingImage = false;
    let divhtml = lblDropFace;
    let imageURLs = _contexts.map(c => {//dirty: using stored _contexts
        let furniture = c.obj;
        let face = c.face;
        if (face == -1) {
            return furniture.defaultFace;
        }
        return furniture.faces[face];
    });
    if (imageURLs.some(url => url)) {
        let imageURL = imageURLs.reduce(reduceFunc);
        if (imageURL) {
            const imgFace = "<img src='" + imageURL + "' />";
            divhtml = imgFace;
            usingImage = true;
        }
        else {
            const lblInequal = "<label>[Various images]</label>";
            divhtml = lblInequal;
            usingImage = true;
        }
    }
    else {
        divhtml = lblDropFace;
        usingImage = false;
    }
    $("divFaceDrop").innerHTML = divhtml;
    //
    $("divImageEdit").hidden = !usingImage;
}


//
// ======= UI Controls =======
//

function btnExitFurnitureEdit() {
    controller.selector.clear();
}

function btnFurnitureExport() {
    exportFurniture();
}

function btnGroup() {
    let room = house.rooms[0];
    //remove from existing
    controllerEdit.selector.forEach(c => {
        let f = c.obj;
        room.groups.forEach(g => g.remove(f));
    });
    //add to new
    room.group(controllerEdit.selector.map(c => c.obj));
}

function btnFaceEdit() {
    $("divFaceEdit").hidden = false;
    controller.selectNextFace(1);
}

function btnExitFaceEdit() {
    $("divFaceEdit").hidden = true;
    controller.selectNextFace();
}

function btnUseDefaultImage() {
    controllerEdit.selector.forEach(c => {
        if (c.face <= -1) { return; }
        let f = c.obj;
        f.faces[c.face] = f.defaultFace;
        //dirty: should use delegate here instead
        c.box.material = createMaterials(f.faces, 6, f.defaultFace);//dirty
        updateFaceEditPanel(controllerEdit.selector.map(c => c.face));//dirty
        controllerImageEdit.setImage(f.faces[c.face]);//dirty
    });
}

function btnFlipX() {
    btnFlip(true, false);
}

function btnFlipY() {
    btnFlip(false, true);
}

function btnFlip(flipX, flipY) {
    controllerEdit.selector.forEach(c => {
        let f = c.obj;
        let faceIndex = c.face;
        let imageURL = (faceIndex >= 0) ? f.faces[faceIndex] : f.defaultFace;
        let img = new Image();
        img.src = imageURL;
        img.onload = () => {
            img = flipImage(img, flipX, flipY);
            let url = img.src;
            if (faceIndex >= 0) {
                f.faces[faceIndex] = url;
            }
            else {
                f.defaultFace = url;
            }
            //dirty: should use delegate here instead
            c.box.material = createMaterials(f.faces, 6, f.defaultFace);//dirty
            updateFaceEditPanel(controllerEdit.selector.map(c => c.face));//dirty
        }
    });
}

function cropCanvasChanged(url) {
    controllerEdit.selector.forEach(c => {
        let f = c.obj;
        let faceIndex = c.face;
        if (faceIndex >= 0) {
            f.faces[faceIndex] = url;
        }
        else {
            f.defaultFace = url;
        }
        //dirty: should use delegate here instead
        c.box.material = createMaterials(f.faces, 6, f.defaultFace);//dirty
        // updateFaceEditPanel(controllerEdit.selector.map(c => c.face));//dirty
        $("divFaceDrop").innerHTML = "<img src='" + url + "' />";
    });
}
