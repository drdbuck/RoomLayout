"use strict";

function menuUpdateSelectMinimum(btnId, min = 1) {
    let btn = $(btnId);
    let enabled = uiVars.selector.count >= min;
    btn.disabled = !enabled;
}
