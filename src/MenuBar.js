"use strict";

const menuBarData = {
    title: "Room Plan 3D",
    file: {
        title: "File",
        "Import File": "alert('import file');",
        export: "actionExportFurniture();",
    },
};

function constructMenuBar(id, data) {
    let menuBar = $(id);
    let text = "";
    if (data.title) {
        let title = data.title;
        console.log("title", title);
        text += title + "&nbsp;";
    }
    //2024-02-27: copied from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries
    for (const [key, value] of Object.entries(data)) {
        if (key == "title") { continue; }
        let menu = constructMenuPanel(value, key);
        text += menu + "&nbsp;";
    }
    //
    menuBar.innerHTML = text;
}

function constructMenuPanel(data, keyName) {
    let text = "";
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
    text += button;
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
    // menu.splice(-4, 4);//remove trailing new line
    menu += `</div>`;
    text += menu;
    return text;
}

constructMenuBar("divMenuBar", menuBarData);
