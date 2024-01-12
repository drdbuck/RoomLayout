"use strict";

let body = $("body");
let flm = new FileManager(body);
flm.onImageUploaded.add((image) => console.log("image uploaded!", image.name));

let loader = new FileLoader();
let player = new APP.Player();
let input = new Input();
let controller;
let controllerEdit;
let controllerFPS;
let room;
let house = new House();

function init() {

    //Input init
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
    $("txtWidth").onchange = (txt) => controllerEdit.current.width = parseFloat(txt.target.value);
    $("txtLength").onchange = (txt) => controllerEdit.current.length = parseFloat(txt.target.value);
    $("txtHeight").onchange = (txt) => controllerEdit.current.height = parseFloat(txt.target.value);

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
    loader.load('app.json', function (text) {

        player.load(JSON.parse(text));
        player.setSize(window.innerWidth, window.innerHeight);
        player.play();
        $("divCanvas").appendChild(player.dom);
        player.dom.firstChild.id = "cvsDisplay";

        window.addEventListener('resize', function () {

            player.setSize(window.innerWidth, window.innerHeight);

        });

        //Load scene
        let scene = construct(house);
        player.setScene(scene);

            //Controller init
            controllerEdit = new Controller(
                player.camera,
                player.scene
            );
            controllerFPS = new FirstPersonControls(
                player.camera,
                player.scene.children[0],
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
                house.rooms[0].addFurniture(furniture);
                //Scene
                let newbox = constructFurniture(furniture);
                player.scene.add(newbox);
                //Current
                controllerEdit.current = furniture;
            });

            switchMode(true);

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
            case 27: switchMode(true); break;
            //enter
            case 13: switchMode(false); break;
            //tab
            case 9:
                switchMode(!inEditMode);
                e.preventDefault();
                break;
            //space
            case 32:
                switchMode(!inEditMode);
                e.preventDefault();
                break;

        }
    });
    // input.mouse.move.add((s,e)=>{
    //     if (s.mouse.lmbDown){
    //         console.log("mouseevent", e);
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
    //Position camera
    player.camera.quaternion.copy(controller.save.quaternion);
    player.camera.position.copy(controller.save.position);
    //Simulate
    simulate(!editMode);
};

function setRoomSize(width, height) {
    //defaults
    width ??= room.scale.x;
    height ??= room.scale.y;
    //processing
    room.scale.x = width;
    room.scale.y = height;
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

function testNewHouse() {
    //house
    let house = new House(0);
    //room
    let room = new Room(11, 12);
    //furniture
    let furniture = new Furniture();
    furniture.position.y = 1;
    room.addFurniture(furniture);
    let furniture2 = new Furniture();
    furniture2.position.x = 2;
    furniture2.position.y = 1;
    furniture2.position.z = 1;
    room.addFurniture(furniture2);
    //
    house.addRoom(room);
    //
    let scene = construct(house);
    player.setScene(scene);
    //
    controllerEdit.scene = scene;
    controllerFPS.scene = scene;

    //
    return house;
}

function testLoadHouse() {
    //house
    house = loadHouse();
    //
    let scene = construct(house);
    player.setScene(scene);
    //
    controllerEdit.scene = scene;
    controllerFPS.scene = scene;
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
