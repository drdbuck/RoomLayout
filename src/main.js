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

function init() {

    //Input init
    window.onkeydown = input.processKeyDown.bind(input);
    window.onkeyup = input.processKeyUp.bind(input);
    window.onmousedown = input.processMouseDown.bind(input);
    window.onmousemove = input.processMouseMove.bind(input);
    window.onmouseup = input.processMouseUp.bind(input);

    //Load empty scene
    loader.load('app.json', function (text) {

        player.load(JSON.parse(text));
        player.setSize(window.innerWidth, window.innerHeight);
        player.play();
        document.body.appendChild(player.dom);
        player.dom.firstChild.id = "cvsDisplay";

        window.addEventListener('resize', function () {

            player.setSize(window.innerWidth, window.innerHeight);

        });

        //Load starter scene
        loader.load('scene.json', function (text) {
            let objloader = new ObjectLoader();
            player.setScene(objloader.parse(JSON.parse(text)));

            //Room
            room = player.scene.children[3];

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
            const materialImage = player.scene.children[2].material;

            flm.onImageUploaded.add((image) => {
                let newbox = new Mesh(
                    new BoxGeometry(),
                    materialImage.clone()
                );
                newbox.userData ??= {};
                newbox.userData.selectable = true;
                player.scene.add(newbox);
                new TextureLoader().load(
                    image.src,
                    (texture) => {
                        newbox.material.aoMap = texture;
                        newbox.material.lightMap = texture;
                        newbox.material.map = texture;
                        newbox.material.needsUpdate = true;
                    }
                );
            });

            switchMode(true);
        });
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

function registerKeyBindings(edit, play) {
    input.clearAllDelegates();

    if (edit) {
        input.key.down.add(controllerEdit.processInput.bind(controllerEdit));
        input.mouse.down.add(controllerEdit.processMouseDown.bind(controllerEdit));
        input.mouse.move.add(controllerEdit.processMouseMove.bind(controllerEdit));
        input.mouse.up.add(controllerEdit.processMouseUp.bind(controllerEdit));

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
    ].flat();
}

function createFloor(width = 11, length = 12, showTriangles = false) {
    //2024-01-07: copied from https://github.com/mrdoob/three.js/blob/master/examples/misc_controls_pointerlock.html

    const vertex = new Vector3();
    const color = new Color();

    // floor

    let floorGeometry = new PlaneGeometry(
        width,
        length,
        Math.ceil(width * 2),
        Math.ceil(length * 2)
    );
    floorGeometry.rotateX( - Math.PI / 2 );

    //color triangles

    let position = floorGeometry.attributes.position;

    if (showTriangles) {
        floorGeometry = floorGeometry.toNonIndexed(); // ensure each face has unique vertices
        position = floorGeometry.attributes.position;
    }

    const colorsFloor = [];

    for ( let i = 0, l = position.count; i < l; i ++ ) {

        let shade = Math.random() * 0.05 +0.5;
        color.setRGB(shade, shade, shade, SRGBColorSpace);
        colorsFloor.push( color.r, color.g, color.b );

    }

    floorGeometry.setAttribute( 'color', new Float32BufferAttribute( colorsFloor, 3 ) );

    //floor material
    const floorMaterial = new MeshBasicMaterial( { vertexColors: true } );

    //floor mesh
    const floor = new Mesh( floorGeometry, floorMaterial );
    return floor;
}
