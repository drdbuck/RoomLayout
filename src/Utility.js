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
function isNumber(n) { return !isNaN(parseFloat(n)) && !isNaN(n - 0) }

//2023-02-27: constructed after consulting https://stackoverflow.com/q/14636536/2336212
function isInteger(n) { return isNumber(n) && Math.floor(n) === n; }

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
}

let between = function (value, min, max) {
    return (min <= value && value <= max);
}

//Cuts decimals off the given value so that only the given number of places remains
Math.cut = function (value, places) {
    let factor = 1;
    for (let i = 0; i < places; i++) {
        factor *= 10;
    }
    return Math.round(value * factor) / factor;
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
}

Array.prototype.min = function (minFunc = (val) => val) {
    return this.reduce(
        (acc, cur) => Math.min(minFunc(cur), acc),
        minFunc(this[0])
    );
}
Array.prototype.max = function (maxFunc = (val) => val) {
    return this.reduce(
        (acc, cur) => Math.max(maxFunc(cur), acc),
        maxFunc(this[0])
    );
}

Array.prototype.sum = function (sumFunc = (val) => val) {
    return this.reduce(
        (acc, cur) => sumFunc(cur) + acc,
        0
    );
}

Array.prototype.remove = function (value) {
    let index = this.indexOf(value);
    if (index >= 0) {
        this.splice(index, 1);
        return true;
    }
    return false;
}

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

/**
 * Returns a copy of the given array without duplicates
 * @param {any[]} array The array to copy and remove duplicates from
 * @param {boolean} ignoreEmpty If set to true, it will skip over empty elements
 */
function removeDuplicates(array, ignoreEmpty = true) {
    //copy array
    array = array.slice();
    //remove duplicates
    for (let i = array.length - 1; i >= 0; i--) {
        //exception: ignore empty
        if (ignoreEmpty && array[i] == undefined) {
            continue;
        }
        for (let j = 0; j < array.length; j++) {
            //if its a duplicate of another element,
            if (array[i] === array[j] && i != j) {
                //remove it
                array.splice(i, 1);
                break;
            }
        }
    }
    return array;
}

function createImage(name, url) {
    let image = new Image();
    image.name = name;
    image.src = url;
    return image;
}

function copy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function copyObject(obj, stringify) {
    return JSON.parse(JSON.stringify(obj, stringify));
}


function getMemorySize(json) {
    if (!json) return 0;
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

