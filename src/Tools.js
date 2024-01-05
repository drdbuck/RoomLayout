"use strict";

//
//
//TOOL: List Tools
console.warn("To see the list of tools, call listTools()");
function listTools() {
    //Performance Analysis
    printTool(
        "Type this to get performance data on paint routine: " +
        "performance.analyze(\"world repaint\");"
    );
    printTool(
        "To clear data on paint routine: " +
        "performance.clear();"
    );
    //Draw Note Index
    printTool(
        "To show index of each note: " +
        "showNoteIndex(); " +
        "then use _note(index) to view a particular note"
    );
    //Debug Display
    printTool(
        "To show a variable in the debug display, in your code, call:\n" +
        "debugDisplay(0, msg); "
    );
    //Access Standard Library
    printTool(
        "To access standard library: " +
        "accessStandardLibrary();"
    );
    //Deep Diff Mapper
    printTool(
        "To use the deep diff mapper, " +
        "call deepDiff() on two objects separately"
    );
    printTool(
        "Alternatively, you can use deepDiffMapper.map()"
    );
    //Print Constants
    printTool("To see constants: printConstants();");
    //Normalize Empty Columns
    printTool("Too many empty columns? Use: normalizeEmptyColumns(3);");
    //Local Storage Download / Upload
    printTool("Use 'exportLocalStorage();' to download the local storage. " +
        "It uses what is currently in the application, not necessarily what is currently in the local storage.");
    printTool("Use 'importLocalStorage();' to upload a local storage file. " +
        "It sets what is currently in the application, and does not necessarily set the local storage contents.");

}
function printTool(toolText) {
    console.log("===================");
    console.log(toolText);
}
//
//

//TOOL: Performance Analysis
performance.analyze = function (testName) {
    let entries;
    if (testName) {
        entries = performance.getEntriesByName(testName);
    }
    else {
        entries = performance.getEntriesByType("measure");
    }
    if (entries.length === 0) {
        console.log("No data to analyze for test: " + testName);
        return;
    }
    let min = entries[0].duration;
    let max = entries[0].duration;
    let sum = 0;
    for (let i = 1; i < entries.length; i++) {
        let duration = entries[i].duration;
        min = Math.min(min, duration);
        max = Math.max(max, duration);
        sum += duration;
    }
    let average = sum / entries.length;
    //Output
    min = Math.cut(min, 1);
    max = Math.cut(max, 1);
    average = Math.cut(average, 1);
    if (testName === undefined) {
        testName = entries[0].name;
    }
    console.log(testName + ":",
        " min:", min,
        " max:", max,
        " avg:", average,
        " cnt:", entries.length
    );
}
performance.clear = function () {
    performance.clearMeasures("world repaint");
}

//TOOL: Show Note Index
function showNoteIndex(show = true) {
    tms.display.showNoteIndex = show;
    camera.update();
}
function _note(index) {
    index ??= focus.index;
    return focus.seq.notes[index]?.[focus.staffIdx];
}

//TOOL: Debug Display
let debugDisplayList = [];
let debugURLParamWarningGiven = false;
//used for displaying debug info on screen
function debugDisplay(debugIdx, debugMsg) {
    if (!urlParams.debug) {
        //give a warning
        if (!debugURLParamWarningGiven) {
            console.warn("Debug Display cannot be shown without the urlParam 'debug'!");
            console.warn(
                "Put the 'debug' url parameter in the URL or call ",
                "debugEnable()",
                " to enable debugging for this session."
            );
            debugURLParamWarningGiven = true;
        }
        //return
        return;
    }
    const divDebug = $("divDebug");
    //allow for single parameter: string
    if (!debugMsg) {
        //close debug display
        if (debugIdx == undefined) {
            divDebug.hidden = true;
            debugDisplayList = [];
            return;
        }
        //allow for single parameter: string
        debugMsg = debugIdx;
        if (isString(debugIdx)) {
            debugIdx = 0;
        }
    }
    //add message to list
    debugDisplayList[debugIdx] = debugMsg;
    //update div    
    divDebug.hidden = false;
    divDebug.innerHTML = debugDisplayList
        .map((msg, i) => `${i}: ${msg}`)
        .filter(msg => msg?.split(" ")[1].length > 0)
        .join("<br>");
}
function debugEnable(enable = true) {
    urlParams.debug = enable;
    console.log(`Debug ${(urlParams.debug) ? "enabled" : "disabled"}!`);
    debugURLParamWarningGiven = false;
}

//TOOL: Access Standard Library
function accessStandardLibrary() {
    tms.sequenceList.includeStandardLibraryInList = true;
    showSequenceList();
}

//TOOL: Deep Diff Mapper
//2020-06-13: copied from https://stackoverflow.com/a/8596559/2336212
function deepDiff(obj, stringify) {
    //Store first object
    if (!deepDiffMapper.obj1) {
        deepDiffMapper.store(obj, stringify);
        console.log("deepDiff: obj 1 stored!");
        return;
    }
    //Store second object and compare
    else {
        deepDiffMapper.store(obj, stringify);
        console.log("deepDiff: obj 2 stored!");
        console.log("deepDiff: comparing the two objects:");
        return deepDiffMapper.compare();
    }
}
var deepDiffMapper = function () {
    return {
        obj1: undefined,
        obj2: undefined,
        VALUE_CREATED: 'created',
        VALUE_UPDATED: 'updated',
        VALUE_DELETED: 'deleted',
        VALUE_UNCHANGED: '---',
        map: function (obj1, obj2) {
            if (this.isFunction(obj1) || this.isFunction(obj2)) {
                throw 'Invalid argument. Function given, object expected.';
            }
            if (this.isValue(obj1) || this.isValue(obj2)) {
                let returnObj = {
                    _: `${obj1} -> ${obj2}`,
                    v1: obj1,
                    v2: obj2,
                    type: this.compareValues(obj1, obj2),
                };
                switch (returnObj.type) {
                    case this.VALUE_CREATED:
                        returnObj._ = `+++++`;
                        delete returnObj.v1;
                        break;
                    case this.VALUE_UPDATED:
                        returnObj._ = `${obj1} -> ${obj2}`;
                        break;
                    case this.VALUE_DELETED:
                        returnObj._ = `-----`;
                        delete returnObj.v2;
                        break;
                }
                if (returnObj.type !== this.VALUE_UNCHANGED) {
                    return returnObj;
                }
                return undefined;
            }

            var diff = {};
            let foundKeys = {};
            for (var key in obj1) {
                if (this.isFunction(obj1[key])) {
                    continue;
                }

                var value2 = undefined;
                if (obj2[key] !== undefined) {
                    value2 = obj2[key];
                }

                let mapValue = this.map(obj1[key], value2);
                foundKeys[key] = true;
                if (mapValue) {
                    diff[key] = mapValue;
                }
            }
            for (var key in obj2) {
                if (this.isFunction(obj2[key]) || foundKeys[key] !== undefined) {
                    continue;
                }

                let mapValue = this.map(undefined, obj2[key]);
                if (mapValue) {
                    diff[key] = mapValue;
                }
            }

            //2020-06-13: object length code copied from https://stackoverflow.com/a/13190981/2336212
            if (Object.keys(diff).length > 0) {
                return diff;
            }
            return undefined;
        },
        compareValues: function (value1, value2) {
            if (value1 === value2) {
                return this.VALUE_UNCHANGED;
            }
            if (this.isDate(value1) && this.isDate(value2) && value1.getTime() === value2.getTime()) {
                return this.VALUE_UNCHANGED;
            }
            if (value1 === undefined) {
                return this.VALUE_CREATED;
            }
            if (value2 === undefined) {
                return this.VALUE_DELETED;
            }
            return this.VALUE_UPDATED;
        },
        isFunction: function (x) {
            return Object.prototype.toString.call(x) === '[object Function]';
        },
        isArray: function (x) {
            return Object.prototype.toString.call(x) === '[object Array]';
        },
        isDate: function (x) {
            return Object.prototype.toString.call(x) === '[object Date]';
        },
        isObject: function (x) {
            return Object.prototype.toString.call(x) === '[object Object]';
        },
        isValue: function (x) {
            return !this.isObject(x) && !this.isArray(x);
        },
        store: function (obj, stringify) {
            if (this.obj1 && this.obj2) {
                console.warn("Both values are set. Call deepDiffMapper.compare()");
                return;
            }
            //Defaults
            obj ??= {};
            //Copy object
            let copy = JSON.parse(JSON.stringify(obj, stringify));
            //Store the copy
            if (!this.obj1) {
                this.obj1 = copy;
            }
            else if (!this.obj2) {
                this.obj2 = copy;
            }
        },
        compare: function (obj1, obj2) {
            obj1 ??= this.obj1;
            obj2 ??= this.obj2;
            this.obj1 = undefined;
            this.obj2 = undefined;
            return this.map(obj1, obj2);
        },
    }
}();

//TOOL: Print Constants
var constantDict = undefined;
function _initConstantDict() {
    let _addConstant = (constant, name) => {
        let item = constantDict[constant];
        //Add solo item
        if (!item) {
            constantDict[constant] = name;
        }
        //Add item to list
        else {
            if (!Array.isArray(item)) {
                item = [item];
                constantDict[constant] = item;
            }
            item.push(name);
        }
    }
    constantDict = {};

    ////////////// Add all known enums ///////////
    let _addEnumConstants = (enumParam) => {
        let enumName = enumParam.enumName;
        let enums = enumParam.getEnums();
        for (let i = 0; i < enums.length; i++) {
            let enumKey = enums[i];
            _addConstant(enumParam[enumKey], `${enumName}.${enumKey}`);
        }
    }
    knownEnums.forEach(_addEnumConstants);

    ////////////// Unified show column selection constants ///////////
    _addConstant(ShowPrev, "ShowPrev");
    _addConstant(ShowSeqToPrevPrev, "ShowSeqToPrevPrev");
    _addConstant(ShowSeqToPrev, "ShowSeqToPrev");
    _addConstant(ShowSeqToAns, "ShowSeqToAns");
    _addConstant(ShowAll, "ShowAll");

    ////////////// playNotes symbolic constants ///////////
    _addConstant(PlayNotesNever, "PlayNotesNever");
    _addConstant(PlayPrevCurrentInterval, "PlayPrevCurrentInterval");
    _addConstant(PlayPrevNote, "PlayPrevNote");
    _addConstant(PlayPrevPrevNoteToEnd, "PlayPrevPrevNoteToEnd");
    _addConstant(PlayPrevNoteToEnd, "PlayPrevNoteToEnd");
    _addConstant(PlayCurrentNote, "PlayCurrentNote");
    _addConstant(PlayCurrentNoteToEnd, "PlayCurrentNoteToEnd");
    _addConstant(PlayCurrentNoteToBeat, "PlayCurrentNoteToBeat");

    ////////////// playNotes symbolic constants ///////////
    _addConstant(PlayTriadNever, "PlayTriadNever");
    _addConstant(PlayInitialTriad, "PlayInitialTriad");
    _addConstant(PlayTriadAlways, "PlayTriadAlways");

    ////////////// syllable player note type constants ///////////
    _addConstant(NOTE_LESSON, "NOTE_LESSON");
    _addConstant(NOTE_STAFF, "NOTE_STAFF");
    _addConstant(NOTE_MIDI, "NOTE_MIDI");
    _addConstant(NOTE_FREQ, "NOTE_FREQ");

    ////////////// clef symbolic constants ///////////
    _addConstant(TrebleClef, "TrebleClef");
    _addConstant(TenorClef, "TenorClef");
    _addConstant(BassClef, "BassClef");

    ////////////// displayX symbolic constants ///////////
    _addConstant(DisplayXNever, "DisplayXNever");
    _addConstant(DisplayXAfterFirst, "DisplayXAfterFirst");
    _addConstant(DisplayXAlways, "DisplayXAlways");
    _addConstant(DisplayXUntilFirstCorrect, "DisplayXUntilFirstCorrect");
}
function getConstantString(constant) {
    if (!constantDict) {
        _initConstantDict();
    }
    return constantDict[constant];
}
//Prints the known constants so you can look up a number's constant name
function printConstants(...constants) {
    if (!constantDict) {
        _initConstantDict();
    }
    if (constants?.length > 0) {
        for (let constant of constants) {
            let item = constantDict[constant];
            if (Array.isArray(item)) {
                for (let str of item) {
                    console.log(`${constant}: ${str}`);
                }
            }
            else {
                console.log(`${constant}: ${item}`);
            }
        }
    }
    else {
        console.log(constantDict);
    }
}

//TOOL: Normalize Empty Columns
function normalizeEmptyColumns(emptyColumnCount) {
    let seq = focus.seq;
    seq.autoformatSequence(emptyColumnCount);
    camera.update();
}

//TOOL: Variable Change Tracker
//Use printBeforeAfter() to find out when a value is changed
//call it both before the change and after the change,
//and it will print the before and after, plus call stack
//EX:
// printBeforeAfter(this.fifths, "fifths");
// this.fifths = 5;
// printBeforeAfter(this.fifths, "fifths");
let beforeValue = [];
function printBeforeAfter(curValue, name, onlyPrintIfDifferent = true) {
    name ??= "beforeAfterValue";
    if (!(name in beforeValue)) {
        beforeValue[name] = curValue;
        return;
    }
    else {
        if (!onlyPrintIfDifferent || !(beforeValue[name] === curValue)) {
            //this isn't actually an error,
            //it just calls console.error() to get the stack trace
            console.error(name + ": ", beforeValue[name], "->", curValue);
        }
        delete beforeValue[name];
        return;
    }
}

/**
 * Calls printBeforeAfter, but converts the curValue to a constant's name first
 * @param {int} curValue The number id of a constant
 * @param {string} name The name of the variable being tracked
 * @param {bool} onlyPrintIfDifferent True to hide comparisons where nothing changed
 */
function printBeforeAfterConstant(curValue, name, onlyPrintIfDifferent) {
    let constantName = getConstantString(curValue);
    printBeforeAfter(constantName, name, onlyPrintIfDifferent);
}

/**
 * Calls printBeforeAfter, but converts the curValue to a JSON string
 * @param {object} curValue The object to convert to a JSON string
 * @param {string} name The name of the variable being tracked
 * @param {bool} onlyPrintIfDifferent True to hide comparisons where nothing changed
 */
function printBeforeAfterJSON(curValue, name, onlyPrintIfDifferent) {
    let json = JSON.stringify(curValue);
    printBeforeAfter(json, name, onlyPrintIfDifferent);
}
