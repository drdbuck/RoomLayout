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
        "Import File": "actionImportBox();",
        "Export": "---",
        "Export Furniture": {
            action: "actionExportFurniture();",
            listen: ["select"],
            update: "menuUpdateSelectMinimum(_);",
        },
        "Export Room": "actionExportRoom();",
    },
    select: {
        title: "Select",
        "Select All %a": "actionSelectAll();",
        "Select None _escape": "actionSelectNone();",
        "Select Furnitures #a": {
            action: "actionSelectGroups();",
            listen: ["select", "group"],
            update: "menuUpdateBoxSelected(_);",
        },
        "Select Components &a": {
            action: "actionSelectPieces();",
            listen: ["select", "group"],
            update: "menuUpdateGroupSelected(_);",
        },
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
            update: "menuUpdateSelectMinimum(_);",
        },
        // "Ungroup Objects %#g": {
        //     action: "actionObjectsUngroup();",
        //     listen: ["select", "group"],
        //     update: "menuUpdateGroupSelected(_);",
        // },
        "Group": "---",
        "Recenter Pivot Point": {
            action: "actionObjectsRecenter();",
            listen: ["select", "group"],
            update: "menuUpdateGroupSelected(_);",
        },
    },
    create: {
        title: "Create",
        "Component": "---",
        "Create Box %b": {
            action: "actionObjectCreateBlank();",
            listen: ["select"],
            update: "menuUpdateGroupSelected(_);",
        },
        "Create Rectangle %#b": {
            action: "actionObjectCreateBlankFlatWall();",
            listen: ["select"],
            update: "menuUpdateGroupSelected(_);",
        },
        "Create Floor Rectangle %&b": {
            action: "actionObjectCreateBlankFlatFloor();",
            listen: ["select"],
            update: "menuUpdateGroupSelected(_);",
        },
        "Prefab": "---",
        "Create Skirt Prefab #b": "actionObjectsCreateSkirt();",
    },
    view: {
        title: "View",
        "View": "---",
        "Overhead View": "actionViewOverhead();",
        "Immersive View": "actionViewImmersive();",
        "Panels": "---",
        "Furniture Edit Panel": "actionTogglePanelEditObject();",
        "Box Edit Panel": "actionTogglePanelEditBox();",
        "Room Edit Panel": "actionTogglePanelEditRoom();",
        "Face View Panel": {
            action: "actionTogglePanelFaceView();",
            listen: ["select"],
            update: "menuUpdateSelectMinimum(_);",
        },
        "Face Edit Panel": {
            action: "actionTogglePanelFaceEdit();",
            listen: ["select"],
            update: "menuUpdateTogglePanelFaceEdit(_);",
        },
    },
};

let menuIds = [];

let menuBarState = {
    anyOpen: false,
};

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
        key.split(" ").forEach(seg => {
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
            }
            else {
                buttonNameSegs.push(seg);
            }
        });
        menuKeys.push(...keys);
        let keyString = keys.map(key =>
            `${(key.ctrl) ? "CTRL+" : ""}${(key.shift) ? "SHIFT+" : ""}${(key.alt) ? "ALT+" : ""}${key.key.toUpperCase()}`
        )
            .join(", ");
        let menubtnId = `btn${buttonNameSegs.join("")}`;
        if (listen && update) {
            update = update.replaceAll("_", `'${menubtnId}'`);
            listen = [listen].flat(Infinity);
            listen.forEach(l => {
                menuListeners[l] ??= [];
                menuListeners[l].push(update);
            });
        }
        //
        menuarr.push(`
            <button id="${menubtnId}" class="lineButton"
                onclick="${action}"
            >
                <span id="${menubtnId}_label" >${buttonNameSegs.join(" ")}</span>
                <span class="keyReminder">${keyString}</span>
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
