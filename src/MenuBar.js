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
        "Group Objects": "actionGroupObjects();",
    },
    view: {
        title: "View",
        "Object Edit Panel": "actionTogglePanelEditObject();",
        "Face Edit Panel": "actionTogglePanelEditFace();",
    },
};

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
        let [button, menu] = constructMenuPanel(value, key);
        texts.push(button);
        textsPanels.push(menu);
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
            let menu = $('${menuId}');
            menu.hidden = !menu.hidden;
            alignMenu(this, menu);
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
    return [button, menuarr.join("")];
}

function alignMenu(btn, menu) {
    let left = btn.offsetLeft;
    menu.style.left = left + 'px';
}

constructMenuBar("divMenuBar", "divMenuPanels", menuBarData);
