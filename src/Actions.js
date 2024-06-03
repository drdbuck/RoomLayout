"use strict";

const DEFAULT_SCALE = new Vector3(2, 3, 1);

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
function actionSelectGroups() {
    let selection = uiVars.selector.selection;
    selection = selection
        .map(c => c.kkitbash ?? c.obj.group ?? c.obj)
        .filter(obj => obj.isKitBash)
        .removeDuplicates()
        .map(obj => new SelectContext(obj));
    uiVars.selector.clear();
    uiVars.selector.selectAll(selection);
    player.animate();
}
function actionSelectBox() {
    let selection = uiVars.selector.selection;
    selection = selection.map(c => {
        if (c.obj.isKitBash) {
            let sc = new SelectContext(c.box);
            sc.grabInfo();
            return sc;
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

function actionObjectCreateFurniture() {
    let spawnPoint = getSpawnPoint();
    createObjectDialogue.show(
        (answers) => _actionObjectCreateFurniture(answers, spawnPoint),
        ["Width", "Depth", "Height"],
        "Create Furniture"
    );
}
function _actionObjectCreateFurniture(answers, spawnPoint) {
    let room = house.rooms[0];//dirty: hard coded room
    let group = room.group();
    group.position = spawnPoint;
    group.width = answers.Width;
    group.depth = answers.Depth;
    group.height = answers.Height;
    //Select new box
    controllerEdit.selectObject(group, false);
    //record undo
    undoMan.recordUndo("create furniture");
    //ui
    player.animate();
    updateAllPanels();
}

function actionObjectCreateBlank() {
    let spawnPoint = getSpawnPoint();
    _actionObjectCreate(
        "box _",
        "create box",
        (f) => {
            f.scale = DEFAULT_SCALE;
        },
        spawnPoint
    );
}

function actionObjectCreateBlankFlatWall() {
    let spawnPoint = getSpawnPoint();
    _actionObjectCreate(
        "rectangle _",
        "create rectangle",
        (f) => {
            f.scale = DEFAULT_SCALE;
            f.depth = 0;
            f.setFace(5, PIXEL_TRANSPARENT);
        },
        spawnPoint
    );
}

function actionObjectCreateBlankFlatFloor() {
    let spawnPoint = getSpawnPoint();
    _actionObjectCreate(
        "floor rectangle _",
        "create floor rectangle",
        (f) => {
            f.scale = DEFAULT_SCALE;
            f.height = 0;
            f.setFace(3, PIXEL_TRANSPARENT);
        },
        spawnPoint
    );
}

function _actionObjectCreate(objName, undoMsg, processFunc = (f) => { }, spawnPoint) {
    let box = new Box();
    box.name = objName;
    processFunc(box);
    //
    spawnPoint ??= getSpawnPoint();
    //ids
    uiVars.giveUids(box);
    box.name = box.name.replace("_", box.uid);
    //find selected group
    let group = uiVars.selector.find(c => c.kitbash)?.kitbash;
    //
    if (group) {
        //if first box in group, set it to group's size
        if (group.count == 0) {
            box.scale = group.scale.clone();
        }
        //limit size to group size
        box.scale.clamp(_zero, group.scale);
        //add to group
        group.add(box);
        box.worldPosition = spawnPoint;
    }
    else {
        let room = house.rooms[0];//dirty: hardcoded which room to add to
        group = room.group(box, PIXEL_WHITE);
        group.position = spawnPoint;
    }
    //Select new box
    controllerEdit.selectObject(box, false, FACE_DEFAULT, false);
    // //focus field
    // $("txtWidth").focus();
    //record undo
    undoMan.recordUndo(undoMsg);
}

function actionObjectsCreateSkirt() {
    let spawnPoint = getSpawnPoint();
    createObjectDialogue.show(
        (answers) => _actionObjectsCreateSkirt(answers, spawnPoint),
        undefined, //size, recline
        "Create Skirt"
    );
}
function _actionObjectsCreateSkirt(answers, spawnPoint) {
    //
    const width = answers.Width;
    const depth = answers.Depth;
    const height = answers.Height;
    const recline = answers.Recline;
    //
    spawnPoint ??= getSpawnPoint();
    //
    let group = new KitBash();
    group.position = spawnPoint;
    //
    const count = 4;
    for (let i = 0; i < count; i++) {
        let box = new Box();
        group.add(box);
        box.name = `skirt wall ${i + 1}/${count}`;
        let dim = (i % 2 == 0) ? width : depth;
        let dim2 = (i % 2 == 0) ? depth : width;
        box.width = dim;
        box.depth = 0;
        box.height = height;
        box.angle = i * 90;//dirty: assumes 4 sides
        box.recline = recline;
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
    }
    // group.recalculateSize();
    group.scale = new Vector3(width, height, depth);
    //Group
    //find selected group
    let selectgroup = uiVars.selector.find(c => c.kitbash)?.kitbash;
    let newGroup = !selectgroup;
    //
    if (selectgroup) {
        let items = group.items;
        items.forEach(item => {
            group.remove(item);
            selectgroup.add(item);
        });
        group = undefined;
    }
    else {
        let room = house.rooms[0];//dirty: hardcoded which room to add to
        room.addFurniture(group);
    }
    //Select new box
    controllerEdit.selectObject(group ?? selectgroup, false, undefined, newGroup);
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
        if (newF.isKitBash) {
            room.addFurniture(newF);
        }
        else {
            let group = c.obj.group;
            group.add(newF);
        }
        //Select new box
        controllerEdit.selectObject(newF, true);
    });
    //record undo
    undoMan.recordUndo("duplicate object");
}

function actionObjectsDelete() {
    let delList = uiVars.selector.selection;
    uiVars.selector.clear();
    delList.forEach(c => {
        let f = c.obj;
        if (f.group) {
            f.group.remove(f);
        }
        f.room.removeFurniture(f);
        c.meshes.forEach(mesh => mesh.parent?.remove(mesh));
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

function actionObjectsRecenter() {
    uiVars.selector.selection
        .map(c => c.kitbash)
        .removeDuplicates()
        .forEach(group => group.recenterPivot());
    //record undo
    undoMan.recordUndo("recenter pivot");
    //ui
    player.animate();
    updateGroupEditPanel();
    updateBoxEditPanel();
}

function actionObjectsRecalculateSize() {
    uiVars.selector.selection
        .map(c => c.kitbash)
        .removeDuplicates()
        .forEach(group => group.recalculateSize());
    //record undo
    undoMan.recordUndo("recalculate size");
    //ui    
    player.animate();
    updateGroupEditPanel();
    updateBoxEditPanel();
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

function actionTogglePanelEditBox() {
    uiVars.editBoxes = !uiVars.editBoxes;
}

function actionTogglePanelFaceView() {
    uiVars.viewPanelFace = !uiVars.viewPanelFace;
}
function actionTogglePanelFaceEdit() {
    uiVars.viewPanelFaceEdit = !uiVars.viewPanelFaceEdit;
}
