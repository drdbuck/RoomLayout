"use strict";

let _contexts = [];//dirty
let _furnitures = [];//dirty
let _faces = [];//dirty
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
    const onChangeFunc = (id, func, float = true, allowFootNotation = true) => {
        const txt = $(id);
        txt.onfocus = () => {
            txt.select();
        }
        txt.onkeyup = () => {
            const rawvalue = txt.value;
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

    //only accept array input
    if (!Array.isArray(contexts)) {
        contexts = undefined;
    }

    //defaults
    _contexts = contexts ?? _contexts;
    contexts ??= _contexts;
    _furnitures = contexts?.map(c => c.obj);
    _faces = contexts?.filter(c => c.furniture.validFaceIndex(c.face)).map(c => c.face);

    //check if panel should be shown
    let showPanel = uiVars.editObjects;
    $("divPanelEdit").hidden = !showPanel;
    if (!showPanel) { return; }

    //Update UI
    let anySelected = _contexts.length > 0;
    updateFaceEditPanel();

    if (!anySelected) { return; }

    $("hEditFurniture").innerHTML = `Edit ${(_contexts.every(c => c.obj.isKitBash)) ? "Group" : "Furniture"}`;

    //Name
    $("txtName").disabled = !(contexts.length == 1);
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


    $("btnFaceEdit").checked = uiVars.editFaces;

    //
}

function registerUIDelegates(furniture, register) {
    if (register) {
        furniture.onSizeChanged.add(updateFurnitureEditPanel);
        furniture.onPositionChanged.add(updateFurnitureEditPanel);
        furniture.onAngleChanged.add(updateFurnitureEditPanel);
        furniture.onFaceChanged.add(updateFaceEditPanel);
    }
    else {
        furniture.onSizeChanged.remove(updateFurnitureEditPanel);
        furniture.onPositionChanged.remove(updateFurnitureEditPanel);
        furniture.onAngleChanged.remove(updateFurnitureEditPanel);
        furniture.onFaceChanged.remove(updateFaceEditPanel);
    }
}

function updateFaceEditPanel(faces) {

    //only accept array input
    if (!Array.isArray(faces)) {
        faces = undefined;
    }

    //defaults
    _faces = faces?.filter(f => f >= 0 || f == FACE_DEFAULT) ?? _faces;
    faces = _faces;

    //
    let showPanel = uiVars.editFaces;
    $("divFaceEdit").hidden = !showPanel;
    if (!showPanel) { return; }

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
    let usingImage = false;
    let divhtml = "<label>Error: This element couldn't be displayed</label>";
    let faceContexts = _contexts.filter(c => c.furniture.validFaceIndex(c.face));//dirty: using stored _contexts
    let imageURLs = faceContexts
        .map(c => {
            let furniture = c.furniture;
            return furniture.getFace(c.face);
        })
        .filter(url => isValidImage(url));
    //Images exist
    if (imageURLs.length > 0) {
        let onlyOne = imageURLs.length == 1;
        let imageURL = (onlyOne) ? imageURLs[0] : imageURLs.reduce(reduceFunc);
        //The image is the same, or there's only one
        if (imageURL) {
            const imgFace = `<img src='${imageURL}' />`;
            divhtml = imgFace;
            usingImage = true;
        }
        //There's more than one image and they're different
        else {
            const lblInequal = "<label>[Various images]</label>";
            divhtml = lblInequal;
            usingImage = true;
        }
    }
    //There's no images here yet
    else {
        //Suggest images you might want
        let divSuggest = "";
        let suggest = [];
        const maxSuggestions = 4;
        //last image
        _contexts.forEach(context => {//dirty: using _contexts
            let f = context.furniture;
            suggest.push(f.lastImage);
        });
        //image from other side
        _contexts.forEach(context => {//dirty: using _contexts
            if (context.face < 0) { return; }
            let f = context.furniture;
            let flipFace = context.face + ((context.face % 2 == 0) ? 1 : -1);
            let flipURL = f.getFace(flipFace);
            suggest.push(flipURL);
        });
        //default face image
        _contexts.forEach(context => {//dirty: using _contexts
            let f = context.furniture;
            suggest.push(f.defaultFace);
        });
        //images from other sides
        _contexts.forEach(context => {//dirty: using _contexts
            let f = context.furniture;
            f.faceList.forEach(face => suggest.push(face));
        });
        //make html img elements from suggested
        let suggestStr = suggest
            //remove blanks
            .filter(url => isValidImage(url))
            //remove duplicates
            .removeDuplicates()
            //only get first few suggestions
            // .slice(0, maxSuggestions)
            //convert to html img element
            //controllerEdit.selector.forEach(c => c.furniture.setFace(c.face, url));
            .map(url => `<img src='${url}' class="selectableImage"
                onclick="btnUseSuggestedImage(this.src);"
            />`)
            //merge into single string
            .join("");
        if (suggestStr) {
            divSuggest = `Suggested Images:<br>${suggestStr}`;
        }
        //
        const lblDropFace = "<label>Drop face image here</label>";
        divhtml = lblDropFace + divSuggest;
        usingImage = false;
    }
    $("divFaceDrop").innerHTML = divhtml;
    //
    if (usingImage) {
        controllerImageEdit.updateImage(_contexts.find(c => c.furniture.validFaceIndex(c.face)));//dirty: _contexts
    }
    $("divImageEdit").hidden = !usingImage;
}


//
// ======= UI Controls =======
//

function btnExitFurnitureEdit() {
    uiVars.editObjects = false;
}

function btnFurnitureExport() {
    actionExportFurniture();
}

function btnGroup() {
    actionGroupObjects();
}

function btnFaceEdit() {
    uiVars.editFaces = !uiVars.editFaces;
}

function btnExitFaceEdit() {
    uiVars.editFaces = false;
}

function btnUseSuggestedImage(imgURL) {
    controllerEdit.selector.forEach(c => {
        if (!c.furniture.validFaceIndex(c.face)) { return; }
        let f = c.furniture;
        f.setFace(c.face, imgURL);
    });
}

function btnUseDefaultImage() {
    controllerEdit.selector.forEach(c => {
        if (!c.furniture.validFaceIndex(c.face)) { return; }
        let f = c.furniture;
        f.setFace(c.face, f.defaultFace);
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
        let f = c.furniture;
        let faceIndex = c.face;
        if (!f.validFaceIndex(faceIndex)) { return; }
        let imageURL = f.getFace(faceIndex);
        let img = new Image();
        img.src = imageURL;
        img.onload = () => {
            img = flipImage(img, flipX, flipY);
            controllerImageEdit.imageEdit.flip(flipX, flipY);//dirty: directly accessing protected member imageEdit
            controllerImageEdit.boomerangCorners();
            let url = img.src;
            f.setFace(faceIndex, url);
        }
    });
}

function cropCanvasChanged(url) {
    controllerEdit.selector.forEach(c => {
        let f = c.furniture;
        let faceIndex = c.face;
        if (!f.validFaceIndex(faceIndex)) { return; }
        f.setFace(faceIndex, url);
    });
    //turn off face highlighting
    uiVars.highlightSelectedFace = false;
}

function btnFaceCrop() {
    controllerImageEdit.crop();
}

function btnFaceClear() {
    controllerEdit.selector.forEach(c => {
        if (!c.furniture.validFaceIndex(c.face)) { return; }
        let f = c.furniture;
        f.setFace(c.face, PIXEL_TRANSPARENT);
    });
}
