"use strict";

//keyboard shortcuts: % ctrl, # shift, & alt, _ no modifiers
//examples: %z (ctrl-z), %#f (ctrl-shift-f), &p (alt-p), _b (b)
const keyTest = /([%#&]+|_)[a-z0-9]+/;
const menuKeys = [];

const menuBarData = {
    title: APP_NAME,
    file: {
        title: "File",
        "Import": "---",
        "Import File": "actionImportFurniture();",
        "Export": "---",
        "Export Furniture": {
            action: "actionExportFurniture();",
            listen: ["select"],
            update: "menuUpdateSelectMinimum(_);",
        },
        "Export Room": "actionExportRoom();",
    },
    edit: {
        title: "Edit",
        "Undo": "---",
        "Undo %z": {
            action: "actionUndo();",
            listen: ["undo"],
            update: "menuUpdateUndo(_);",
        },
        "Redo %y": {
            action: "actionRedo();",
            listen: ["undo"],
            update: "menuUpdateRedo(_);",
        },
        "Edit": "---",
        "Create Blank %b": "actionObjectCreateBlank();",
        "Duplicate Objects %d": {
            action: "actionObjectsDuplicate();",
            listen: ["select"],
            update: "menuUpdateSelectMinimum(_);",
        },
        "Delete Objects _delete": {
            action: "actionObjectsDelete();",
            listen: ["select"],
            update: "menuUpdateSelectMinimum(_);",
        },
        "Group Objects %g": {
            action: "actionObjectsGroup();",
            listen: ["select"],
            update: "menuUpdateSelectMinimum(_, 2);",
        },
    },
    view: {
        title: "View",
        "View": "---",
        "Overhead View": "actionViewOverhead();",
        "Immersive View": "actionViewImmersive();",
        "Panels": "---",
        "Furniture Edit Panel": "actionTogglePanelEditObject();",
        "Room Edit Panel": "actionTogglePanelEditRoom();",
        "Face View Panel": "actionTogglePanelFaceView();",
        "Face Edit Panel": "actionTogglePanelFaceEdit();",
    },
};

let menuIds = [];

let menuBarState = {
    anyOpen: false,
}

let menuListeners = {};//{"select": ["menuUpdateObjectsDuplicate();"]}

function constructMenuBar(id, idPanels, data) {
    let menuBar = $(id);
    let menuBarPanels = $(idPanels);
    let texts = [];
    let textsPanels = [];
    if (data.title) {
        let title = data.title;
        console.log("title", title);
        texts.push(title + "&nbsp;");
    }
    //2024-02-27: copied from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries
    for (const [key, value] of Object.entries(data)) {
        if (key == "title") { continue; }
        let [button, menu, btnId, menuId] = constructMenuPanel(value, key);
        texts.push(button);
        textsPanels.push(menu);
        // btnIds.push(btnId);
        menuIds.push(menuId);
    }
    //
    menuBar.innerHTML = texts.join("");
    menuBarPanels.innerHTML = textsPanels.join("");
}

function constructMenuPanel(data, keyName) {
    let menuName = data.title ?? keyName;
    if (!menuName) {
        console.error("no menu name found for menu data!", data, menuName);
        return;
    }
    let btnId = `btn${menuName}`;
    let menuId = `div${menuName}`;
    //button
    let button = `<button id="${btnId}"
        onclick="handleButtonClick(this, '${menuId}');"
        onmouseover="handleMouseOver(this, '${menuId}');"
        onmouseleave="handleMouseLeave('${btnId}', '${menuId}', event);"
        >
            ${menuName}
        </button>`;
    //menu panel
    let menuarr = [];
    menuarr.push(`<div id="${menuId}" class="menuPanel" hidden=true
        onmouseleave="handleMouseLeave('${btnId}', '${menuId}', event);"
        >`);
    for (const [key, value] of Object.entries(data)) {
        //early exit: title
        if (key == "title") { continue; }

        //line break
        if (/^\-+$/.test(value)) {//"---"
            menuarr.push(`
                <div class="linebreak">
                    ${key}
                </div>
            `);
            continue;
        }

        //button
        let action = value;
        let listen;
        let update;
        if (!isString(action)) {
            //assume obj
            listen = action.listen;
            update = action.update;
            action = action.action;
        }
        action = action.trim();
        let keys = [];
        let buttonNameSegs = [];
        let buttonLabel = key.split(" ")
            .map(seg => {
                if (keyTest.test(seg)) {
                    let key = {
                        ctrl: seg.includes("%"),
                        shift: seg.includes("#"),
                        alt: seg.includes("&"),
                        keyOnly: seg.includes("_"),
                        key: seg.match(/[a-z0-9]+/)[0],
                        action: action,
                    };
                    keys.push(key);
                    menuKeys.push(key);
                    return "";
                }
                buttonNameSegs.push(seg);
                return seg;
            })
            .filter(seg => seg)
            .concat(keys.map(key =>
                `<span class="keyReminder">
                    ${(key.ctrl) ? "CTRL+" : ""}${(key.shift) ? "SHIFT+" : ""}${(key.alt) ? "ALT+" : ""}${key.key.toUpperCase()}
                </span>`
            ))
            .join(" ");
        let buttonName = buttonNameSegs.join("");
        let menubtnId = `btn${buttonName}`;
        if (listen && update) {
            update = update.replaceAll("_", `'${menubtnId}'`);
            menuListeners[listen] ??= [];
            menuListeners[listen].push(update);
        }
        //
        menuarr.push(`<button id="${menubtnId}" class="lineButton"
            onclick="${action}"
            >
            ${buttonLabel}
            </button>
            `);
    }
    menuarr.push(`</div>`);
    //return
    return [button, menuarr.join(""), btnId, menuId];
}

function handleButtonClick(btn, menuId) {
    showMenuSingle(btn, menuId);
}

function handleMouseOver(btn, menuId) {
    if (menuBarData.anyOpen) {
        showMenuSingle(btn, menuId, true);
    }
}

function handleMouseLeave(btnId, menuId, event) {
    const allowedIds = [btnId, menuId, "divMenuBar", "divMenuPanels"];
    if (!allowedIds.includes(event.toElement?.id)
        && !allowedIds.includes(event.toElement?.parentElement?.id)
    ) {
        dismissMenu(menuId);
        menuBarData.anyOpen = false;
    }
}

function showMenuSingle(btn, menuId, show) {
    let menu = $(menuId);
    show ??= menu.hidden;//default: toggle
    dismissMenuAll();
    menu.hidden = !show;
    if (show) {
        alignMenu(btn, menu);
        menuBarData.anyOpen = true;
    }
}

function alignMenu(btn, menu) {
    let left = btn.offsetLeft;
    menu.style.left = left + 'px';
}

function dismissMenuAll() {
    menuIds.forEach(id => dismissMenu(id));
    menuBarData.anyOpen = false;
}

function dismissMenu(menu) {
    if (isString(menu)) {
        menu = $(menu);
    }
    menu.hidden = true;
}
