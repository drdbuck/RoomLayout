"use strict";

//
// ======= Update UI from data =======
//

function updateFurnitureEditPanel(contexts) {
    log("selected count:", controllerEdit.selector.count);
    let furnitures = contexts.map(c => c.obj);
    const reduceFunc = (a, b) => (a === b) ? a : undefined;
    const inequal = "---";
    const defaultText = (furnitures.length > 0) ? undefined : "";
    //Update UI
    let anySelected = furnitures.length > 0;
    $("divPanelEdit").hidden = !anySelected;
    if (anySelected){
    $("txtWidth").value = defaultText ?? furnitures.map(f => f.width).reduce(reduceFunc) ?? inequal;
    $("txtLength").value = defaultText ?? furnitures.map(f => f.length).reduce(reduceFunc) ?? inequal;
    $("txtHeight").value = defaultText ?? furnitures.map(f => f.height).reduce(reduceFunc) ?? inequal;
    }
    else {
        $("divFaceEdit").hidden = true;
    }
    //Update selected faces
    contexts.forEach(c => {
        updateFace(c.box, c.face);
    });
}


//
// ======= UI Controls =======
//

function btnFaceEdit() {
    $("divFaceEdit").hidden = false;
    controller.selectNextFace(1);
}

function btnExitFaceEdit() {
    $("divFaceEdit").hidden = true;
    controller.selectNextFace();
}
