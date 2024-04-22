"use strict";

function actionImportBox() {
    //2024-03-06: copied from CardGenerator
    //2024-03-03: copied from https://stackoverflow.com/a/56607553/2336212

    var el = document.createElement("INPUT");
    el.type = "file";
    el.accept = acceptStringAllFiles;
    el.multiple = true;

    el.addEventListener('change', (event) => {
        flm.handleFiles(el.files);
        //record undo
        undoMan.recordUndo("import box");
    });

    el.click(); // open

}

function actionExportBox() {
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
    filename ||= "box";
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

function actionSelectAll() {
    let room = house.rooms[0];//dirty: hard-coded room
    uiVars.selector.clear();
    room.furnitures.forEach(f => {
        controllerEdit.selectObject(f, true, -2, true);
    });
    player.animate();
}
function actionSelectNone() {
    uiVars.selector.clear();
    player.animate();
}
function actionSelectPieces() {
    let selection = uiVars.selector.selection;
    selection = selection.map(c => {
        if (c.obj.isKitBash) {
            return c.obj.items.map(f => {
                let sc = new SelectContext(f);
                sc.box = f;
                sc.grabInfo();
                return sc;
            });
        }
        else {
            return c;
        }
    })
        .flat(Infinity);
    uiVars.selector.clear();
    uiVars.selector.selectAll(selection);
    player.animate();
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
    _actionObjectCreate(
        "blank",
        "create blank object"
    );
}

function actionObjectCreateBlankFlatWall() {
    _actionObjectCreate(
        "blank wall",
        "create blank flat wall object",
        (f) => f.depth = 0
    );
}

function actionObjectCreateBlankFlatFloor() {
    _actionObjectCreate(
        "blank floor",
        "create blank flat floor object",
        (f) => f.height = 0
    );
}

function _actionObjectCreate(objName, undoMsg, processFunc = (f) => { }) {
    let box = new Box(PIXEL_WHITE);
    box.name = objName;
    processFunc(box);
    let room = house.rooms[0];//dirty: hardcoded which room to add to
    room.addBox(box);
    //Select new box
    controllerEdit.selectObject(box, false, FACE_DEFAULT);
    //Position new box
    let point = controllerEdit.getHitAtMousePos()?.point;
    if (point) {
        box.position = point;
    }
    // //focus field
    // $("txtWidth").focus();
    //record undo
    undoMan.recordUndo(undoMsg);
}

function actionObjectsCreateSkirt() {
    let furnitures = [];
    const count = 4;
    for (let i = 0; i < count; i++) {
        let box = new Box(PIXEL_WHITE);
        box.name = `skirt wall ${i + 1}/${count}`;
        box.depth = 0;
        box.angle = i * 90;
        box.position = new Vector3(
            (i % 2 == 0)
                ? 0
                : 0.5 * -Math.sign(i - 1.5),
            0,
            (i % 2 == 0)
                ? 0.5 * -Math.sign(i - 1.5)
                : 0
        );//dirty: assumes 4 sides
        furnitures.push(box);
    }
    //Group
    let room = house.rooms[0];//dirty: hardcoded which room to add to
    let group = room.group(furnitures);
    //Select new box
    controllerEdit.selectObject(group, false, undefined, true);
    //Position new box
    let point = controllerEdit.getHitAtMousePos()?.point;
    if (point) {
        group.position = point;
    }
    //record undo
    undoMan.recordUndo("create blank skirt object");
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
        room.addBox(newF);
        //Select new box
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
        f.room.removeBox(f);
        c.meshes.forEach(mesh => mesh.parent.remove(mesh));
    });
    //record undo
    undoMan.recordUndo("delete object");
}

function actionObjectsGroup() {
    let room = house.rooms[0];
    //remove from existing
    let furnitures = uiVars.selector.map(c => c.box);
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
    let furnitures = uiVars.selector.map(c => c.box);
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
