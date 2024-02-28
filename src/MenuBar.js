"use strict";

const menuBarData = {
    title: "Room Plan 3D",
    file: {
        title: "File",
        "Import File": "alert('import file');",
        export: "actionExportFurniture();",
    },
};

function constructMenuBar(id, idPanels, data) {
    let menuBar = $(id);
    let menuBarPanels = $(idPanels);
    let text = "";
    let textPanels = "";
    if (data.title) {
        let title = data.title;
        console.log("title", title);
        text += title + "&nbsp;";
    }
    //2024-02-27: copied from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries
    for (const [key, value] of Object.entries(data)) {
        if (key == "title") { continue; }
        let [button, menu] = constructMenuPanel(value, key);
        text += button + "&nbsp;";
        textPanels += menu;
    }
    //
    menuBar.innerHTML = text;
    menuBarPanels.innerHTML = textPanels;
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
        onclick="$('${menuId}').hidden = !$('${menuId}').hidden;"
        >
            ${menuName}
        </button>`;
    //menu panel
    let menu = `<div id="${menuId}" class="menuPanel" hidden=true>`;
    for (const [key, value] of Object.entries(data)) {
        if (key == "title") { continue; }
        //
        menu += `<button class="lineButton"
            onclick="${value}"
            >
            ${key}
            </button>
            <br>`;
    }
    menu += `</div>`;
    //return
    return [button, menu];
}

constructMenuBar("divMenuBar", "divMenuPanels", menuBarData);
