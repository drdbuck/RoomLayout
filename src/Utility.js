"use strict";

// This file is for general purpose functions
// Functions in this file:
//   (a) must be usable in any part of the system
//   (b) cannot know anything about our system
//   (c) must be copy+pastable into other projects with 0 changes and still work
// If a function does not satisfy all three of these conditions,
// it does NOT belong in this file!


//Returns true if the given string is null, undefined, empty string, or only white space
function isEmpty(str) {
    return !str || !str.trim();
}

function isString(s) { return s === "" + s; }

//2019-10-31: copied from https://stackoverflow.com/a/1421988/2336212
function isNumber(n) { return !isNaN(parseFloat(n)) && !isNaN(n - 0); }

//2023-02-27: constructed after consulting https://stackoverflow.com/q/14636536/2336212
function isInteger(n) { return isNumber(n) && Math.floor(n) === n; }

//2024-05-02: copied from https://stackoverflow.com/a/8511350/2336212
function isObject(o) { return typeof o === 'object' && !Array.isArray(o) && o !== null; }

//2024-06-06: copied from https://stackoverflow.com/a/19717946/2336212
function isFunction(f) { return f instanceof Function; }

function $(id) {
    return document.getElementById(id);
}

Math.clamp = function (value, min, max) {
    if (min > max) {
        console.error("Min should be less than or equal to max!",
            "min:", min,
            "max:", max
        );
    }
    return Math.max(
        min,
        Math.min(
            max,
            value
        )
    );
};

let between = function (value, min, max) {
    return (min <= value && value <= max);
};

//Cuts decimals off the given value so that only the given number of places remains
Math.cut = function (value, places = 0) {
    let factor = Math.pow(10, places);
    return Math.round(value * factor) / factor;
};

//2024-01-30: copied from https://stackoverflow.com/a/9705160/2336212
function toDegrees(angle) {
    return angle * (180 / Math.PI);
}
//2024-01-30: copied from https://stackoverflow.com/a/9705160/2336212
function toRadians(angle) {
    return angle * (Math.PI / 180);
}

function loopAngle(angle) {
    angle *= 1;//force number
    return (angle + 360 * Math.ceil(Math.abs(angle / 360))) % 360;
}

function loop(n, min, max) {
    const diff = max - min;
    return (n + diff * Math.ceil(Math.abs(n / diff))) % diff + min;
}

function getDisplayDate(date) {
    date ??= new Date();
    // MM/DD HH:MM
    return `${date.getMonth() + 1}/${date.getDate()}`
        + " "
        + `${date.getHours()}:${('' + date.getMinutes()).padStart(2, '0')}`;
}

function getDisplayDateToolTip(date) {
    date ??= new Date();
    // MM/DD/YYYY HH:MM
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
        + " "
        + `${date.getHours()}:${('' + date.getMinutes()).padStart(2, '0')}`;
}

//2022-07-19: copied from https://stackoverflow.com/a/19494146/2336212
Array.prototype.equals = function (array) {
    return this === array ||
        this.length === array.length &&
        this.every((item, i) => item === array[i]);
};

Array.prototype.min = function (minFunc = (val) => val) {
    if (!(this.length > 0)) { return 0; }
    return this.reduce(
        (acc, cur) => Math.min(minFunc(cur), acc),
        minFunc(this[0])
    );
};
Array.prototype.max = function (maxFunc = (val) => val) {
    if (!(this.length > 0)) { return 0; }
    return this.reduce(
        (acc, cur) => Math.max(maxFunc(cur), acc),
        maxFunc(this[0])
    );
};

Array.prototype.sum = function (sumFunc = (val) => val) {
    if (!(this.length > 0)) { return 0; }
    return this.reduce(
        (acc, cur) => sumFunc(cur) + acc,
        0
    );
};

Array.prototype.remove = function (value) {
    let index = this.indexOf(value);
    if (index >= 0) {
        this.splice(index, 1);
        return true;
    }
    return false;
};

/**
 * Returns a new array with the duplicates removed
 */
Array.prototype.removeDuplicates = function () {
    let arr = [];
    this.forEach(n => {
        if (!arr.includes(n)) {
            arr.push(n);
        }
    });
    return arr;
};

/**
 * Returns a random number between min and max, inclusive
 * */
function randomRange(min, max) {
    if (min > max) {
        console.error("Min should be less than or equal to max!",
            "min:", min,
            "max:", max
        );
    }
    return (Math.random() * (max - min)) + min;
}

/**
 * Returns a random item from the given array
 * */
function randomItem(array) {
    if (!Array.isArray(array)) {
        console.error("Value must be an array!", array);
    }
    let index = randomRange(0, array.length - 1);
    return array[index];
}

/**
 * Returns a random valid index in the given array
 * */
function randomIndex(array) {
    if (!Array.isArray(array)) {
        console.error("Value must be an array!", array);
    }
    let index = randomRange(0, array.length - 1);
    return index;
}

function createImage(name, url) {
    let image = new Image();
    image.name = name;
    image.src = url;
    return image;
}

const PIXEL_TRANSPARENT = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAANSURBVBhXY2BgYGAAAAAFAAGKM+MAAAAAAElFTkSuQmCC';
const PIXEL_WHITE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsIAAA7CARUoSoAAAAAMSURBVBhXY/j//z8ABf4C/qc1gYQAAAAASUVORK5CYII=';
const PIXEL_WHITE_10p = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsEAAA7BAbiRa+0AAAANSURBVBhXY/j//380AAlXA1npE5ZiAAAAAElFTkSuQmCC';
const LIST_PIXEL = [
    PIXEL_TRANSPARENT,
    PIXEL_WHITE,
    PIXEL_WHITE_10p,
];

function isValidImage(imageURL) {
    return imageURL && !LIST_PIXEL.includes(imageURL);
}

const tempCanvas = document.createElement("canvas");
const tempCTX = tempCanvas.getContext('2d', { willReadFrequently: true });

function getImageData(img) {
    //2024-01-25: copied from https://stackoverflow.com/a/8751659/2336212
    let canvas = tempCanvas;
    canvas.width = img.width;
    canvas.height = img.height;
    let ctx = tempCTX;
    ctx.drawImage(img, 0, 0, img.width, img.height);
    return ctx.getImageData(0, 0, img.width, img.height);
}

function imageHasTransparency(img, threshold = 254) {
    let data = getImageData(img).data;
    for (let i = 3; i < data.length; i += 4) {
        if (data[i] <= threshold) {
            return true;
        }
    }
    return false;
}

function flipImage(img, flipX, flipY) {
    let canvas = tempCanvas;
    canvas.width = img.width;
    canvas.height = img.height;
    let ctx = tempCTX;
    //2024-01-30: copied from https://stackoverflow.com/a/42856641/2336212
    ctx.save();  // save the current canvas state
    ctx.setTransform(
        (flipX) ? -1 : 1,
        0, // set the direction of x axis
        0,
        (flipY) ? -1 : 1,   // set the direction of y axis
        (flipX) ? img.width : 0, // set the x origin
        (flipY) ? img.height : 0   // set the y origin
    );
    ctx.drawImage(img, 0, 0);
    ctx.restore(); // restore the state as it was when this function was called
    //
    let newImage = new Image();
    newImage.src = canvas.toDataURL();
    return newImage;
}
function rotateImage(img, degrees) {
    if (!Math.abs(degrees) == 90) {
        console.error("degrees must be 90 or -90!", degrees);
        return img;
    }
    let canvas = tempCanvas;
    canvas.width = img.height;
    canvas.height = img.width;
    let ctx = tempCTX;
    //2024-01-30: copied from https://stackoverflow.com/a/42856641/2336212
    ctx.save();  // save the current canvas state
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(toRadians(degrees));
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore(); // restore the state as it was when this function was called
    //
    let newImage = new Image();
    newImage.src = canvas.toDataURL();
    return newImage;
}

function copy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function copyObject(obj, stringify, prototype) {
    let obj2 = JSON.parse(JSON.stringify(obj, stringify));
    if (prototype) {
        Object.setPrototypeOf(obj2, prototype);
    }
    return obj2;
}

function inflateObject(obj, prototype, delegates = []) {

    //Early exit
    if (!obj) {
        console.error("Cannot inflate null obj!", obj);
        return false;
    }

    //Prototype
    Object.setPrototypeOf(obj, prototype);

    //Delegates
    for (let key of delegates) {
        obj[key] = new Delegate();
    }

    return true;

}


function getMemorySize(json) {
    if (!json) return 0;
    if (!isString(json)) {
        json = JSON.stringify(json);
    }
    let size = json.length;
    return size;
}

/**
 * Gets the size display text for the given json string, or the given length
*/
function getMemorySizeText(json) {
    let length = (isNumber(json)) ? json : getMemorySize(json);
    let size = length * 2;
    if (size > 1000000) {
        size = Math.round(size / 100000) / 10;
        return size + " MB";
    }
    if (size > 1000) {
        size = Math.round(size / 1000);
        return size + " KB";
    }
    size = Math.round(size / 100) / 10;
    return size + " KB";
}

function validateIndexBounds(value, max, name) {
    name ??= "variable";
    let min = 0;
    if (value < min || max <= value) {
        console.error(`${name} is out of bounds [${min}, ${max - 1}]!:`, value);
        return false;
    }
    return true;
}

const unitConversionTable = {
    "feet": {
        "inches": 12,
    },
    "inches": {
        "feet": 1 / 12,
    }
};

function convertUnits(value, fromUnits, toUnits) {
    //handle vector input
    if (value.isVector3) {
        return new Vector3(
            convertUnits(value.x, fromUnits, toUnits),
            convertUnits(value.y, fromUnits, toUnits),
            convertUnits(value.z, fromUnits, toUnits),
        );
    }
    //
    if (value == 0) {
        return value;
    }
    if (fromUnits == toUnits) {
        return value;
    }
    let newValue = value * unitConversionTable[fromUnits][toUnits];
    if (!isNumber(newValue)) {
        console.error("unable to convert", value, "from", fromUnits, "to", toUnits);
        return value;
    }
    return newValue;
}

const REGEXP_FLOAT = new RegExp("-?(([0-9]+.?[0-9]*)|([0-9]*.?[0-9]+))", "g");
function regtest(value) {
    //log("regexp test", REGEXP_FLOAT.test(value));
    let parts = [];

    let matches = value.matchAll(REGEXP_FLOAT);
    for (let s of matches) {
        parts.push(s);
    }
    return parts.map(a => a[0]).join("");
    // return (REGEXP_FLOAT).test(txt);
}

function cleanInput(value, regexp = REGEXP_FLOAT) {
    //
    if (!isString(value)) {
        return value;
    }
    //
    let parts = [];
    let matches = value.matchAll(regexp);
    for (let s of matches) {
        parts.push(s);
    }
    return parts.map(a => a[0]).join("");
}

function parseNumber(txt, units) {
    if (!isString(txt)) {
        return txt;
    }
    return parseFootInchInput(txt, units) ?? parseFloatInput(txt);
}

function parseFloatInput(txt) {
    let f = parseFloat(txt);
    if (!isNumber(f)) {
        txt = cleanInput(txt, REGEXP_FLOAT);
        f = parseFloat(txt);
        if (!isNumber(f)) {
            return undefined;
        }
    }
    return f;
}

function parseFootInchInput(txt, units = UNITS_FEET) {
    //style: 6'2"
    let unitInches = ["''", "\""];
    let unitFeet = ["'"];
    let unitList = [...unitInches, ...unitFeet];
    let regexpstr = `(${REGEXP_FLOAT.source}(${unitList.join("|")})? *)+`;
    txt = cleanInput(txt, new RegExp(regexpstr, "g"));
    let split = txt.split(" ")
        .map(s => s?.trim())
        .filter(s => s);
    let f;
    split.forEach(str => {
        //inches
        if (str.endsWith("\"")) {
            str = str.substring(0, str.length - 1);
            f ??= 0;
            f += convertUnits(parseFloat(str), UNITS_INCHES, units);
            return;
        }
        if (str.endsWith("''")) {
            str = str.substring(0, str.length - 2);
            f ??= 0;
            f += convertUnits(parseFloat(str), UNITS_INCHES, units);
            return;
        }
        //feet
        if (str.endsWith("'")) {
            str = str.substring(0, str.length - 1);
            f ??= 0;
            f += convertUnits(parseFloat(str), UNITS_FEET, units);
            return;
        }
        //no recognized given units, assume given default units
        let f0 = parseFloatInput(str);
        if (f0 != undefined) {
            f ??= 0;
            f += f0;
            return;
        }
    });
    if (isNumber(f)) {
        return f;
    }
    //style: 6ft 2in
    //style: 6ft. 2in.
    return undefined;
}
function _parseFootInchInput(txt, foot, inch) {
    let regexpStr = `${REGEXP_FLOAT.source}${foot} *${REGEXP_FLOAT.source}${inch}`;
    txt = cleanInput(txt, new RegExp(regexpStr, "g"));
    let split = txt.split(new RegExp(`(${foot})|(${inch})`, "g"));//dirty: regexp construction doesnt work

    let f = parseFloat(split[0]) + (parseFloat(split[1]) / 12);
    if (isNumber(f)) {
        return f;
    }
    //style: 6ft 2in
    //style: 6ft. 2in.
    return undefined;
}

/**
 *
 * @param {string} txt A string like `6'2" W 72" H 2' D`
 * @param {number} zerosAllowed How many of the dimensions are allowed to be zero
 * @returns An object like {w:6.17, h:6, d:2, any:1}
 */
function parseDimensions(txt, zerosAllowed = 0, units = UNITS_FEET) {
    const dimkeys = ["w", "h", "d"];
    //pre-format the txt
    txt = txt.toLowerCase();
    dimkeys.forEach(k => {
        //put space between each dimension key
        txt = txt.split(k).join(` ${k} `);
    });
    //
    let tokens = txt.split(" ").filter(t => t?.trim());
    let dimensions = {};
    let lastMeasurement = undefined;
    for (let i = 0; i < tokens.length; i++) {
        let token = tokens[i];
        //measurement
        let f = parseFloatInput(token);
        if (f != undefined) {
            lastMeasurement ??= 0;
            lastMeasurement += parseFootInchInput(token, units);
        }
        //dimension
        else {
            if (dimkeys.includes(token)) {
                dimensions[token] = lastMeasurement;
                lastMeasurement = undefined;
            }
        }
    }
    if (lastMeasurement >= 0) {
        dimensions["any"] = lastMeasurement;
        lastMeasurement = undefined;
    }
    //
    let zerosFound = 0;
    Object.entries(dimensions).forEach(([key, value], i) => {
        if (value == 0) {
            if (zerosFound < zerosAllowed) {
                //do nothing, all good
            }
            else {
                //fix it
                value = 1;
                dimensions[key] = value;
            }
            zerosFound++;
        }
    });
    //
    return dimensions;
}

function log(...params) {
    console.log(...params);
}
