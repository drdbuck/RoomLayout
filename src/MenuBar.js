"use strict";

const menuBarData = {
    title: "Room Plan 3D",
    file: {
        title: "File",
        "Import File": "actionImportFurniture();",
        "Export Furniture": "actionExportFurniture();",
        "Export Room": "actionExportRoom();",
    },
    edit: {
        title: "Edit",
        "Undo": "actionUndo();",
        "Redo": "actionRedo();",
        "Create Blank": "actionObjectCreateBlank();",
        "Duplicate Objects": "actionObjectsDuplicate();",
        "Delete Objects": "actionObjectsDelete();",
        "Group Objects": "actionObjectsGroup();",
    },
    view: {
        title: "View",
        "Room Edit Panel": "actionTogglePanelEditRoom();",
        "Object Edit Panel": "actionTogglePanelEditObject();",
        "Face Edit Panel": "actionTogglePanelEditFace();",
    },
};

let menuIds = [];

let menuBarState = {
    anyOpen: false,
}

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
        if (key == "title") { continue; }
        //
        menuarr.push(`<button class="lineButton"
            onclick="${value}"
            >
            ${key}
            </button>
            <br>`);
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
