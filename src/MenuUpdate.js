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
}
function menuUpdateRedo(btnId) {
    let btn = $(btnId);
    let enabled = undoMan.stateIndex < undoMan.stateCount - 1;
    btn.disabled = !enabled;
}

function menuUpdateObjectsUngroup(btnId) {
    let minEnabled = menuUpdateSelectMinimum(btnId);
    let btn = $(btnId);
    let enabled = minEnabled && uiVars.selector.some(c => c.kitbash || c.obj.isKitBash);
    btn.disabled = !enabled;
}
