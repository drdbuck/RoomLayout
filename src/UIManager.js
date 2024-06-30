"use strict";

let _contexts = [];//dirty
let _groups = [];//dirty
let _boxs = [];//dirty
let _faces = [];//dirty
const reduceFunc = (a, b) => (a === b) ? a : undefined;
const inequal = "---";
const DIGITS_OF_PRECISION = 3;
const updateFunc = (id, list, func, float = true) => {
    //enable this txt
    let txt = $(id);
    let validList = list?.length > 0;
    txt.disabled = !validList;
    //early exit: this txt is active
    if (document.activeElement.id === id) { return; }
    //early exit: nothing in list
    if (!validList) {
        txt.value = "";
        return;
    }
    //processing
    let value = (list.length > 0)
        ? list.map(func).reduce(reduceFunc)
        : undefined;
    if (value && float) {
        value = Math.cut(value, DIGITS_OF_PRECISION);
    }
    txt.value = value ?? inequal;
};
const lblDropFace = "<label>Drop face image here</label>";
let workerSuggestionGallery;
let stringifySuggestionGallery;

function initUI() {

    //title
    document.title = `${APP_NAME} v${VERSION}`;

    //individual textmesh listeners
    const onChangeFunc = (id, listFunc, func, float = true, allowFootNotation = true) => {
        let txtChanged = false;
        let prevValue;
        const txt = $(id);
        txt.onfocus = () => {
            txt.select();
            txtChanged = false;
            prevValue = txt.value;
        };
        txt.onkeyup = () => {
            const rawvalue = txt.value;
            if (rawvalue != prevValue) {
                prevValue = rawvalue;
                txtChanged = true;
            }
            let value = undefined;
            if (float) {
                if (allowFootNotation) {
                    value = parseFootInchInput(rawvalue, uiVars.units);
                }
                value ??= parseFloatInput(rawvalue);
            }
            else {
                value = rawvalue;
            }
            if (value == undefined) { return; }
            let list = listFunc();
            list.forEach(
                item => func(item, value)
            );
            player.animate();
        };
        txt.onblur = () => {
            if (txtChanged) {
                //record undo
                undoMan.recordUndo("change object attribute");
            }
        };
    };
    const onChangeFuncRange = (id, listFunc, func) => {
        let rngChanged = false;
        let prevValue;
        const rng = $(id);
        rng.oninput = () => {
            const rawvalue = rng.value;
            if (rawvalue != prevValue) {
                prevValue = rawvalue;
                rngChanged = true;
            }
            let value = rawvalue;
            let list = listFunc();
            list.forEach(
                item => func(item, value)
            );
            player.animate();
        };
        rng.onblur = () => {
            if (rngChanged) {
                //record undo
                undoMan.recordUndo("change object attribute");
            }
        };
    }

    const onChangeFuncGroup = (listFunc, onblur, ...paramObjs) => {
        paramObjs.flat();
        //
        const _changeFunc = (dimensions) => {
            let list = listFunc();
            Object.keys(dimensions).forEach(d => {
                let value = dimensions[d];
                if (value == undefined) { return; }
                let dfunc = paramObjs.find(po => po.symbol == d).func;
                list.forEach(
                    item => dfunc(item, value)
                );
            });
            player.animate();
        };
        //
        paramObjs.forEach(obj => {
            let txtChanged = false;
            let prevValue;
            const txt = $(obj.id);
            txt.onfocus = () => {
                txt.select();
            };
            txt.onkeyup = () => {
                const rawvalue = txt.value;
                if (rawvalue != prevValue) {
                    prevValue = rawvalue;
                    txtChanged = true;
                }
                let dimensions = parseDimensions(rawvalue, 1, uiVars.units);
                dimensions[obj.symbol] ??= dimensions.any;
                dimensions.any = undefined;
                _changeFunc(dimensions);
            };
            txt.onblur = () => {
                if (txtChanged) {
                    //record undo
                    undoMan.recordUndo("change object attribute");
                }
                onblur();
            };
        });
    };

    //ROOM
    let rlistfunc = () => house.rooms;//dirty: hard-coding whole list
    //Name
    onChangeFunc("txtNameRoom", rlistfunc, (r, v) => r.name = v, false);
    //Size
    onChangeFuncGroup(
        rlistfunc,
        updateRoomEditPanel,
        { id: "txtWidthRoom", symbol: "w", func: (r, v) => r.width = v },
        { id: "txtLengthRoom", symbol: "l", func: (r, v) => r.length = v },
        { id: "txtHeightRoom", symbol: "h", func: (r, v) => r.height = v },
    );
    //Position
    // onChangeFunc("txtPosXRoom", rlistfunc, (r, v) => r.position = r.position.setX(v));
    // onChangeFunc("txtPosYRoom", rlistfunc, (r, v) => r.position = r.position.setZ(v));
    // onChangeFunc("txtAltitudeRoom", rlistfunc, (r, v) => r.altitude = v);

    //GROUP
    let glistfunc = () => uiVars.selector
        .map(c => c.kitbash)
        .filter(kb => kb);
    //Name
    onChangeFunc("txtGroupName", glistfunc, (g, v) => g.name = v, false);
    // Size
    // onChangeFunc("txtGroupScaleFactor", glistfunc, (g, v) => controllerEdit.setGroupScaleFactor(g, v));
    onChangeFuncGroup(
        glistfunc,
        updateGroupEditPanel,
        { id: "txtGroupWidth", symbol: "w", func: (g, v) => g.width = v },
        { id: "txtGroupLength", symbol: "d", func: (g, v) => g.length = v },
        { id: "txtGroupHeight", symbol: "h", func: (g, v) => g.height = v },
    );
    //Position
    onChangeFunc("txtGroupPosX", glistfunc, (g, v) => controllerEdit.setBoxPosition(g, g.position.setX(v)));
    onChangeFunc("txtGroupPosY", glistfunc, (g, v) => controllerEdit.setBoxPosition(g, g.position.setZ(v)));
    onChangeFunc("txtGroupAltitude", glistfunc, (g, v) => controllerEdit.setBoxAltitude(g, v));
    onChangeFuncRange("rngGroupAltitude", glistfunc, (g, v) => controllerEdit.setBoxAltitude(g, v));
    onChangeFunc("txtGroupAngle", glistfunc, (g, v) => controllerEdit.setBoxAngle(g, v), true, false);
    onChangeFuncRange("rngGroupAngle", glistfunc, (g, v) => controllerEdit.setBoxAngle(g, v));

    //BOX
    let flistfunc = () => uiVars.selector.map(c => c.box);
    //Name
    // onChangeFunc("txtName", flistfunc, (f, v) => f.name = v, false);
    //Size
    onChangeFuncGroup(
        flistfunc,
        updateBoxEditPanel,
        { id: "txtWidth", symbol: "w", func: (f, v) => f.width = v },
        { id: "txtLength", symbol: "d", func: (f, v) => f.length = v },
        { id: "txtHeight", symbol: "h", func: (f, v) => f.height = v },
    );
    //Position
    onChangeFunc("txtPosX", flistfunc, (f, v) => controllerEdit.setBoxPosition(f, f.position.setX(v)));
    onChangeFunc("txtPosY", flistfunc, (f, v) => controllerEdit.setBoxPosition(f, f.position.setZ(v)));
    onChangeFunc("txtAltitude", flistfunc, (f, v) => controllerEdit.setBoxAltitude(f, v));
    onChangeFuncRange("rngAltitude", flistfunc, (f, v) => controllerEdit.setBoxAltitude(f, v));
    onChangeFunc("txtAngle", flistfunc, (f, v) => controllerEdit.setBoxAngle(f, v), true, false);
    onChangeFuncRange("rngAngle", flistfunc, (f, v) => controllerEdit.setBoxAngle(f, v));
    onChangeFunc("txtRecline", flistfunc, (f, v) => controllerEdit.setBoxRecline(f, v), true, false);
    onChangeFuncRange("rngRecline", flistfunc, (f, v) => controllerEdit.setBoxRecline(f, v));
    //Top
    onChangeFuncGroup(
        flistfunc,
        updateBoxEditPanel,
        { id: "txtWidthTop", symbol: "w", func: (f, v) => f.widthTop = v },
        { id: "txtLengthTop", symbol: "d", func: (f, v) => f.depthTop = v },
    );
    onChangeFunc("txtPosXTop", flistfunc, (f, v) => f.positionTop = f.positionTop.setX(v));
    onChangeFunc("txtPosYTop", flistfunc, (f, v) => f.positionTop = f.positionTop.setZ(v));
    //Cylinder
    onChangeFunc("txtDegrees", flistfunc, (f, v) => f.degrees = v);
    onChangeFuncRange("rngDegrees", flistfunc, (f, v) => f.degrees = v);
    onChangeFunc("txtFaceDirection", flistfunc, (f, v) => f.faceDirection = v);
    onChangeFuncRange("rngFaceDirection", flistfunc, (f, v) => f.faceDirection = v);

    //Suggestion Gallery Worker
    workerSuggestionGallery = new Worker("/src/Workers/SuggestionGallery.js");
    workerSuggestionGallery.onmessage = (event) => {
        //early exit: face selection has moved while it was running
        if (_contexts.some(c => isValidImage(c.Face))) { return; }

        //
        let suggestList = event.data;
        let suggestStr = suggestList
            .filter(url => isValidImage(url))
            //convert to html img element
            //uiVars.selector.forEach(c => c.Face = url);
            .map(url => `<img src='${url}' class="selectableImage"
            onclick="btnUseSuggestedImage(this.src);"
        />`)
            //merge into single string
            .join("");
        let divSuggest = (suggestStr)
            ? `Suggested Images:<br>${suggestStr}`
            : "";
        //
        let divhtml = lblDropFace + divSuggest;
        $("divFaceDrop").innerHTML = divhtml;
    };
    stringifySuggestionGallery = [
        getDataStringify(),
        stringifyUndo,
        stringifySelectContext,
        "obj",
        "box",
        "kitbash",
    ]
        .flat(Infinity);

}

//
// ======= Update UI from data =======
//

function updateUIVariables(contexts) {
    log("selected count:", contexts.count);

    //early exit: no contexts
    if (!contexts) {
        console.error("must pass in a list of selected objects!", contexts);
        return;
    }
    //early exit: contexts not array
    if (!Array.isArray(contexts)) {
        console.error("input must be an array!", contexts);
        return;
    }

    //defaults
    _contexts = contexts;
    _groups = contexts.map(c => c.kitbash);
    _boxs = contexts.map(c => c.box).filter(box => box);
    _faces = contexts.filter(c => c.validFaceIndex()).map(c => c.face);
}

function updateAllPanels() {
    updateRoomEditPanel();
    updateGroupEditPanel();
    updateBoxEditPanel();
    updateFaceEditPanel();
}

function updateRoomEditPanel() {
    let rooms = [...house.rooms];//dirty: hard-coding which room(s) to edit

    //check if panel should be shown
    let showPanel = uiVars.editRooms;
    $("divPanelEditRoom").hidden = !showPanel;
    if (!showPanel) { return; }

    //Name
    $("txtNameRoom").disabled = !(rooms.length == 1);
    updateFunc("txtNameRoom", rooms, r => r.name, false);
    //Size
    updateFunc("txtWidthRoom", rooms, r => r.width);
    updateFunc("txtLengthRoom", rooms, r => r.length);
    updateFunc("txtHeightRoom", rooms, r => r.height);
    //Position
    // updateFunc("txtPosXRoom", rooms, r => r.position.x);
    // updateFunc("txtPosYRoom", rooms, r => r.position.z);
    // updateFunc("txtAltitudeRoom", rooms, r => r.altitude);
}

function updateGroupEditPanel() {

    //check if panel should be shown
    let showPanel = uiVars.editObjects;
    $("divPanelGroupEdit").hidden = !showPanel;
    if (!showPanel) { return; }

    //Update UI
    let anySelected = _contexts.length > 0;


    let glist = _groups;

    //Name
    updateFunc("txtGroupName", glist, g => g.name, false);
    $("txtGroupName").disabled = !(anySelected && _contexts.length == 1);
    //Size
    // updateFunc("txtGroupScaleFactor", glist, g => g.scaleFactor);
    updateFunc("txtGroupWidth", glist, g => g.width);
    updateFunc("txtGroupLength", glist, g => g.length);
    updateFunc("txtGroupHeight", glist, g => g.height);
    //Position
    updateFunc("txtGroupPosX", glist, g => g.position.x);
    updateFunc("txtGroupPosY", glist, g => g.position.z);
    updateFunc("txtGroupAltitude", glist, g => g.altitude);
    updateFunc("rngGroupAltitude", glist, g => g.altitude);
    updateFunc("txtGroupAngle", glist, g => g.angle);
    updateFunc("rngGroupAngle", glist, g => g.angle);

    //Buttons
    $("btnGroupFaceEdit").checked = uiVars.viewPanelFace;
    $("btnGroupFaceEdit").disabled = !anySelected;
}

function updateBoxEditPanel() {

    //check if panel should be shown
    let showPanel = uiVars.editBoxes;
    $("divPanelEdit").hidden = !showPanel;
    if (!showPanel) { return; }

    //Update UI
    let anySelected = _boxs.length > 0;


    let flist = _boxs;

    $("spnBoxName").innerHTML =
        (((flist.length > 0)
            ? flist
                .map(box => (box.group) ? box.group.indexOf(box) + 1 : undefined)
                .reduce(reduceFunc)
            : undefined)
            ?? inequal)
        + " / " +
        (((flist.length > 0)
            ? flist.map(box => box.group?.count).reduce(reduceFunc)
            : undefined)
            ?? inequal);

    //Name
    // updateFunc("txtName", flist, f => f.name, false);
    // $("txtName").disabled = !(anySelected && _boxs.length == 1);
    //Size
    updateFunc("txtWidth", flist, f => f.width);
    updateFunc("txtLength", flist, f => f.length);
    updateFunc("txtHeight", flist, f => f.height);
    //Position
    updateFunc("txtPosX", flist, f => f.position.x);
    updateFunc("txtPosY", flist, f => f.position.z);
    updateFunc("txtAltitude", flist, f => f.altitude);
    updateFunc("rngAltitude", flist, f => f.altitude);
    updateFunc("txtAngle", flist, f => f.angle);
    updateFunc("rngAngle", flist, f => f.angle);
    updateFunc("txtRecline", flist, f => f.recline);
    updateFunc("rngRecline", flist, f => f.recline);
    //Top
    updateFunc("txtWidthTop", flist, f => f.widthTop);
    updateFunc("txtLengthTop", flist, f => f.depthTop);
    updateFunc("txtPosXTop", flist, f => f.positionTop.x);
    updateFunc("txtPosYTop", flist, f => f.positionTop.z);
    //Cylinder
    updateFunc("txtDegrees", flist, f => f.degrees ?? 0);
    updateFunc("rngDegrees", flist, f => f.degrees ?? 0);
    updateFunc("txtFaceDirection", flist, f => f.faceDirection ?? 0);
    updateFunc("rngFaceDirection", flist, f => f.faceDirection ?? 0);

    //Range Limits
    let rngAltitude = $("rngAltitude");
    let room = house.rooms[0];//dirty: hardcoded which room
    let maxFeet = flist.min(box =>
            convertToFeet(box.group.height, box.group) - convertToFeet(box.height, box)
        );
    let units = flist.reduce((a, b) => reduceFunc(a.units,b.units) ?? UNITS_INCHES, UNITS_INCHES);
    rngAltitude.max = convertUnits(maxFeet, UNITS_FEET, units);

    //Buttons
    $("btnFaceEdit").checked = uiVars.viewPanelFace;
    $("btnFaceEdit").disabled = !anySelected;
}

function registerUIDelegates(context, register) {

    //group
    let group = context.kitbash;
    if (group) {//TODO: make this an early exit
        [
            delegateListBlock,
        ]
            .flat(Infinity)
            .forEach(del => group[del].listen(updateGroupEditPanel, register));
        [
            group.onFaceChanged,
        ]
            .forEach(del => del.listen(updateFaceEditPanel, register));
    }
    else {
        console.error("context has no group!", context.box.name, group, context);
    }

    //box
    let box = context.box;
    if (!box) { return; }
    [
        delegateListBlock,
        delegateListBox,
    ]
        .flat(Infinity)
        .forEach(del => box[del].listen(updateBoxEditPanel, register));

    //face
    [
        box.onFaceChanged,
    ]
        .forEach(del => del.listen(updateFaceEditPanel, register));
}

function updateFaceEditPanel() {

    //
    let showPanel = uiVars.viewPanelFace;
    $("divFaceEdit").hidden = !showPanel;
    $("divImageEdit").hidden = !uiVars.viewPanelFaceEdit;
    if (!showPanel) { return; }

    //spnFaceName
    const faces = _faces;
    const inequal = -3;
    const defaultValue = (faces?.length > 0) ? undefined : FACE_NONE;
    let face = defaultValue ?? faces.reduce(reduceFunc) ?? inequal;
    let faceText = "";
    switch (face) {
        case (face >= 0) ? face : undefined:
            faceText = `Face ${face + 1}`;
            break;
        case -1:
            faceText = "[Default]";
            break;
        case FACE_NONE:
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
    let faceContexts = _contexts.filter(c => c.faceSelected && c.validFaceIndex());
    let imageURLs = faceContexts
        .map(c => c.Face)
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
        let divSuggest = "<label>Loading suggestion gallery...</label>";
        divhtml = lblDropFace + divSuggest;

        //make html img elements from suggested
        workerSuggestionGallery.postMessage(
            copyObject(_contexts, stringifySuggestionGallery)
        );
        usingImage = false;
    }
    $("divFaceDrop").innerHTML = divhtml;
    //
    let showFaceEdit = usingImage && uiVars.viewPanelFaceEdit;
    if (showFaceEdit) {
        controllerImageEdit.updateImage(_contexts.find(c => c.validFaceIndex()));//dirty: _contexts
    }
    $("divImageEdit").hidden = !showFaceEdit;
    $("btnPanelFaceEdit").hidden = !usingImage;
    $("btnFaceReset").disabled = !(!usingImage && _contexts.some(c => c.Face == PIXEL_TRANSPARENT)
        || usingImage
    );//dirty: _contexts
    $("btnFaceClear").disabled = !(!usingImage && _contexts.some(c => c.face > 0 && c.Face != PIXEL_TRANSPARENT)
        || usingImage && _contexts.find(c => c.validFaceIndex())?.face >= 0
    );//dirty: _contexts
    $("btnFaceImport").hidden = !!usingImage;

    $("lblFaceZoom").innerHTML = `${Math.floor(controllerImageEdit.zoom.zoom * 100)}%`;
}



//
// ======= UI Controls =======
//

function btnExitRoomEdit() {
    uiVars.editRooms = false;
}

function btnExitFurnitureEdit() {
    uiVars.editObjects = false;
}
function btnExitBoxEdit() {
    uiVars.editBoxes = false;
}

function btnBoxExport() {
    actionExportFurniture();
}

function btnGroup() {
    actionObjectsGroup();
}

function btnGroupFaceEdit() {
    //set each context to cycle through all faces of furniture
    uiVars.selector.forEach(c => {
        c.boxSelected = false;
        c.faceSelected = true;
        c.face = FACE_DEFAULT;
    });
    //show panel    
    controllerEdit.updateFaceSelection();
    controllerEdit.runFaceDelegate();
    uiVars.viewPanelFace = true;
    //ui
    uiVars.editBoxes = false;
    updateFaceEditPanel();
}

function btnFaceEdit() {
    //set each context to cycle through only faces of selected box
    uiVars.selector.selection
        .filter(c => c.box)
        .forEach(c => {
            c.boxSelected = true;
            c.faceSelected = true;
            //select face
            c.face = controllerEdit.getFaceCloseToCamera(c.box);
        });
    //show panel
    uiVars.viewPanelFace = true;
    controllerEdit.updateFaceSelection();
    controllerEdit.runFaceDelegate();
    //ui
    uiVars.editBoxes = true;
    updateFaceEditPanel();
}

function btnExitFaceEdit() {
    uiVars.viewPanelFace = false;
}
function btnExitImageEdit() {
    uiVars.viewPanelFaceEdit = false;
}

function btnUseSuggestedImage(imgURL) {
    controllerImageEdit.reset();
    uiVars.selector.forEach(c => {
        c.Face = imgURL;
    });
    uiVars.viewPanelFaceEdit = true;
    updateUIVariables(uiVars.selector.selection);
    updateFaceEditPanel();
    //record undo
    undoMan.recordUndo("use suggested image");
}

function btnUseDefaultImage() {
    controllerImageEdit.reset();
    uiVars.selector.forEach(c => {
        c.Face = c.kitbash.defaultFace;
    });
    //record undo
    undoMan.recordUndo("use default image");
}

function btnFlipX() {
    btnFlip(true, false);
}

function btnFlipY() {
    btnFlip(false, true);
}

function btnFlip(flipX, flipY) {
    editFace(
        (img) => {
            img = flipImage(img, flipX, flipY);
            controllerImageEdit.imageEdit.flip(flipX, flipY);//dirty: directly accessing protected member imageEdit
            controllerImageEdit.boomerangCorners();
            return img;
        },
        //record undo
        () => {
            undoMan.recordUndo("flip image");
        }
    );
}

function btnRotateLeft() {
    btnRotate(-90);
}
function btnRotateRight() {
    btnRotate(90);
}
function btnRotate(degrees) {
    editFace(
        (img) => {
            img = rotateImage(img, degrees);
            controllerImageEdit.imageEdit.rotate(degrees);//dirty: directly accessing protected member imageEdit
            controllerImageEdit.boomerangCorners();
            return img;
        },
        //record undo
        () => {
            undoMan.recordUndo("rotate image");
        }
    );
}

function editFace(editFunc = (img) => img, completeFunc = () => { }) {
    const selection = uiVars.selector.selection
        .filter(c => c.validFaceIndex());
    const count = selection.length;
    let progress = 0;
    let progressFunc = () => {
        progress++;
        if (progress == count) {
            completeFunc();
        }
    };
    selection.forEach(c => {
        let imageURL = c.Face;
        let img = new Image();
        img.src = imageURL;
        img.onload = () => {
            img = editFunc(img);
            let url = img.src;
            c.Face = url;
            updateFaceEditPanel();
            player.animate();
            progressFunc();
        };
    });
}

function cropCanvasChanged(url) {
    uiVars.selector.forEach(c => {
        c.Face = url;
    });
    //turn off face highlighting
    uiVars.highlightSelectedFace = false;
}

function btnFaceCrop() {
    let corners = [...controllerImageEdit.imageEdit.cornerList];
    controllerImageEdit.crop();
    updateFaceEditPanel();
    player.animate();//needed?
    //record undo
    let undoState = undoMan.recordUndo("crop image");
    undoState.corners = corners;
}

function btnFaceErase() {
    controllerImageEdit.erase();
    updateFaceEditPanel();
    player.animate();//needed?
    //record undo
    undoMan.recordUndo("erase image");
}

function btnFaceOpacityDecrease() {
    controllerImageEdit.adjustOpacity(-25.5);
    //record undo
    undoMan.recordUndo("decrease opacity");
}
function btnFaceOpacityIncrease() {
    controllerImageEdit.adjustOpacity(25.5);
    //record undo
    undoMan.recordUndo("increase opacity");
}

function btnFaceZoomDecrease() {
    controllerImageEdit.adjustZoom(0.9);
    updateFaceEditPanel();
}
function btnFaceZoomIncrease() {
    controllerImageEdit.adjustZoom(1.1);
    updateFaceEditPanel();
}
function btnFaceZoomReset() {
    controllerImageEdit.resetZoom();
    updateFaceEditPanel();
}

function btnFaceBrightnessDecrease() {
    controllerImageEdit.adjustBrightness(-10);
}
function btnFaceBrightnessIncrease() {
    controllerImageEdit.adjustBrightness(10);
}

function btnFaceUndo() {
    actionUndo();
    uiVars.viewPanelFaceEdit = true;
    updateFaceEditPanel();
}
function btnFaceRedo() {
    actionRedo();
    uiVars.viewPanelFaceEdit = true;
    updateFaceEditPanel();
}

function btnFaceImport() {
    //2024-05-03: copied from actionImportBox()
    //2024-03-06: copied from CardGenerator
    //2024-03-03: copied from https://stackoverflow.com/a/56607553/2336212

    var el = document.createElement("INPUT");
    el.type = "file";
    el.accept = acceptStringImageFiles;
    el.multiple = false;

    el.addEventListener('change', (event) => {
        flm.handleFiles(
            el.files,
            () => {
                uiVars.highlightSelectedFace = false;
                controllerImageEdit.reset();
                updateFaceEditPanel();
                player.animate();
                //record undo
                undoMan.recordUndo("import image");
                uiVars.viewPanelFaceEdit = true;
            }
        );
    });

    el.click(); // open
}

function btnFaceReset() {
    uiVars.selector.forEach(c => {
        if (c.face == FACE_DEFAULT) {
            c.Face = PIXEL_WHITE;
        }
        else {
            c.Face = undefined;
        }
    });
    uiVars.viewPanelFaceEdit = false;
    updateFaceEditPanel();
    player.animate();
    //record undo
    undoMan.recordUndo("reset face");
}

function btnFaceClear() {
    uiVars.selector.selection
        .filter(c => c.face != FACE_DEFAULT)
        .forEach(c => {
            c.Face = PIXEL_TRANSPARENT;
        });
    uiVars.viewPanelFaceEdit = false;
    updateFaceEditPanel();
    player.animate();
    //record undo
    undoMan.recordUndo("make face transparent");
}
