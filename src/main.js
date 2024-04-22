"use strict";

let body = $("body");
let flm = new FileManager($("divCanvas"));
flm.onImageUploaded.add((image) => log("image uploaded!", image.name));

let uiVars;

let player;
let input;
let undoMan;
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
let inEditMode = true;
let knownMaterials = [];//used to cache existing materials for use later

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

    //Crop Canvas
    controllerImageEdit = new ControllerImageEdit($("cvsCrop"), "#73c9ff");

    //Load House
    house = loadHouse();
    if (house.rooms.length == 0) {
        let room = new Room();
        house.addRoom(room);
    }

    //Save
    //2024-01-09: copied from SyllableSight
    window.onbeforeunload = (ev) => {
        saveHouse(house);
        saveUIVars(uiVars);
    };

    //Player
    player.load();

    //Camera
    let camera = new PerspectiveCamera(50, 1.4183266932270917, 0.01, 1000);
    camera.zoom = 1;
    camera.focus = 10;
    camera.filmGauge = 35;
    camera.filmOffset = 0;
    camera.layers.enable(objectMask);
    camera.layers.enable(effectMask);
    player.setCamera(camera);

    //Load scene
    let scene = construct(house);
    player.setScene(scene);

    //UIVars
    uiVars = loadUIVars();

    //
    // player.play();

    //Controller init
    controllerEdit = new Controller(
        player.camera,
        player.scene,
        canvas
    );

    //ControllerFPS init
    controllerFPS = new FirstPersonControls(
        player.camera,
        player.dom
    );

    //Undo
    undoMan = new UndoManager();

    //UI
    initUI();

    //Menu
    constructMenuBar("divMenuBar", "divMenuPanels", menuBarData);

    //Delegates
    hookupDelegates();
    hookupDelegatesMenu();

    //Update scene
    switchMode(true);
    uiVars.viewId = uiVars.viewId;//trigger delegate w/o changing anything
    uiVars.selector.forEach(c => {
        c.meshes.forEach(mesh => {
            mesh.edge.visible = true;
            updateFace(mesh, -2);
        })
        updateFace(c.mesh, c.face);
    });
    player.animate();

    //Update UI
    updateBoxEditPanel(uiVars.selector.selection);
    updateFaceEditPanel(uiVars.selector.map(c => c.face));
    updateRoomEditPanel();
}
init();

function hookupDelegates() {

    //Controller Image Edit
    controllerImageEdit.onEditChanged.add((url) => cropCanvasChanged(url));

    //Controller Edit
    controllerEdit.onFaceSelectionChanged.add(faces => {
        if (uiVars.viewPanelFace) {
            uiVars.viewPanelFaceEdit = false;
            updateFaceEditPanel(faces);
            uiVars.highlightSelectedFace = true;
            player.animate();
        }
    });
    uiVars.selector.onSelectionChanged.add(contexts => {
        controllerEdit.updateCollectiveCenter();
        //
        updateBoxEditPanel(contexts);
        if (uiVars.viewPanelFace) {
            uiVars.highlightSelectedFace = true;
        }
        //Update selected faces
        contexts.forEach(c => {
            updateFace(c.mesh, c.face);
        });
    });
    uiVars.selector.onSelectionGained.add(context => {
        context.meshes.forEach(mesh => {
            mesh.edge.visible = true;
            updateFace(mesh, -2);
        })
        //
        updateFace(context.mesh, context.face);
        registerUIDelegates(context.obj, true);
    });
    uiVars.selector.onSelectionLost.add(context => {
        context.meshes.forEach(mesh => {
            mesh.edge.visible = false;
            updateFace(mesh, -2);
        })
        //
        updateFace(context.mesh, -2);
        registerUIDelegates(context.obj, false);
    });

    //Controller FPS
    controllerFPS.controls.addEventListener("unlock", () => {
        switchMode(true);
    });

    //UI Vars
    uiVars.onEditRoomsChanged.add(updateRoomEditPanel);
    uiVars.onEditObjectsChanged.add(updateBoxEditPanel);
    uiVars.onViewPanelFaceChanged.add((viewPanelFace) => {
        uiVars.highlightSelectedFace = viewPanelFace;
        if (!viewPanelFace) {
            uiVars.viewPanelFaceEdit = false;
        }
        //update face edit panel
        updateFaceEditPanel();
    });
    uiVars.onViewPanelFaceEditChanged.add((viewPanelFaceEdit) => {
        if (viewPanelFaceEdit && !uiVars.viewPanelFace) {
            uiVars.viewPanelFace = true;
        }
        //update face edit panel
        updateFaceEditPanel();
    });
    uiVars.onHighlightSelectedFaceChanged.add((highlightSelectedFace) => {
        controller.updateFaceSelection();
    });
    uiVars.onViewIdChanged.add((viewId, view) => {
        //Position camera
        player.camera.quaternion.copy(view.quaternion);
        player.camera.position.copy(view.position);
    });

    //Undo System
    const onUndoFunc = (state) => {
        if (state.corners) {
            controllerImageEdit.imageEdit.cornerList = state.corners;
            controllerImageEdit.boomerangCorners();
        }
    }
    undoMan.onUndo.add((state) => onUndoFunc(undoMan.getState(1)));
    undoMan.onRedo.add(onUndoFunc);

    //File Manager

    //Upload image to new mesh / existing face
    flm.onImageUploaded.add((image) => {
        //upload face instead of editing faces
        if (uiVars.viewPanelFace && uiVars.selector.count > 0) {
            uploadFace(image);
            return;
        }
        //Data
        let box = new Box(image.src);
        box.name = image.name;
        uiVars.giveUids(box);
        let room = house.rooms[0];//dirty: hardcoded which room to add to
        room.addBox(box);
        //Select new box
        controllerEdit.selectObject(box, false, FACE_DEFAULT);
        //Position new box
        let point = controllerEdit.getHitAtMousePos()?.point;
        if (point) {
            box.position = point;
        }
        // //focus field
        // $("txtWidth").focus();
    });

    //Upload new box
    flm.onBoxUploaded.add((box) => {
        //Data
        uiVars.giveUids(box);
        let room = house.rooms[0];//dirty: hardcoded which room to add to
        room.addBox(box);
        //Select new box
        controllerEdit.selectObject(box, false);
        //Position new box
        let point = controllerEdit.getHitAtMousePos()?.point;
        if (point) {
            box.position = point;
        }
    });

    //Upload new room
    flm.onRoomUploaded.add((room) => {
        //TEMP: overwrite existing room
        //TODO: add to room list (but currently we dont support multiple rooms)
        if (!confirm("Overwrite existing room?")) { return; }
        //Data
        uiVars.giveUids(room);
        house.rooms[0] = room;//dirty: hardcoded which room to overwrite (i guess lol)
        //objects
        player.scene.children = [];
        constructRoom(room, player.scene);
    });
}

function hookupDelegatesMenu() {
    Object.entries(menuListeners).forEach(([key, value]) => {

        //get function
        const funcText = value.join(" ");
        //limit it to only calling menuUpate methods (for more security)
        if (!(/^(menuUpdate[a-zA-Z0-9]*\(\'btn[a-zA-Z0-9]+\'(, *\-?[a-zA-Z0-9]*)?\); ?)+$/.test(funcText))) {
            return;
        }
        //make the func
        const updateFunc = new Function(funcText);

        //get events
        let events = [];
        switch (key) {
            case "select": events = [uiVars.selector.onSelectionChanged]; break;
            case "undo": events = [
                undoMan.onUndo,
                undoMan.onRedo,
                undoMan.onRecordUndo,
            ]; break;
            case "group": events = [
                //TODO: onGroup() and onUngroup() events
            ]; break;
            default: console.warn("event not registered", key);
        }

        //hookup them up
        events.forEach(event => {
            event.add(updateFunc);
        });

        //call the update func (for initial state)
        updateFunc();
    });
}

function getBox(box) {
    return player.scene.children
        .map(c => c?.children?.[0])
        .filter(c => c)
        .find(mesh => mesh.box == box);
}

function getBoxes(furnitures) {
    if (!(furnitures?.length > 0)) { return []; }
    return player.scene.children
        .map(c => c?.children?.[0])
        .filter(c => c)
        .filter(mesh => mesh.box && furnitures.includes(mesh.box))
}

function inflateData(data) {
    switch (true) {
        //House
        case !!data.rooms: inflateHouse(data); return;
        //Room
        case !!data.furnitures: inflateRoom(data); return;
        //KitBash
        case !!data._items: inflateKitBash(data); return;
        //Box
        case !!data._faces: inflateBox(data); return;
        //Block
        case !!data._scale: inflateBlock(data); return;
        //Unknown
        default: console.error("Data object of unknown type", data);
    }
}

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
        input.mouse.wheel.add(controllerFPS._onMouseWheel);

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
                uiVars.viewInOverhead = !uiVars.viewInOverhead;
                if (uiVars.viewInOverhead) {
                    switchMode(true);
                }
                e.preventDefault();
                break;
        }
    });
    input.mouse.down.add((s, e) => {
        if (!uiVars.viewInOverhead && s.mouse.rmbDown) {
            switchMode(false);
            controller._onPointerDown(s, e);
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
};

function getDataStringify() {
    return [
        stringifyHouse,
        stringifyBlock,
        stringifyRoom,
        stringifyBox,
        stringifyKitBash,
        //
        stringifyVector3,
    ].flat();
}

function uploadFace(image) {
    uiVars.selector.forEach(context => {
        let index = context.face;
        if (index == -2) { return; }
        let box = context.box;
        box.setFace(index, image.src);
    });
};

function updateFace(mesh, face) {
    let edge = mesh.edge;
    let select = mesh.select;

    //unhighlight face
    edge.renderOrder = 0;
    select.material = undefined;
    select.visible = false;

    //early exit: highlighting faces turned off
    if (!uiVars.highlightSelectedFace) { return; }

    //highlighting faces turned on
    let faceCount = mesh.material.length;
    if (face >= 0 && face < faceCount) {
        //highlight face
        select.material = new Array(faceCount);
        select.material[face] = selectMaterial;
        select.visible = true;
        edge.renderOrder = 999;
    }
}

function createMaterials(imageURLs, mincount = 6, defaultImageURL = undefined, front = true) {
    let materials = imageURLs.map(
        face => createMaterial(face, front)
    );
    let defaultMaterial = createMaterial(defaultImageURL, front) ?? materials[2] ?? materials[0];
    mincount = Math.max(mincount, materials.length);
    for (let i = 0; i < mincount; i++) {
        materials[i] ??= defaultMaterial;
    }
    return materials;
}

function createMaterial(imageURL, front = true) {
    if (!imageURL) {
        return undefined;
    }
    //search for existing material (efficiency)
    let matObj = knownMaterials.find(matObj => matObj.imageURL == imageURL && matObj.front == front);
    if (matObj) {
        return matObj.material;
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
    mat.side = (front) ? FrontSide : BackSide;
    //textures
    if (imageURL) {
        new TextureLoader().load(
            imageURL,
            (texture) => {
                mat.aoMap = texture;
                mat.lightMap = texture;
                mat.map = texture;
                mat.transparent = imageHasTransparency(texture.source.data);
                mat.alphaTest = 0.001;
                mat.needsUpdate = true;
                player.animate();
            }
        );
    }
    //register this material
    knownMaterials.push({
        imageURL: imageURL,
        front: front,
        material: mat,
    });
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

//TEST
function select() {
    return uiVars.selector._selection[0];
}
