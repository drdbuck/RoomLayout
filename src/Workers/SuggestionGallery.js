"use strict";

//2024-06-17: made with help from https://stackoverflow.com/a/62349015/2336212

function createSuggestionList(_contexts) {
    //early exit: no contexts
    if (!(_contexts?.length > 0)) { return []; }
    //
    let suggest = [];
    const maxSuggestions = 4;
    //last image
    _contexts//dirty: using _contexts
        .filter(c => c.box)
        .forEach(context => {
            let f = context.box;
            suggest.push(f.lastImage);
        });
    //image from other side
    _contexts//dirty: using _contexts
        .filter(c => c.face >= 0 && c._boxSelected)
        .forEach(context => {
            let f = context.box;
            let flipFace = context.face + ((context.face % 2 == 0) ? 1 : -1);
            let flipURL = f._faces[flipFace];
            suggest.push(flipURL);
        });
    //default face image
    _contexts.forEach(context => {//dirty: using _contexts
        let f = context.kitbash ?? context.box;
        suggest.push(f.defaultFace);
    });
    //images from other sides
    let _boxs = _contexts.map(c => c.box);
    _boxs.forEach(box => {
        box._faces.forEach(face => suggest.push(face));
    });
    //group imported faces
    let _groups = _contexts.map(c => c.kitbash);
    _groups.forEach(group => {
        group._faces.forEach(face => suggest.push(face));
    });
    //images from other meshes in same group
    _groups.forEach(group => {
        group._items.forEach(item => {
            item._faces.forEach(face => suggest.push(face));
        });
    });
    //return
    return suggest
        //remove blanks
        .filter(url => url)
        //only get first few suggestions
        // .slice(0, maxSuggestions)
        ;
}

function removeDuplicates(array) {
    let arr = [];
    array.forEach(n => {
        if (!arr.includes(n)) {
            arr.push(n);
        }
    });
    return arr;
}

onmessage = function(event) {
    console.log("Suggestion Gallery", event.data.length);
    let _contexts = event.data;
    let suggestList = createSuggestionList(_contexts);
    suggestList = removeDuplicates(suggestList);
    postMessage(suggestList);
}