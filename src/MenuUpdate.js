"use strict";

function menuUpdateSelectMinimum(btnId, min = 1) {
    let btn = $(btnId);
    let enabled = uiVars.selector.count >= min;
    btn.disabled = !enabled;
    return enabled;
}

function menuUpdateUndo(btnId) {
    let btn = $(btnId);
    let enabled = undoMan.stateIndex > 0;
    btn.disabled = !enabled;
    let lbl = $(`${btnId}_label`);
    let changeName = undoMan.getStateLabel();
    lbl.innerHTML = `Undo ${changeName}`;
}
function menuUpdateRedo(btnId) {
    //btn
    let btn = $(btnId);
    let enabled = undoMan.stateIndex < undoMan.stateCount - 1;
    btn.disabled = !enabled;
    //lbl
    let lbl = $(`${btnId}_label`);
    let changeName = undoMan.getStateLabel(1);
    lbl.innerHTML = `Redo ${changeName}`;
}

function menuUpdateObjectsUngroup(btnId) {
    let minEnabled = menuUpdateSelectMinimum(btnId);
    let btn = $(btnId);
    let enabled = minEnabled && uiVars.selector.some(c => c.kitbash || c.obj.isKitBash);
    btn.disabled = !enabled;
}
