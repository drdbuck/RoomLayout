"use strict";

function actionImportBox() {
    //2024-03-06: copied from CardGenerator
    //2024-03-03: copied from https://stackoverflow.com/a/56607553/2336212

    var el = document.createElement("INPUT");
    el.type = "file";
    el.accept = acceptStringAllFiles;
    el.multiple = true;

    el.addEventListener('change', (event) => {
        flm.handleFiles(
            el.files,
            () => undoMan.recordUndo("import box")
        );
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
                sc.kitbash = f.group;
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
        "box _",
        "create box"
    );
}

function actionObjectCreateBlankFlatWall() {
    _actionObjectCreate(
        "rectangle _",
        "create rectangle",
        (f) => f.depth = 0
    );
}

function actionObjectCreateBlankFlatFloor() {
    _actionObjectCreate(
        "floor rectangle _",
        "create floor rectangle",
        (f) => f.height = 0
    );
}

function _actionObjectCreate(objName, undoMsg, processFunc = (f) => { }) {
    let box = new Box();
    box.name = objName;
    processFunc(box);
    //ids
    uiVars.giveUids(box);
    box.name = box.name.replace("_", box.uid);
    //find selected group
    let group = uiVars.selector.find(c => c.kitbash)?.kitbash;
    //
    if (group) {
        group.add(box);
    }
    else {
        let room = house.rooms[0];//dirty: hardcoded which room to add to
        group = room.group(box, PIXEL_WHITE);
    }
    //Select new box
    controllerEdit.selectObject(box, false, FACE_DEFAULT, false);
    //Position new box
    let point = controllerEdit.getHitAtMousePos()?.point;
    if (point) {
        box.worldPosition = point;
    }
    // //focus field
    // $("txtWidth").focus();
    //record undo
    undoMan.recordUndo(undoMsg);
}

function actionObjectsCreateSkirt() {
    createObjectDialogue.show(
        _actionObjectsCreateSkirt,
        undefined //size, recline
    );
}
function _actionObjectsCreateSkirt(answers) {
    let boxes = [];
    const count = 4;
    for (let i = 0; i < count; i++) {
        let box = new Box();
        box.name = `skirt wall ${i + 1}/${count}`;
        let dim = (i % 2 == 0) ? answers.Width : answers.Depth;
        let dim2 = (i % 2 == 0) ? answers.Depth : answers.Width;
        box.width = dim;
        box.depth = 0;
        box.height = answers.Height;
        box.angle = i * 90;//dirty: assumes 4 sides
        box.recline = answers.Recline;
        box.position = new Vector3(
            (i % 2 == 0)
                ? 0
                : dim2 * 0.5 * -Math.sign(i - 1.5),
            0,
            (i % 2 == 0)
                ? dim2 * 0.5 * -Math.sign(i - 1.5)
                : 0
        );//dirty: assumes 4 sides
        box.setFace(5, PIXEL_TRANSPARENT);
        boxes.push(box);
    }
    //Group
    //find selected group
    let group = uiVars.selector.find(c => c.kitbash)?.kitbash;
    let newGroup = !group;
    //
    if (group) {
        group.add(boxes);
    }
    else {
        let room = house.rooms[0];//dirty: hardcoded which room to add to
        group = room.group(boxes, PIXEL_WHITE);
        group.angle = 0;
    }
    //Select new box
    controllerEdit.selectObject(group, false, undefined, newGroup);
    //Position new box
    let point = controllerEdit.getHitAtMousePos()?.point;
    if (point) {
        group.position = point;
    }
    //record undo
    undoMan.recordUndo("create skirt prefab");
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
        f.room.removeFurniture(f);
        c.meshes.forEach(mesh => mesh.parent.remove(mesh));
    });
    //record undo
    undoMan.recordUndo("delete object");
}

function actionObjectsGroup() {
    let room = house.rooms[0];
    //remove from existing
    let boxes = uiVars.selector.map(c => c.box);
    boxes.forEach(f => f.group?.remove(f));
    let defaultImage = uiVars.selector
        .map(c => c.kitbash?.defaultImage)
        .filter(iu => iu)[0];
    //add to new
    let group = room.group(boxes, defaultImage);
    //early exit: group wasn't made (ex: if there was only one object)
    if (!group) { return; }
    //select group
    controllerEdit.selectObject(group, false);
    //record undo
    undoMan.recordUndo("group objects");
}
function actionObjectsUngroup() {
    //remove from existing
    let boxes = uiVars.selector.map(c => c.box);
    boxes.forEach(f => f.group?.remove(f));
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
