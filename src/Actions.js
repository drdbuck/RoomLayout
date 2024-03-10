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
    });

    el.click(); // open

}

function actionExportFurniture() {
    let furnitures = controllerEdit.selector.map(context => context.obj);
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
        filename + '.frn',
        'data:application/txt'
    );
}

function actionObjectsDuplicate() {
    const stringify = getDataStringify();
    let selection = controllerEdit.selector.selection;
    controllerEdit.selector.clear();
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
}

function actionObjectsDelete() {
    let delList = controllerEdit.selector.selection;
    controllerEdit.selector.clear();
    delList.forEach(c => {
        let f = c.obj;
        f.room.removeFurniture(f);
        c.boxes.forEach(box => box.parent.remove(box));
    });
}

function actionObjectsGroup() {
    let room = house.rooms[0];
    //remove from existing
    let furnitures = controllerEdit.selector.map(c => c.furniture);
    furnitures.forEach(f => f.group?.remove(f));
    //add to new
    let group = room.group(furnitures);
    //select group
    controllerEdit.selectObject(group, false);
}

function actionTogglePanelEditRoom() {
    uiVars.editRooms = !uiVars.editRooms;
}

function actionTogglePanelEditObject() {
    uiVars.editObjects = !uiVars.editObjects;
}

function actionTogglePanelEditFace() {
    uiVars.editFaces = !uiVars.editFaces;
}
