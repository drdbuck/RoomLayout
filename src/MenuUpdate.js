"use strict";

function _updateEnabled(btnId, enabled) {
    let btn = $(btnId);
    btn.disabled = !enabled;
    return enabled;
}

function _updateLabel(btnId, text) {
    let lbl = $(`${btnId}_label`);
    lbl.innerHTML = text;
}

//
//
//

function menuUpdateSelectMinimum(btnId, min = 1) {
    return _updateEnabled(btnId, uiVars.selector.count >= min);
}

function menuUpdateGroupSelected(btnId, min = 1) {
    let minEnabled = menuUpdateSelectMinimum(btnId);
    _updateEnabled(
        btnId,
        minEnabled && uiVars.selector.some(c => c.kitbash || c.obj.isKitBash)
    );
}

//
//
//

function menuUpdateUndo(btnId) {
    //btn
    _updateEnabled(btnId, undoMan.stateIndex > 0);
    //lbl
    let changeName = undoMan.getStateLabel();
    _updateLabel(btnId, `Undo ${changeName}`);
}
function menuUpdateRedo(btnId) {
    //btn
    _updateEnabled(btnId, undoMan.stateIndex < undoMan.stateCount - 1);
    //lbl
    let changeName = undoMan.getStateLabel(1);
    _updateLabel(btnId, `Redo ${changeName}`);
}
