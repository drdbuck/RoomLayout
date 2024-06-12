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
let createObjectDialogue;
let createObjectDialogueStack;
let house = new House();
const selectColor = "#8ce8ff";
const selectMaterial = createColorMaterial(selectColor, false, FrontSide);
const selectColorBack = "#005a70";
const selectMaterialBack = createColorMaterial(selectColorBack, false, BackSide);
const edgeMaterial = new LineBasicMaterial({
    color: selectColor,
    linewidth: 1,
});
const edgeMaterial2 = new LineBasicMaterial({
    color: "#0CF727",
    linewidth: 1,
});
const edgeMaterial3 = new LineBasicMaterial({
    color: "#FFFFFF",
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
    input = new Input(canvas, [
        body,
        $("btnChangeBoxL"),
        $("btnChangeBoxR"),
        $("btnFaceEdit"),
        $("btnGroupFaceEdit"),
        $("divFaceEdit"),
    ]);
    window.onkeydown = input.processKeyDown.bind(input);
    window.onkeyup = input.processKeyUp.bind(input);
    window.onmousedown = input.processMouseDown.bind(input);
    window.onmousemove = input.processMouseMove.bind(input);
    window.onmouseup = input.processMouseUp.bind(input);
    window.onmousewheel = input.processMouseWheel.bind(input);
    window.ondblclick = input.processMouseDoubleClick.bind(input);

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

    //Create Object Dialogue
    createObjectDialogue = new AdvancedDialogue(
        "Create Object", //TODO: have the title changed based on what's being created
        [
            "Size",
            {
                name: "Width",
                type: OPTION_TYPE_NUMBER_POSITIVE_NONZERO,
                default: 2,
            },
            {
                name: "Depth",
                type: OPTION_TYPE_NUMBER_POSITIVE_NONZERO,
                default: 1,
            },
            {
                name: "Height",
                type: OPTION_TYPE_NUMBER_POSITIVE_NONZERO,
                default: 3,
            },
            // "Position",
            // {
            //     name: "X",
            //     type: OPTION_TYPE_NUMBER,
            //     default: 0,
            // },
            // {
            //     name: "Y",
            //     type: OPTION_TYPE_NUMBER,
            //     default: 0,
            // },
            // {
            //     name: "Altitude",
            //     type: OPTION_TYPE_NUMBER_POSITIVE,
            //     default: 0,
            // },
            "Rotation",
            // {
            //     name: "Angle",
            //     type: OPTION_TYPE_NUMBER_POSITIVE,
            //     default: 0,
            // },
            {
                name: "Recline",
                type: OPTION_TYPE_NUMBER_POSITIVE,
                default: 0,
            },
        ],
        body,
        "Create",
        (answers) => {
            answers.Width = parseNumber(answers.Width);
            answers.Depth = parseNumber(answers.Depth);
            answers.Height = parseNumber(answers.Height);
            answers.Recline = parseNumber(answers.Recline);
        }
    );

    //Create Object Dialogue Rectangle Stack
    createObjectDialogueStack = new AdvancedDialogue(
        "Create Rectangle Stacks",
        [

            //Size
            "Size",
            {
                name: "Width",
                type: OPTION_TYPE_NUMBER_POSITIVE_NONZERO,
                default: () => uiVars.selector.first?.kitbash.width ?? 2,
            },
            {
                name: "Depth",
                type: OPTION_TYPE_NUMBER_POSITIVE_NONZERO,
                default: () => uiVars.selector.first?.kitbash.depth ?? 1,
            },
            {
                name: "Height",
                type: OPTION_TYPE_NUMBER_POSITIVE_NONZERO,
                default: () => uiVars.selector.first?.kitbash.height ?? 3,
            },

            //Count
            "Count",
            {
                name: "Left-to-Right",
                type: OPTION_TYPE_NUMBER_POSITIVE,
                default: 5,
            },
            {
                name: "Front-to-Back",
                type: OPTION_TYPE_NUMBER_POSITIVE,
                default: 5,
            },
            {
                name: "Top-to-Bottom",
                type: OPTION_TYPE_NUMBER_POSITIVE,
                default: 5,
            },

        ],
        body,
        "Create",
        (answers) => {
            answers.Width = parseNumber(answers.Width);
            answers.Depth = parseNumber(answers.Depth);
            answers.Height = parseNumber(answers.Height);
            answers.Recline = parseNumber(answers.Recline);
        }
    );

    //Delegates
    hookupDelegates();
    hookupDelegatesMenu();

    //Update scene
    switchMode(true);
    uiVars.callDelegates();
    player.animate();

    //Update UI
    updateUIVariables(uiVars.selector.selection);
    updateAllPanels();

    controllerEdit.updateCollectiveCenter();
}
init();

function hookupDelegates() {

    //Controller Image Edit
    controllerImageEdit.onEditChanged.add((url) => cropCanvasChanged(url));

    //Controller Edit
    controllerEdit.onFaceSelectionChanged.add(faces => {
        updateUIVariables(uiVars.selector.selection);
        updateBoxEditPanel();
        uiVars.viewPanelFace = faces.length > 0 && faces.some(f => f > FACE_NONE) && uiVars.selector.some(c => c.faceSelected);
        // if (uiVars.viewPanelFace) {
        uiVars.viewPanelFaceEdit = false;
        updateFaceEditPanel();
        uiVars.highlightSelectedFace = true;
        player.animate();
    });
    uiVars.selector.onSelectionChanged.add(contexts => {
        controllerEdit.updateCollectiveCenter();
        //
        updateUIVariables(contexts);
        updateAllPanels();
        if (uiVars.viewPanelFace) {
            uiVars.highlightSelectedFace = true;
        }
        //Update selected faces
        contexts.forEach(c => {
            updateFace(c.mesh, c.face, c.faceSelected);
        });
        //update group bounding box selections
        player.scene.children
            .filter(mesh => mesh.kitbash)
            .forEach(mesh => mesh.edge.visible = false);
        contexts
            .filter(c => !c.obj.isKitBash)
            .forEach(c => {
                c.meshBounds.edge.visible = true;
                c.meshBounds.edge.material = edgeMaterial3;
            });
        contexts
            .filter(c => c.obj.isKitBash)
            .forEach(c => {
                c.meshBounds.edge.visible = true;
                c.meshBounds.edge.material = edgeMaterial2;
            });
        //
        uiVars.editObjects = contexts.length > 0;
        uiVars.editBoxes = contexts.length > 0 && contexts.some(c => !c.obj.isKitBash || c.boxSelected);
    });
    uiVars.selector.onSelectionGained.add(context => {
        if (context.boxSelected) {
            context.meshes.forEach(mesh => {
                mesh.edge.visible = true;
                updateFace(mesh, FACE_NONE, context.faceSelected);
            });
        }
        //
        updateFace(context.mesh, context.face, context.faceSelected);
        registerUIDelegates(context, true);
        uiVars.viewPanelFace = uiVars.selector.some(c => c.faceSelected);
        uiVars.editBoxes = uiVars.selector.some(c => !c.obj.isKitBash || c.boxSelected);
    });
    uiVars.selector.onSelectionLost.add(context => {
        context.meshes.forEach(mesh => {
            mesh.edge.visible = false;
            updateFace(mesh, FACE_NONE, context.faceSelected);
        });
        //if group no longer selected,
        if (!uiVars.selector.find(c => c.kitbash == context.kitbash)) {
            //hide face panel
            uiVars.viewPanelFace = false;
        }
        //        
        updateFace(context.mesh, FACE_NONE, context.faceSelected);
        registerUIDelegates(context, false);
        uiVars.editBoxes = uiVars.selector.some(c => !c.obj.isKitBash || c.boxSelected);
    });

    //Controller FPS
    controllerFPS.controls.addEventListener("unlock", () => {
        switchMode(true);
    });

    //UI Vars
    uiVars.onEditRoomsChanged.add(updateRoomEditPanel);
    uiVars.onEditObjectsChanged.add(updateAllPanels);
    uiVars.onEditBoxesChanged.add(updateAllPanels);
    uiVars.onViewPanelFaceChanged.add((viewPanelFace) => {
        uiVars.highlightSelectedFace = viewPanelFace;
        if (!viewPanelFace) {
            uiVars.selector.forEach(c => c.faceSelected = false);
            uiVars.viewPanelFaceEdit = false;
            controllerImageEdit.reset();
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
    };
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
        let room = house.rooms[0];//dirty: hardcoded which room to add to
        let group = room.group(undefined, image.src);
        group.name = image.name;
        uiVars.giveUids(group);
        //Select new box
        controllerEdit.selectObject(group, false, FACE_DEFAULT);
        //Position new box
        group.worldPosition = getSpawnPoint();
        // //focus field
        // $("txtWidth").focus();
    });

    //Upload new furniture
    flm.onFurnitureUploaded.add((furniture) => {
        //Data
        uiVars.giveUids(furniture);
        let room = house.rooms[0];//dirty: hardcoded which room to add to
        room.addFurniture(furniture);
        //Select new furniture
        controllerEdit.selectObject(furniture, false, FACE_DEFAULT);
        //Position new furniture
        furniture.worldPosition = getSpawnPoint();
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
    if (!box) {
        return undefined;
    }
    return player.scene.children
        .find(mesh => mesh.box == box);
}

function getBoxes(furnitures) {
    if (!(furnitures?.length > 0)) { return []; }
    return player.scene.children
        .filter(mesh => mesh.box && furnitures.includes(mesh.box));
}

function getBoxBounds(kitbash) {
    return player.scene.children
        .filter(c => c)
        .find(mesh => mesh.kitbash == kitbash);
}

function getSpawnPoint(kitbash) {
    kitbash ??= uiVars.selector.find(c => c.kitbash)?.kitbash;
    const defaultSpawnPoint = (kitbash?.position ?? _zero).clone();
    let rch = controllerEdit.getHitAtMousePos();
    if (!(rch?.object.planeType == "floor")) { return defaultSpawnPoint; }
    //main point
    return rch.point ?? defaultSpawnPoint;
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
        input.mouse.doubleclick.add(controllerEdit.processMouseDoubleClick.bind(controllerEdit));

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
        context.Face = image.src;
    });
};

function updateFace(mesh, face, faceSelected) {
    //early exit: no mesh
    if (!mesh) { return; }
    //
    let edge = mesh.edge;
    let select = mesh.select;
    let selectBack = mesh.selectBack;

    //unhighlight face
    edge.renderOrder = 0;
    select.material = undefined;
    select.visible = false;
    selectBack.material = undefined;
    selectBack.visible = false;

    //early exit: highlighting faces turned off
    if (!uiVars.highlightSelectedFace) { return; }

    //early exit: context doesn't want faces selected
    if (!faceSelected) { return; }

    //highlighting faces turned on
    let faceCount = mesh.material.length;
    if (face >= 0 && face < faceCount) {
        //highlight face
        select.material = new Array(faceCount);
        select.material[face] = selectMaterial;
        select.visible = true;
        selectBack.material = new Array(faceCount);
        selectBack.material[face] = selectMaterialBack;
        selectBack.visible = true;
        edge.renderOrder = 999;
    }
}

function createMaterials(imageURLs = [PIXEL_WHITE], mincount = 6, defaultImageURL = undefined, front = true) {
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

function createMaterial(imageURL, front = true, opacity = 1) {
    if (!imageURL) {
        return undefined;
    }
    //special case: completely transparent pixel
    if (imageURL == PIXEL_TRANSPARENT) {
        opacity = 0;
    }
    //search for existing material (efficiency)
    let matObj = knownMaterials.find(matObj => matObj.imageURL == imageURL && matObj.front == front && matObj.material.opacity == opacity);
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
                mat.transparent = opacity < 1 || imageHasTransparency(texture.source.data);
                mat.opacity = opacity;
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
function createColorMaterial(color = 4687027, depth = true, side = DoubleSide) {
    let material = new MeshBasicMaterial(
        {
            color: color,
            blendColor: 0,
            depthTest: depth,
            depthWrite: depth,
            side: side,
        });
    return material;
}

//TEST
function select() {
    return uiVars.selector._selection[0];
}
