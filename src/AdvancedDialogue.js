"use strict";

const OPTION_TYPE_NUMBER = 0;
const OPTION_TYPE_NUMBER_POSITIVE = 1;
const OPTION_TYPE_NUMBER_POSITIVE_NONZERO = 2;
const OPTION_TYPE_STRING = 3;

class AdvancedDialogue {
    constructor(title, options, parent, okLabel, cleanFunc) {
        this.title = title;
        this.okLabel = okLabel;
        //TODO: make sure each option has a unique name
        this._options = options ??
            [
                "Option Group 1",
                {
                    name: "Name",
                    type: OPTION_TYPE_STRING,
                    default: "John Smith",
                },
                {
                    name: "Age",
                    type: OPTION_TYPE_NUMBER_POSITIVE,
                    default: 20,
                },
            ];
        
        this._cleanFunc = cleanFunc;

        this._parent = parent;

        const [text, panelId, optionIds] = this._generate();
        let wrapper = document.createElement("div");
        this._parent.appendChild(wrapper);
        wrapper.innerHTML = text;
        this._panel = $(panelId);
        this._panel.style.left = "400px";
        this._panel.style.top = "200px";
        this._controls = {};
        Object.entries(optionIds).forEach(([key, val]) => this._controls[key] = $(val));

        //make callback func
        this.callbackFunc = (answers) => { };
        const advdlg = this;
        this._panel.callbackFunc = () => {
            let answers = {};
            this.options
                .filter(o => advdlg._includeList.includes(o.name))
                .forEach(o =>
                );
                    answers[o.name] = advdlg._controls[o.name].value ?? o.default
            if (advdlg._cleanFunc) {
                advdlg._cleanFunc(answers);
            }
            advdlg.callbackFunc(answers);
        };

        this.visible = false;

    }

    _generate() {
        const panelId = `advdlg${this.title.replaceAll(" ","")}`;
        let lines = [];
        let optionIds = {};

        //div start
        lines.push(`<div id="${panelId}" class="popupPanel">`);

        //exit button
        lines.push(`<button id="btnExit${panelId}" class="exitButton" onclick="$('${panelId}').hidden=true;">X</button>`);

        //panel header
        lines.push(`<h1 id="h1${panelId}">${this.title}</h1>`);

        //options
        this._options.forEach(o => {
            if (o == undefined) {
                console.error("option must not be undefined!", this.title, o);
                return;
            }
            switch (true) {
                case isString(o):
                    lines.push(`<h2>${o}</h2>`);
                    break;
                case isObject(o):
                    const name = o.name;
                    const fieldId = `input${panelId}${name}`;
                    const labelId = `lbl${fieldId}`;
                    const defaultVal = o.default ?? "";
                    lines.push(`
                        <label id="${labelId}" for="${fieldId}">${name}</label>
                        <input type="text" id="${fieldId}" title="${name}" placeholder="${name}" default="${defaultVal}"/>
                    `);
                    optionIds[name] = fieldId;
                    //TODO: allow different inputs for different types
                    // switch (o.type) {
                    //     case OPTION_TYPE_STRING:
                    //         break;
                    // }
                    break;
                default:
                    console.error("unsupported option type", o);
                    break;
            }
        });

        //ok button
        lines.push(
            `<button id="btnOK${panelId}" class="lineButton" onclick="
                $('${panelId}').callbackFunc();
                $('${panelId}').hidden=true;
            ">${this.okLabel ?? "OK"}</button>`
        );

        //cancel button
        
        lines.push(`<button id="btnCancel${panelId}" class="lineButton" onclick="$('${panelId}').hidden=true;">${"Cancel"}</button>`);
        //div end
        lines.push(`</div>`);

        //compile it together
        let text = lines.join("");
        return [text, panelId, optionIds];
    }

    get visible() {
        return !this._panel.hidden;
    }
    set visible(value) {
        this._panel.hidden = !value;
    }

    show(callbackFunc, includeList, title = this.title) {
        //
        this.callbackFunc = callbackFunc;
        //
        $(`h1${this._panel.id}`).innerHTML = title;
        //
        this.reset();
        //
        const options = this.options;
        includeList ??= options.map(o => o.name);
        this._includeList = includeList;
        //
        options.forEach(o => {
            let input = this._controls[o.name];
            let shown = includeList.includes(o.name);
            let showStyle = (shown) ? "block" : "none";
            input.disabled = !shown;
            input.style.display = showStyle;
            let label = $(`lbl${input.id}`);
            label.style.display = showStyle;
        });
        this._controls[includeList[0]].focus();
        //
        this.visible = true;
        //
    }

    reset() {
        this.options.forEach(o => {
            let input = this._controls[o.name];
            input.value = o.default ?? "";
        });
    }

    get options() {
        return this._options
            .filter(o => isObject(o));
    }

}