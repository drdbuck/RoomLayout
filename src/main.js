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

    //Load
    house = loadHouse();
    if (house.rooms.length == 0) {
        let room = new Room();
        house.addRoom(room);
    }
    uiVars = loadUIVars();
    uiVars.giveUids(house);

    //Save
    //2024-01-09: copied from SyllableSight
    window.onbeforeunload = (ev) => {
        saveHouse(house);
        saveUIVars(uiVars);
    };

    //UI
    initUI();

    //Player
        player.load();

        //Camera
        let camera =  new PerspectiveCamera(50, 1.4183266932270917, 0.01, 1000);
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

        //
        player.play();

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

        hookupDelegates();

        switchMode(true);
        uiVars.viewId = uiVars.viewId;//trigger delegate w/o changing anything

        //Update UI
        updateFurnitureEditPanel();
        updateFaceEditPanel();
        updateRoomEditPanel();

    //Menu
    constructMenuBar("divMenuBar", "divMenuPanels", menuBarData);
}
init();

function hookupDelegates() {

    //Controller Image Edit
    controllerImageEdit.onEditChanged.add((url) => cropCanvasChanged(url));

    //Controller Edit
    controllerEdit.onFaceSelectionChanged.add(faces => {
        if (uiVars.editFaces) {
            updateFaceEditPanel(faces);
            uiVars.highlightSelectedFace = true;
        }
    });
    controllerEdit.selector.onSelectionChanged.add(contexts => {
        updateFurnitureEditPanel(contexts);
        if (uiVars.editFaces) {
            uiVars.highlightSelectedFace = true;
        }
        //Update selected faces
        contexts.forEach(c => {
            updateFace(c.box, c.face);
        });
    });
    controllerEdit.selector.onSelectionGained.add(context => {
        context.boxes.forEach(box => {
            box.edge.visible = true;
            updateFace(box, -2);
        })
        //
        updateFace(context.box, context.face);
        registerUIDelegates(context.obj, true);
    });
    controllerEdit.selector.onSelectionLost.add(context => {
        context.boxes.forEach(box => {
            box.edge.visible = false;
            updateFace(box, -2);
        })
        //
        updateFace(context.box, -2);
        registerUIDelegates(context.obj, false);
    });

    //Controller FPS
    controllerFPS.controls.addEventListener("unlock", () => {
        switchMode(true);
    });

    //UI Vars
    uiVars.onEditRoomsChanged.add(updateRoomEditPanel);
    uiVars.onEditObjectsChanged.add(updateFurnitureEditPanel);
    uiVars.onEditFacesChanged.add((editFaces) => {
        uiVars.highlightSelectedFace = editFaces;
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

    //File Manager

    //Upload image to new box / existing face
    flm.onImageUploaded.add((image) => {
        //upload face instead of editing faces
        if (uiVars.editFaces && controllerEdit.selector.count > 0) {
            uploadFace(image);
            return;
        }
        //Data
        let furniture = new Furniture(image.src);
        furniture.name = image.name;
        uiVars.giveUids(furniture);
        let room = house.rooms[0];//dirty: hardcoded which room to add to
        room.addFurniture(furniture);
        //Select new furniture
        controllerEdit.selectObject(furniture, false, FACE_DEFAULT);
        //Position new furniture
        let point = controllerEdit.getHitAtMousePos()?.point;
        if (point) {
            furniture.position = point;
        }
        //focus field
        $("txtWidth").focus();
    });

    //Upload new furniture
    flm.onFurnitureUploaded.add((furniture) => {
        //Data
        uiVars.giveUids(furniture);
        let room = house.rooms[0];//dirty: hardcoded which room to add to
        room.addFurniture(furniture);
        //Select new furniture
        controllerEdit.selectObject(furniture, false);
        //Position new furniture
        let point = controllerEdit.getHitAtMousePos()?.point;
        if (point) {
            furniture.position = point;
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

function getBox(furniture) {
    return player.scene.children.find(box => box.furniture == furniture);
}

function getBoxes(furnitures) {
    return player.scene.children.filter(box => furnitures.includes(box.furniture));
}

function inflateData(data) {
    switch (true) {
        //House
        case !!data.rooms: inflateHouse(data); return;
        //Room
        case !!data.furnitures: inflateRoom(data); return;
        //KitBash
        case !!data._items: inflateKitBash(data); return;
        //Furniture
        case !!data._faces: inflateFurniture(data); return;
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
        stringifyFurniture,
        stringifyKitBash,
        //
        stringifyVector3,
    ].flat();
}

function uploadFace(image) {
    controllerEdit.selector.forEach(context => {
        let index = context.face;
        if (index == -2) { return; }
        let furniture = context.furniture;
        furniture.setFace(index, image.src);
    });
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

//TEST
function select() {
    return controllerEdit.selector._selection[0];
}
