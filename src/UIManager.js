"use strict";

let _contexts = [];//dirty
let _boxs = [];//dirty
let _faces = [];//dirty
const reduceFunc = (a, b) => (a === b) ? a : undefined;
const inequal = "---";
const DIGITS_OF_PRECISION = 3;
const updateFunc = (id, list, func, float = true) => {
    //early exit: this txt is active
    if (document.activeElement.id === id) { return; }
    //processing
    let value = list.map(func).reduce(reduceFunc);
    if (value && float) {
        value = Math.cut(value, DIGITS_OF_PRECISION);
    }
    $(id).value = value ?? inequal;
}

function initUI() {

    //title
    document.title = `${APP_NAME} v${VERSION}`;

    //individual textmesh listeners
    const onChangeFunc = (id, list, func, float = true, allowFootNotation = true) => {
        let txtChanged = false;
        let prevValue;
        const txt = $(id);
        txt.onfocus = () => {
            txt.select();
            txtChanged = false;
            prevValue = txt.value;
        }
        txt.onkeyup = () => {
            list ??= uiVars.selector;
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
            list.forEach(
                context => func(context.obj ?? context, value)
            );
            player.animate();
        };
        txt.onblur = () => {
            if (txtChanged) {
                //record undo
                undoMan.recordUndo("change object attribute");
            }
        }
    };

    const onChangeFuncGroup = (list, onblur, ...paramObjs) => {
        paramObjs.flat();
        //
        const _changeFunc = (dimensions) => {
            list ??= uiVars.selector;//dirty: hardcoding
            Object.keys(dimensions).forEach(d => {
                let value = dimensions[d];
                if (value == undefined) { return; }
                let dfunc = paramObjs.find(po => po.symbol == d).func;
                list.forEach(
                    context => dfunc(context.obj ?? context, value)
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
            }
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
                if (!list) { return; }
                if (txtChanged) {
                    //record undo
                    undoMan.recordUndo("change object attribute");
                }
                onblur();
            };
        });
    }

    //ROOM
    let rlist = house.rooms;//dirty: hard-coding whole list
    //Name
    onChangeFunc("txtNameRoom", rlist, (r, v) => r.name = v, false);
    //Size
    onChangeFuncGroup(
        rlist,
        updateRoomEditPanel,
        { id: "txtWidthRoom", symbol: "w", func: (r, v) => r.width = v },
        { id: "txtLengthRoom", symbol: "l", func: (r, v) => r.length = v },
        { id: "txtHeightRoom", symbol: "h", func: (r, v) => r.height = v },
    );
    //Position
    // onChangeFunc("txtPosXRoom", rlist, (r, v) => r.position = r.position.setX(v));
    // onChangeFunc("txtPosYRoom", rlist, (r, v) => r.position = r.position.setZ(v));
    // onChangeFunc("txtAltitudeRoom", rlist, (r, v) => r.altitude = v);

    //FURNITURE
    let flist = controllerEdit?.selector;
    //Name
    onChangeFunc("txtName", flist, (f, v) => f.name = v, false);
    //Size
    onChangeFuncGroup(
        flist,
        updateBoxEditPanel,
        { id: "txtWidth", symbol: "w", func: (f, v) => f.width = v },
        { id: "txtLength", symbol: "d", func: (f, v) => f.length = v },
        { id: "txtHeight", symbol: "h", func: (f, v) => f.height = v },
    );
    //Position
    onChangeFunc("txtPosX", flist, (f, v) => controllerEdit.setBoxPosition(f, f.position.setX(v)));
    onChangeFunc("txtPosY", flist, (f, v) => controllerEdit.setBoxPosition(f, f.position.setZ(v)));
    onChangeFunc("txtAltitude", flist, (f, v) => controllerEdit.setBoxAltitude(f, v));
    onChangeFunc("txtAngle", flist, (f, v) => controllerEdit.setBoxAngle(f, v), true, false);
    onChangeFunc("txtRecline", flist, (f, v) => controllerEdit.setBoxRecline(f, v), true, false);

}

//
// ======= Update UI from data =======
//

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

function updateBoxEditPanel(contexts) {
    log("selected count:", uiVars.selector.count);

    //only accept array input
    if (!Array.isArray(contexts)) {
        contexts = undefined;
    }

    //defaults
    _contexts = contexts ?? _contexts;
    contexts ??= _contexts;
    _boxs = contexts?.map(c => c.obj);
    _faces = contexts?.filter(c => c.box.validFaceIndex(c.face)).map(c => c.face);

    //check if panel should be shown
    let showPanel = uiVars.editObjects;
    $("divPanelEdit").hidden = !showPanel;
    if (!showPanel) { return; }

    //Update UI
    let anySelected = _contexts.length > 0;
    updateFaceEditPanel();

    if (!anySelected) { return; }

    $("hEditBox").innerHTML = `Edit ${(_contexts.every(c => c.obj.isKitBash)) ? "Group" : "Box"}`;

    let flist = _boxs;

    //Name
    $("txtName").disabled = !(contexts.length == 1);
    updateFunc("txtName", flist, f => f.name, false);
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


    $("btnFaceEdit").checked = uiVars.viewPanelFace;

    //
}

function registerUIDelegates(box, register) {
    if (register) {
        box.onSizeChanged.add(updateBoxEditPanel);
        box.onPositionChanged.add(updateBoxEditPanel);
        box.onAngleChanged.add(updateBoxEditPanel);
        box.onFaceChanged.add(updateFaceEditPanel);
    }
    else {
        if (!box.onSizeChanged) { return; }
        box.onSizeChanged.remove(updateBoxEditPanel);
        box.onPositionChanged.remove(updateBoxEditPanel);
        box.onAngleChanged.remove(updateBoxEditPanel);
        box.onFaceChanged.remove(updateFaceEditPanel);
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
    let showPanel = uiVars.viewPanelFace;
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
    let faceContexts = _contexts.filter(c => c.box.validFaceIndex(c.face));//dirty: using stored _contexts
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
        _contexts.forEach(context => {//dirty: using _contexts
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
            let f = context.box;
            suggest.push(f.defaultFace);
        });
        //images from other sides
        _contexts.forEach(context => {//dirty: using _contexts
            let f = context.box;
            f.faceList.forEach(face => suggest.push(face));
        });
        //images from other meshes in same group
        _contexts.forEach(context => {//dirty: using _contexts
            context.box.group?.items.forEach(item => {
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
            //uiVars.selector.forEach(c => c.box.setFace(c.face, url));
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
        controllerImageEdit.updateImage(_contexts.find(c => c.box.validFaceIndex(c.face)));//dirty: _contexts
    }
    $("divImageEdit").hidden = !showFaceEdit;
    $("btnPanelFaceEdit").hidden = !usingImage;
    $("btnFaceClear").hidden = !(!usingImage && _contexts.some(c => c.box._faces[c.face] != PIXEL_TRANSPARENT)
        || usingImage && _contexts.find(c => c.box.validFaceIndex(c.face))?.face >= 0
    );//dirty: _contexts
    $("btnFaceClear").innerHTML = (usingImage) ? "Clear Face" : "Make Transparent";
}


//
// ======= UI Controls =======
//

function btnExitRoomEdit() {
    uiVars.editRooms = false;
}

function btnExitBoxEdit() {
    uiVars.editObjects = false;
}

function btnBoxExport() {
    actionExportBox();
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
        if (!c.box.validFaceIndex(c.face)) { return; }
        let f = c.box;
        f.setFace(c.face, imgURL);
    });
    uiVars.viewPanelFaceEdit = true;
    updateFaceEditPanel();
    //record undo
    undoMan.recordUndo("use suggested image");
}

function btnUseDefaultImage() {
    uiVars.selector.forEach(c => {
        if (!c.box.validFaceIndex(c.face)) { return; }
        let f = c.box;
        f.setFace(c.face, f.defaultFace);
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
    uiVars.selector.forEach(c => {
        let f = c.box;
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
            updateFaceEditPanel();
            player.animate();
        }
    });
    //record undo
    undoMan.recordUndo("flip image");
}

function btnRotateLeft() {
    btnRotate(-90);
}
function btnRotateRight() {
    btnRotate(90);
}
function btnRotate(degrees) {
    uiVars.selector.forEach(c => {
        let f = c.box;
        let faceIndex = c.face;
        if (!f.validFaceIndex(faceIndex)) { return; }
        let imageURL = f.getFace(faceIndex);
        let img = new Image();
        img.src = imageURL;
        img.onload = () => {
            img = rotateImage(img, degrees);
            controllerImageEdit.imageEdit.rotate(degrees);//dirty: directly accessing protected member imageEdit
            controllerImageEdit.boomerangCorners();
            let url = img.src;
            f.setFace(faceIndex, url);
            updateFaceEditPanel();
            player.animate();
        }
    });
    //record undo
    undoMan.recordUndo("rotate image");
}//

function cropCanvasChanged(url) {
    uiVars.selector.forEach(c => {
        let f = c.box;
        let faceIndex = c.face;
        if (!f.validFaceIndex(faceIndex)) { return; }
        f.setFace(faceIndex, url);
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

function btnFaceClear() {
    uiVars.selector.forEach(c => {
        if (!c.box.validFaceIndex(c.face)) { return; }
        let f = c.box;
        f.setFace(c.face, PIXEL_TRANSPARENT);
    });
    uiVars.viewPanelFaceEdit = false;
    updateFaceEditPanel();
    player.animate();
    //record undo
    undoMan.recordUndo("clear image");
}
