"use strict";

function menuUpdateObjectsDuplicate(btnId) {
    let btn = $(btnId);
    let enabled = uiVars.selector.count > 0;
    btn.disabled = !enabled;
}

function menuUpdateObjectsDelete(btnId) {
    let btn = $(btnId);
    let enabled = uiVars.selector.count > 0;
    btn.disabled = !enabled;
}

function menuUpdateObjectsGroup(btnId) {
    let btn = $(btnId);
    let enabled = uiVars.selector.count > 1;
    btn.disabled = !enabled;
}
