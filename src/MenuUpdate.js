"use strict";

function _updateEnabled(btnId, enabled) {
    let btn = $(btnId);
    btn.disabled = !enabled;
    return enabled;
}

//
//
//

function menuUpdateSelectMinimum(btnId, min = 1) {
    return _updateEnabled(btnId, uiVars.selector.count >= min);
}

//
//
//

function menuUpdateUndo(btnId) {
    //btn
    _updateEnabled(btnId, undoMan.stateIndex > 0);
    //lbl
    let lbl = $(`${btnId}_label`);
    let changeName = undoMan.getStateLabel();
    lbl.innerHTML = `Undo ${changeName}`;
}
function menuUpdateRedo(btnId) {
    //btn
    _updateEnabled(btnId, undoMan.stateIndex < undoMan.stateCount - 1);
    //lbl
    let lbl = $(`${btnId}_label`);
    let changeName = undoMan.getStateLabel(1);
    lbl.innerHTML = `Redo ${changeName}`;
}

function menuUpdateObjectsUngroup(btnId) {
    let minEnabled = menuUpdateSelectMinimum(btnId);
    _updateEnabled(
        btnId,
        minEnabled && uiVars.selector.some(c => c.kitbash || c.obj.isKitBash)
    );
}
