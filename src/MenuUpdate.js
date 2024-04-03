"use strict";

function menuUpdateObjectsDuplicate(btnId) {
    let btn = $(btnId);
    let enabled = uiVars.selector.count > 0;
    btn.disabled = !enabled;
}
