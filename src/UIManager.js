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
                    value = parseFootInchInput(rawvalue);
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
                let dimensions = parseDimensions(rawvalue, 1);
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
    onChangeFunc("txtGroupAngle", glistfunc, (g, v) => controllerEdit.setBoxAngle(g, v), true, false);

    //BOX
    let flistfunc = () => uiVars.selector.map(c => c.box);
    //Name
    onChangeFunc("txtName", flistfunc, (f, v) => f.name = v, false);
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
    onChangeFunc("txtAngle", flistfunc, (f, v) => controllerEdit.setBoxAngle(f, v), true, false);
    onChangeFunc("txtRecline", flistfunc, (f, v) => controllerEdit.setBoxRecline(f, v), true, false);
    //Top
    onChangeFuncGroup(
        flistfunc,
        updateBoxEditPanel,
        { id: "txtWidthTop", symbol: "w", func: (f, v) => f.widthTop = v },
        { id: "txtLengthTop", symbol: "d", func: (f, v) => f.depthTop = v },
    );
    onChangeFunc("txtPosXTop", flistfunc, (f, v) => f.positionTop = f.positionTop.setX(v));
    onChangeFunc("txtPosYTop", flistfunc, (f, v) => f.positionTop = f.positionTop.setZ(v));

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
    _groups = contexts.map(c => c.kitbash).filter(kb => kb);
    _boxs = contexts.map(c => c.box).filter(b => b);
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
    updateFunc("txtGroupAngle", glist, g => g.angle);

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
    updateFunc("txtName", flist, f => f.name, false);
    $("txtName").disabled = !(anySelected && _boxs.length == 1);
    //Size
    updateFunc("txtWidth", flist, f => f.width);
    updateFunc("txtLength", flist, f => f.length);
    updateFunc("txtHeight", flist, f => f.height);
    //Position
    updateFunc("txtPosX", flist, f => f.position.x);
    updateFunc("txtPosY", flist, f => f.position.z);
    updateFunc("txtAltitude", flist, f => f.altitude);
    updateFunc("txtAngle", flist, f => f.angle);
    updateFunc("txtRecline", flist, f => f.recline);
    //Top
    updateFunc("txtWidthTop", flist, f => f.widthTop);
    updateFunc("txtLengthTop", flist, f => f.depthTop);
    updateFunc("txtPosXTop", flist, f => f.positionTop.x);
    updateFunc("txtPosYTop", flist, f => f.positionTop.z);

    //Buttons
    $("btnFaceEdit").checked = uiVars.viewPanelFace;
    $("btnFaceEdit").disabled = !anySelected;
}

function registerUIDelegates(context, register) {

    //group
    let group = context.kitbash;
    if (group) {
        [
            group.onPositionChanged,
            group.onAngleChanged,
        ]
            .forEach(del => del.listen(updateGroupEditPanel, register));
    }
    else {
        console.error("context has no group!", context.box.name, group, context);
    }

    //box
    let box = context.box;
    if (!box) { return; }
    [
        box.onSizeChanged,
        box.onPositionChanged,
        box.onAngleChanged,
    ]
        .forEach(del => del.listen(updateBoxEditPanel, register));

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
    if (!showPanel) { return; }

    //spnFaceName
    const faces = _faces;
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
    let faceContexts = _contexts.filter(c => c.validFaceIndex());//dirty: using stored _contexts
    let imageURLs = faceContexts
        .map(c => {
            let box = c.box;
            return box.getFace(c.face);
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
        _contexts
            .filter(c => c.box)
            .forEach(context => {//dirty: using _contexts
                let f = context.box;
                suggest.push(f.lastImage);
            });
        //image from other side
        _contexts.forEach(context => {//dirty: using _contexts
            if (context.face < 0) { return; }
            let f = context.box;
            let flipFace = context.face + ((context.face % 2 == 0) ? 1 : -1);
            let flipURL = f.getFace(flipFace);
            suggest.push(flipURL);
        });
        //default face image
        _contexts.forEach(context => {//dirty: using _contexts
            let f = context.kitbash ?? context.box;
            suggest.push(f.defaultFace);
        });
        //images from other sides
        _boxs.forEach(box => {
            box.faceList.forEach(face => suggest.push(face));
        });
        //images from other meshes in same group
        _groups.forEach(group => {
            group.items.forEach(item => {
                item.faceList.forEach(face => suggest.push(face));
            });
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
            //uiVars.selector.forEach(c => c.Face = url);
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
    let showFaceEdit = usingImage && uiVars.viewPanelFaceEdit;
    if (showFaceEdit) {
        controllerImageEdit.updateImage(_contexts.find(c => c.validFaceIndex()));//dirty: _contexts
    }
    $("divImageEdit").hidden = !showFaceEdit;
    $("btnPanelFaceEdit").hidden = !usingImage;
    $("btnFaceClear").hidden = !(!usingImage && _contexts.some(c => c.box && c.box?._faces[c.face] != PIXEL_TRANSPARENT)
        || usingImage && _contexts.find(c => c.validFaceIndex())?.face >= 0
    );//dirty: _contexts
    $("btnFaceImport").hidden = !!usingImage;
    $("btnFaceClear").innerHTML = (usingImage) ? "Clear Face" : "Make Transparent";
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

function btnFaceEdit() {
    actionTogglePanelFaceView();
}

function btnExitFaceEdit() {
    uiVars.viewPanelFace = false;
}

function btnUseSuggestedImage(imgURL) {
    uiVars.selector.forEach(c => {
        c.Face = imgURL;
    });
    uiVars.viewPanelFaceEdit = true;
    updateFaceEditPanel();
    //record undo
    undoMan.recordUndo("use suggested image");
}

function btnUseDefaultImage() {
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
            completeCalled = true;
            completeFunc();
        }
    }
    selection.forEach(c => {
        let f = c.box;
        let faceIndex = c.face;
        let imageURL = f.getFace(faceIndex);
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

function btnFaceClear() {
    uiVars.selector.forEach(c => {
        c.Face = PIXEL_TRANSPARENT;
    });
    uiVars.viewPanelFaceEdit = false;
    updateFaceEditPanel();
    player.animate();
    //record undo
    undoMan.recordUndo("clear image");
}
