"use strict";

let body = $("body");
let flm = new FileManager(body);
let flmFace = new FileManager($("divFaceDrop"));
flm.onImageUploaded.add((image) => log("image uploaded!", image.name));
flmFace.onImageUploaded.add((image) => log("image uploaded to face!", image.name));

let loader = new FileLoader();
let player;
let input;
let controller;
let controllerEdit;
let controllerFPS;
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

    //textbox events
    [
        "txtWidth",
        "txtLength",
        "txtHeight"
    ]
        .forEach(txtId => {
            let txt = $(txtId);
            txt.onfocus = () => {
                input.clearAllDelegates();
            };
            txt.onblur = () => {
                registerKeyBindings();
            };
        });
    //individual textbox events
    $("txtWidth").onchange = (txt) => controllerEdit.selector.forEach(
        context => context.obj.width = parseFloat(txt.target.value)
    );
    $("txtLength").onchange = (txt) => controllerEdit.selector.forEach(
        context => context.obj.length = parseFloat(txt.target.value)
    );
    $("txtHeight").onchange = (txt) => controllerEdit.selector.forEach(
        context => context.obj.height = parseFloat(txt.target.value)
    );

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
        controllerEdit.onFaceSelectionChanged.add(updateFaceEditPanel);
        controllerEdit.selector.onSelectionChanged.add(updateFurnitureEditPanel);
        controllerEdit.selector.onSelectionGained.add(context => {
            let box = context.box;
            box.edge.visible = true;
            //
            updateFace(box, context.face);
        });
        controllerEdit.selector.onSelectionLost.add(context => {
            let box = context.box;
            box.edge.visible = false;
            //
            updateFace(box, -1);
        });
        //ControllerFPS init
        controllerFPS = new FirstPersonControls(
            player.camera,
            player.dom
        );
        controllerFPS.controls.addEventListener("unlock", () => {
            switchMode(true);
        });

        //Upload image to new box
        flm.onImageUploaded.add((image) => {
            //Data
            let furniture = new Furniture(image.src);
            furniture.position.y = 0.5;
            let room = house.rooms[0];
            room.addFurniture(furniture);
            //Scene
            let newbox = constructFurniture(furniture);
            player.scene.add(newbox);
            //Current
            controllerEdit.selector.selectOnly(
                controllerEdit.createSelectContext(furniture, newbox)
            );
        });

        //Upload face to existing box
        flmFace.onImageUploaded.add((image) => {
            controllerEdit.selector.forEach(context => {
                let furniture = context.obj;
                let index = (context.face >= 0) ? context.face : furniture.faces.length;
                furniture.faces[index] = image.src;
                let box = context.box;
                box.material = createMaterials(furniture.faces);
                box.materialList = [...box.material];
            });
        });

        switchMode(true);
        switchView(true);

    });
}
init();


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
        //
        stringifyVector3,
    ].flat();
}

function updateFace(box, face) {
    let edge = box.edge;
    let select = box.select;
    let faceCount = box.material.length;
    edge.renderOrder = 0;
    select.material = undefined;
    select.visible = false;
    if (face >= 0 && face < faceCount) {
        select.material = new Array(faceCount);
        select.material[face] = selectMaterial;
        select.visible = true;
        edge.renderOrder = 999;
    }
}

function createMaterials(imageURLs, count = 6) {
    let materials = imageURLs.map(
        face => createMaterial(face)
    );
    let defaultMaterial = materials[2] ?? materials[0];
    for (let i = 0; i < count; i++) {
        materials[i] ??= defaultMaterial;
    }
    return materials;
}

function createMaterial(imageURL) {
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
                mat.needsUpdate = true;
            }
        );
    }
    //return
    return mat;
}
function createShaderMaterial(edgeColor = _one, faceColor = _zero) {
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

