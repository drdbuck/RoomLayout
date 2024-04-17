"use strict";

function actionImportFurniture() {
    //2024-03-06: copied from CardGenerator
    //2024-03-03: copied from https://stackoverflow.com/a/56607553/2336212

    var el = document.createElement("INPUT");
    el.type = "file";
    el.accept = acceptStringAllFiles;
    el.multiple = true;

    el.addEventListener('change', (event) => {
        flm.handleFiles(el.files);
        //record undo
        undoMan.recordUndo("import furniture");
    });

    el.click(); // open

}

function actionExportFurniture() {
    let furnitures = uiVars.selector.map(context => context.obj);
    if (furnitures.length === 0) {
        //Do nothing
        return;
    }
    //Init savable object
    let listObj = {};
    listObj.list = furnitures;
    //Determine filename
    let filename = "";
    for (let i = 0; i < furnitures.length; i++) {
        let name = furnitures[i].name;
        if (!isEmpty(name)) {
            filename += name + ", ";
            break;
        }
    }
    if (filename.endsWith(", ")) {
        filename = filename.substring(0, filename.length - 2);
    }
    filename ||= "furniture";
    //make json
    let json = JSON.stringify(
        listObj,
        getDataStringify().concat(["list"])
    );
    //Download file
    window.download(
        json,
        filename + '.' + EXTENSION_FURNITURE,
        'data:application/txt'
    );
}

function actionExportRoom() {
    let i = 0;
    let room = house.rooms[i];//dirty: hard coding which room to download
    if (!room) {
        //Do nothing
        return;
    }
    //Determine filename
    let filename = room.name || `room${i + 1}`;
    //make json
    let json = JSON.stringify(
        room,
        getDataStringify()
    );
    //Download file
    window.download(
        json,
        filename + '.' + EXTENSION_ROOM,
        'data:application/txt'
    );
}

function actionUndo() {
    undoMan.undo();
    player.animate();
}

function actionRedo() {
    undoMan.redo();
    player.animate();
}

function actionObjectCreateBlank() {
    let furniture = new Furniture(PIXEL_WHITE);
    furniture.name = "blank";
    let room = house.rooms[0];//dirty: hardcoded which room to add to
    room.addFurniture(furniture);
    //Select new furniture
    controllerEdit.selectObject(furniture, false, FACE_DEFAULT);
    //Position new furniture
    let point = controllerEdit.getHitAtMousePos()?.point;
    if (point) {
        furniture.position = point;
    }
    // //focus field
    // $("txtWidth").focus();
    //record undo
    undoMan.recordUndo("create blank object");
}

function actionObjectCreateBlankFlatWall() {
    let furniture = new Furniture(PIXEL_WHITE);
    furniture.name = "blank wall";
    furniture.depth = 0;
    let room = house.rooms[0];//dirty: hardcoded which room to add to
    room.addFurniture(furniture);
    //Select new furniture
    controllerEdit.selectObject(furniture, false, FACE_DEFAULT);
    //Position new furniture
    let point = controllerEdit.getHitAtMousePos()?.point;
    if (point) {
        furniture.position = point;
    }
    // //focus field
    // $("txtWidth").focus();
    //record undo
    undoMan.recordUndo("create blank flat wall object");
}

function actionObjectCreateBlankFlatFloor() {
    let furniture = new Furniture(PIXEL_WHITE);
    furniture.name = "blank floor";
    furniture.height = 0;
    let room = house.rooms[0];//dirty: hardcoded which room to add to
    room.addFurniture(furniture);
    //Select new furniture
    controllerEdit.selectObject(furniture, false, FACE_DEFAULT);
    //Position new furniture
    let point = controllerEdit.getHitAtMousePos()?.point;
    if (point) {
        furniture.position = point;
    }
    // //focus field
    // $("txtWidth").focus();
    //record undo
    undoMan.recordUndo("create blank flat floor object");
}

function actionObjectsDuplicate() {
    const stringify = getDataStringify();
    let selection = uiVars.selector.selection;
    uiVars.selector.clear();
    let room = house.rooms[0];//dirty: hardcoded which room to add to
    //
    selection.forEach(c => {
        let f = c.obj;
        let newF = JSON.parse(JSON.stringify(f, stringify));
        inflateData(newF);
        //Data
        room.addFurniture(newF);
        //Select new furniture
        controllerEdit.selectObject(newF, true);
        //make it easier to find the new duplicate in the scene
        let offset = new Vector3(0.5, 0, 0.5);
        offset.add(newF.position);
        newF.position = offset;
    });
    //record undo
    undoMan.recordUndo("duplicate object");
}

function actionObjectsDelete() {
    let delList = uiVars.selector.selection;
    uiVars.selector.clear();
    delList.forEach(c => {
        let f = c.obj;
        f.room.removeFurniture(f);
        c.boxes.forEach(box => box.parent.remove(box));
    });
    //record undo
    undoMan.recordUndo("delete object");
}

function actionObjectsGroup() {
    let room = house.rooms[0];
    //remove from existing
    let furnitures = uiVars.selector.map(c => c.furniture);
    furnitures.forEach(f => f.group?.remove(f));
    //add to new
    let group = room.group(furnitures);
    //early exit: group wasn't made (ex: if there was only one object)
    if (!group) { return; }
    //select group
    controllerEdit.selectObject(group, false);
    //record undo
    undoMan.recordUndo("group objects");
}
function actionObjectsUngroup() {
    //remove from existing
    let furnitures = uiVars.selector.map(c => c.furniture);
    furnitures.forEach(f => f.group?.remove(f));
    //
    uiVars.selector.clear();
    //record undo
    undoMan.recordUndo("ungroup object");
}

function actionViewOverhead() {
    uiVars.viewId = VIEW_OVERHEAD;
    player.animate();
}

function actionViewImmersive() {
    uiVars.viewId = VIEW_FIRSTPERSON;
    player.animate();
}

function actionTogglePanelEditRoom() {
    uiVars.editRooms = !uiVars.editRooms;
}

function actionTogglePanelEditObject() {
    uiVars.editObjects = !uiVars.editObjects;
}

function actionTogglePanelFaceView() {
    uiVars.viewPanelFace = !uiVars.viewPanelFace;
}
function actionTogglePanelFaceEdit() {
    uiVars.viewPanelFaceEdit = !uiVars.viewPanelFaceEdit;
}
