"use strict";

const menuBarData = {
    title: "Room Plan 3D",
    file: {
        title: "File",
        "Import File": "actionImportFurniture();",
        "Export Furniture": "actionExportFurniture();",
    },
    edit: {
        title: "Edit",
        "Duplicate Objects": "actionObjectsDuplicate();",
        "Delete Objects": "actionObjectsDelete();",
        "Group Objects": "actionObjectsGroup();",
    },
    view: {
        title: "View",
        "Object Edit Panel": "actionTogglePanelEditObject();",
        "Face Edit Panel": "actionTogglePanelEditFace();",
    },
};

let menuIds = [];

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
    menuBar.innerHTML = texts.join("&nbsp;");
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
        onclick="
            handleButtonClick(this, '${menuId}');
        "
        >
            ${menuName}
        </button>`;
    //menu panel
    let menuarr = [];
    menuarr.push(`<div id="${menuId}" class="menuPanel" hidden=true>`);
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
    let menu = $(menuId);
    let hidden = menu.hidden;
    dismissMenuAll();
    menu.hidden = !hidden;
    if (!menu.hidden) {
        alignMenu(btn, menu);
    }
}

function alignMenu(btn, menu) {
    let left = btn.offsetLeft;
    menu.style.left = left + 'px';
}

function dismissMenuAll() {
    menuIds.forEach(id => dismissMenu(id));
}

function dismissMenu(menu) {
    if (isString(menu)) {
        menu = $(menu);
    }
    menu.hidden = true;
}
