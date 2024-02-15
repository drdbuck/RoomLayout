"use strict";

let body = $("body");
let flm = new FileManager(body);
flm.onImageUploaded.add((image) => log("image uploaded!", image.name));

const uiVars = new UIVars();

let player;
let input;
let controller;
let controllerEdit;
let controllerFPS;
let controllerImageEdit;
let house = new House();
const selectColor = "#8ce8ff";
const selectMaterial = createColorMaterial(selectColor, false);
const edgeMaterial = new LineBasicMaterial({
    color: selectColor,
    linewidth: 1,
});
const objectMask = 0;
const effectMask = 1;
const viewOverhead = new View(new Vector3(0, 10, 0), new Quaternion(-0.7, 0, 0, 0.7));
const viewImmersive = new View(new Vector3(0, 5, 0), new Quaternion(0, 0, 0, 1));
let view = viewOverhead;

const _up = new Vector3(0, 1, 0);

function init() {

    //Player setup
    player = new APP.Player();
    player.setSize(window.innerWidth, window.innerHeight);
    $("divCanvas").appendChild(player.dom);
    let canvas = player.dom.firstChild;
    canvas.id = "cvsDisplay";
    window.addEventListener(
        'resize',
        () => player.setSize(window.innerWidth, window.innerHeight)
    );

    //Input init
    input = new Input(canvas, body);
    window.onkeydown = input.processKeyDown.bind(input);
    window.onkeyup = input.processKeyUp.bind(input);
    window.onmousedown = input.processMouseDown.bind(input);
    window.onmousemove = input.processMouseMove.bind(input);
    window.onmouseup = input.processMouseUp.bind(input);
    window.onmousewheel = input.processMouseWheel.bind(input);


    initUI();
    //Crop Canvas
    controllerImageEdit = new ControllerImageEdit($("cvsCrop"), "#73c9ff");

    //Load
    house = loadHouse();
    if (house.rooms.length == 0) {
        let room = new Room();
        house.addRoom(room);
    }
    //Save
    //2024-01-09: copied from SyllableSight
    window.onbeforeunload = (ev) => {
        saveHouse(house);
    };

    //Load empty scene
    let loader = new FileLoader();
    loader.load('app.json', (text) => {

        player.load(JSON.parse(text));
        player.play();

        //Camera
        player.camera.layers.enable(objectMask);
        player.camera.layers.enable(effectMask);

        //Load scene
        let scene = construct(house);
        player.setScene(scene);

        //Controller init
        controllerEdit = new Controller(
            player.camera,
            player.scene
        );

        //ControllerFPS init
        controllerFPS = new FirstPersonControls(
            player.camera,
            player.dom
        );

        hookupDelegates();

        switchMode(true);
        switchView(true);

    });
}
init();

function hookupDelegates() {

    //Controller Image Edit
    controllerImageEdit.onEditChanged.add((url) => cropCanvasChanged(url));

    //Controller Edit
    controllerEdit.onFaceSelectionChanged.add(faces => {
        controllerImageEdit.updateImage(_contexts[0]);//dirty: using stored _contexts from UIManager
        updateFaceEditPanel(faces);
        if (uiVars.editFaces) {
            uiVars.highlightSelectedFace = true;
        }
    });
    controllerEdit.selector.onSelectionChanged.add(contexts => {
        controllerImageEdit.updateImage(contexts[0]);
        if (uiVars.editFaces) {
            uiVars.highlightSelectedFace = true;
        }
        updateFurnitureEditPanel(contexts);
        //Update selected faces
        contexts.forEach(c => {
            updateFace(c.box, c.face);
        });
    });
    controllerEdit.selector.onSelectionGained.add(context => {
        let box = context.box;
        box.edge.visible = true;
        //
        updateFace(box, context.face);
        registerUIDelegates(context.obj, true);
    });
    controllerEdit.selector.onSelectionLost.add(context => {
        let box = context.box;
        box.edge.visible = false;
        //
        updateFace(box, -1);
        registerUIDelegates(context.obj, false);
    });

    //Controller FPS
    controllerFPS.controls.addEventListener("unlock", () => {
        switchMode(true);
    });

    //UI Vars
    uiVars.onEditFacesChanged.add((editFaces) => {
        uiVars.highlightSelectedFace = editFaces;
        if (editFaces) {
            //deselect objects that dont have a face selected
            let deselectList = controllerEdit.selector.findAll(c => !(c.face >= -1));
            deselectList.forEach(c => controllerEdit.selector.deselect(c));
            //update face edit panel
            updateFaceEditPanel();
        }
    });
    uiVars.onHighlightSelectedFaceChanged.add((highlightSelectedFace) => {
        controller.updateFaceSelection();
    });

    //File Manager

    //Upload image to new box / existing face
    flm.onImageUploaded.add((image) => {
        //upload face instead of editing faces
        if (uiVars.editFaces) {
            uploadFace(image);
            return;
        }
        //Data
        let furniture = new Furniture(image.src);
        furniture.name = image.name;
        let room = house.rooms[0];
        room.addFurniture(furniture);
        //Scene
        let newbox = constructFurniture(furniture);
        player.scene.add(newbox);
        //Select new furniture
        controllerEdit.selectObject(newbox, false, -1);
    });

    //Upload new furniture
    flm.onFurnitureUploaded.add((furniture) => {
        //Data
        let room = house.rooms[0];
        room.addFurniture(furniture);
        //Scene
        let newbox = constructFurniture(furniture);
        player.scene.add(newbox);
        //Select new furniture
        controllerEdit.selectObject(newbox, false);
    });
}

function exportFurniture() {
    let furnitures = controllerEdit.selector.map(context => context.obj);
    if (furnitures.length === 0) {
        //Do nothing
        return;
    }
    //Init savable object
    let listObj = {};
    listObj.list = furnitures;
    //Determine filename
    let filename = "";
    for (let i = 0; i < furnitures.length; i++) {
        let name = furnitures[i].name;
        if (!isEmpty(name)) {
            filename += name + ", ";
            break;
        }
    }
    if (filename.endsWith(", ")) {
        filename = filename.substring(0, filename.length - 2);
    }
    filename ||= "furniture";
    //make json
    let json = JSON.stringify(
        listObj,
        getDataStringify().concat(["list"])
    );
    //Download file
    window.download(
        json,
        filename + '.frn',
        'data:application/txt'
    );
}


//
let looping = false;
let lastTime = 0;
function loop(now) {
    if (!looping) { return; }

    if (!(lastTime > 0)) {
        lastTime = now;
    }
    if (!(now > 0)) {
        now = lastTime;
    }
    let delta = now - lastTime;
    if (!(delta > 0)) {
        delta = 0;
    }
    delta /= 1000;
    controllerFPS.update(delta);

    window.requestAnimationFrame(loop);

    lastTime = now;
}

function simulate(on) {
    if (on) {
        if (!looping) {
            lastTime = 0;
            looping = true;
            loop();
        }
    }
    else {
        looping = false;
    }
};

function registerKeyBindings(edit = inEditMode, play = !inEditMode) {
    input.clearAllDelegates();

    if (edit) {
        input.key.down.add(controllerEdit.processInput.bind(controllerEdit));
        input.mouse.down.add(controllerEdit.processMouseDown.bind(controllerEdit));
        input.mouse.move.add(controllerEdit.processMouseMove.bind(controllerEdit));
        input.mouse.up.add(controllerEdit.processMouseUp.bind(controllerEdit));
        input.mouse.wheel.add(controllerEdit.processMouseWheel.bind(controllerEdit));

        controller = controllerEdit;
    }
    if (play) {
        input.key.down.add(controllerFPS._onKeyDown);
        input.key.up.add(controllerFPS._onKeyUp);
        input.mouse.down.add(controllerFPS._onPointerDown);
        input.mouse.move.add(controllerFPS._onPointerMove);
        input.mouse.up.add(controllerFPS._onPointerUp);

        controller = controllerFPS;
    }

    input.key.down.add((s, e) => {
        switch (e.keyCode) {
            //esc
            // case 27: switchMode(true); break;
            //enter
            // case 13: switchMode(false); break;
            //tab
            case 9:
            //space
            case 32:
                switchView(!inOverhead);
                if (inOverhead) {
                    switchMode(true);
                }
                e.preventDefault();
                break;

        }
    });
    input.mouse.down.add((s, e) => {
        if (!inOverhead && s.mouse.rmbDown) {
            switchMode(false);
        }
    });
    input.mouse.up.add((s, e) => {
        if (!s.mouse.rmbDown) {
            switchMode(true);
        }
    });
    // input.mouse.move.add((s,e)=>{
    //     if (s.mouse.lmbDown){
    //         log("mouseevent", e);
    //     }
    // })
};

let inEditMode = true;
function switchMode(editMode = !inEditMode) {
    inEditMode = editMode;
    //deactivate prev controller
    controller?.activate(false);
    //switch controller
    controller = (editMode)
        ? controllerEdit
        : controllerFPS;
    //active new controller
    controller?.activate(true);
    //
    registerKeyBindings(editMode, !editMode);
    //Simulate
    simulate(!editMode);
};

let inOverhead = true;
function switchView(overhead = !inOverhead) {
    inOverhead = overhead;
    view = (overhead)
        ? viewOverhead
        : viewImmersive;
    //Position camera
    player.camera.quaternion.copy(view.quaternion);
    player.camera.position.copy(view.position);
}

function getDataStringify() {
    return [
        stringifyHouse,
        stringifyBlock,
        stringifyRoom,
        stringifyFurniture,
        stringifyKitBash,
        //
        stringifyVector3,
    ].flat();
}

function uploadFace(image) {
    controllerEdit.selector.forEach(context => {
        let furniture = context.obj;
        let index = (context.face >= -1) ? context.face : furniture.faceList.length;
        furniture.setFace(index, image.src);
        if (index == -1) {
            furniture.defaultFace = image.src;
        }
    });
    //
    controllerImageEdit.updateImage(_contexts[0]);//dirty: using stored _contexts from UIManager
    updateFaceEditPanel();
};

function updateFace(box, face) {
    let edge = box.edge;
    let select = box.select;

    //unhighlight face
    edge.renderOrder = 0;
    select.material = undefined;
    select.visible = false;

    //early exit: highlighting faces turned off
    if (!uiVars.highlightSelectedFace) { return; }

    //highlighting faces turned on
    let faceCount = box.material.length;
    if (face >= 0 && face < faceCount) {
        //highlight face
        select.material = new Array(faceCount);
        select.material[face] = selectMaterial;
        select.visible = true;
        edge.renderOrder = 999;
    }
}

function createMaterials(imageURLs, mincount = 6, defaultImageURL = undefined) {
    let materials = imageURLs.map(
        face => createMaterial(face)
    );
    let defaultMaterial = createMaterial(defaultImageURL) ?? materials[2] ?? materials[0];
    mincount = Math.max(mincount, materials.length);
    for (let i = 0; i < mincount; i++) {
        materials[i] ??= defaultMaterial;
    }
    return materials;
}

function createMaterial(imageURL) {
    if (!imageURL) {
        return undefined;
    }
    //material
    let mat = new MeshLambertMaterial();
    //settings
    mat.aoMapIntensity = 1;
    mat.emissiveIntensity = 2.34;
    mat.flatShading = true;
    mat.forceSinglePass = true;
    mat.lightMapIntensity = 1;
    mat.reflectivity = 0;
    //textures
    if (imageURL) {
        new TextureLoader().load(
            imageURL,
            (texture) => {
                mat.aoMap = texture;
                mat.lightMap = texture;
                mat.map = texture;
                mat.transparent = imageHasTransparency(texture.source.data);
                mat.needsUpdate = true;
            }
        );
    }
    //return
    return mat;
}
function createShaderMaterial(edgeColor = _one.clone(), faceColor = _zero.clone()) {
    let edgeShader = new EdgeShader;
    //2024-01-16: copied from https://jsfiddle.net/prisoner849/kmau6591/
    var material = new ShaderMaterial({
        uniforms: {
            thickness: {
                value: 1.5
            },
            edgeColor: {
                value: edgeColor
            },
            faceColor: {
                value: faceColor
            },
        },
        vertexShader: edgeShader.vertexShader,
        fragmentShader: edgeShader.fragmentShader
    });
    return material;
}
function createColorMaterial(color = 4687027, depth = true) {
    let material = new MeshMatcapMaterial(
        {
            color: color,
            blendColor: 0,
            depthTest: depth,
            depthWrite: depth,
            side: DoubleSide,
        });
    return material;
}

