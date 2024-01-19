"use strict";

function updateFurnitureEditPanel(contexts) {
    log("selected count:", controllerEdit.selector.count);
    let furnitures = contexts.map(c => c.obj);
    const reduceFunc = (a, b) => (a === b) ? a : undefined;
    const inequal = "---";
    const defaultText = (furnitures.length > 0) ? undefined : "";
    //Update UI
    $("divPanelEdit").hidden = !(furnitures.length > 0);
    $("txtWidth").value = defaultText ?? furnitures.map(f => f.width).reduce(reduceFunc) ?? inequal;
    $("txtLength").value = defaultText ?? furnitures.map(f => f.length).reduce(reduceFunc) ?? inequal;
    $("txtHeight").value = defaultText ?? furnitures.map(f => f.height).reduce(reduceFunc) ?? inequal;
    //Update selected faces
    contexts.forEach(c => {
        updateFace(c.box, c.face);
    });
}
