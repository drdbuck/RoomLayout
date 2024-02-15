"use strict";

const SIDE_FRONT = 0;
const SIDE_LEFT = 1;
const SIDE_BACK = 2;
const SIDE_RIGHT = 3;

//create geometry
const boxGeometry = new BoxGeometry().toNonIndexed();

//Constructs scene objects from data objects

function construct(house) {
    let scene = new Scene();

    for (let room of house.rooms) {
        constructRoom(room, scene);
    }

    return scene;
}

function constructRoom(room, scene) {
    //floor
    let floor = createFloor(room.width, room.length);
    scene.add(floor);
    //walls
    for (let i = 0; i < 4; i++) {
        let length = (i % 2 == 0) ? room.width : room.length;
        let wall = createWall(length, room.height, i);
        if (i % 2 == 0) {
            wall.position.z = room.length / 2 * Math.sign(i - 1.5);
        }
        else {
            wall.position.x = room.width / 2 * Math.sign(i - 1.5);
        }
        scene.add(wall);
    }
    //furniture
    for (let furniture of room.furnitures) {
        let box = constructFurniture(furniture);
        scene.add(box);
    }
}

function createFloor(width = 11, length = 12, showTriangles = false) {
    //2024-01-07: copied from https://github.com/mrdoob/three.js/blob/master/examples/misc_controls_pointerlock.html

    const color = new Color();

    // floor

    let floorGeometry = new PlaneGeometry(
        width,
        length,
        Math.ceil(width * 2),
        Math.ceil(length * 2)
    );
    floorGeometry.rotateX(- Math.PI / 2);

    //color triangles

    let position = floorGeometry.attributes.position;

    if (showTriangles) {
        floorGeometry = floorGeometry.toNonIndexed(); // ensure each face has unique vertices
        position = floorGeometry.attributes.position;
    }

    const colorsFloor = [];

    for (let i = 0, l = position.count; i < l; i++) {

        let shade = Math.random() * 0.05 + 0.5;
        color.setRGB(shade, shade, shade, SRGBColorSpace);
        colorsFloor.push(color.r, color.g, color.b);

    }

    floorGeometry.setAttribute('color', new Float32BufferAttribute(colorsFloor, 3));

    //floor material
    const floorMaterial = new MeshBasicMaterial({ vertexColors: true });

    //floor mesh
    const floor = new Mesh(floorGeometry, floorMaterial);
    floor.layers.set(objectMask);
    return floor;
}

function createWall(length = 11, height = 9, side = 0, showTriangles = false) {
    //2024-01-07: copied from https://github.com/mrdoob/three.js/blob/master/examples/misc_controls_pointerlock.html

    const color = new Color();

    // wall

    let wallGeometry = new PlaneGeometry(
        length,
        height,
        Math.ceil(length * 2),
        Math.ceil(height * 2)
    );
    wallGeometry.rotateY(side * Math.PI / 2);

    //color triangles

    let position = wallGeometry.attributes.position;

    if (showTriangles) {
        wallGeometry = wallGeometry.toNonIndexed(); // ensure each face has unique vertices
        position = wallGeometry.attributes.position;
    }

    const colorsWall = [];

    for (let i = 0, l = position.count; i < l; i++) {

        let shade = Math.random() * 0.05 + 0.7;
        color.setRGB(shade, shade, shade, SRGBColorSpace);
        colorsWall.push(color.r, color.g, color.b);

    }

    wallGeometry.setAttribute('color', new Float32BufferAttribute(colorsWall, 3));

    //wall material
    const wallMaterial = new MeshBasicMaterial({ vertexColors: true });

    //wall mesh
    const wall = new Mesh(wallGeometry, wallMaterial);
    wall.layers.set(objectMask);
    wall.position.y = height / 2;
    return wall;
}

function constructFurniture(furniture) {
    //2024-01-09: copied from https://github.com/mrdoob/three.js/blob/master/examples/misc_controls_pointerlock.html

    //create material
    const boxMaterials = createMaterials(furniture.faceList, 6, furniture.defaultFace);

    //create mesh
    const box = new Mesh(boxGeometry, boxMaterials);
    box.layers.set(objectMask);

    box.userData ??= {};
    box.userData.selectable = true;

    box.furniture = furniture;

    //update functions
    let updatePosition = (pos = furniture.position) => {
        box.position.copy(pos);
        //essentially make the anchor point of data furniture object to be bottom center,
        //while the 3D object's anchor point is still true center
        box.position.y += box.scale.y / 2;
    };
    let updateScale = (scale) => {
        box.scale.copy(scale);
        updatePosition();
    };
    let updateAngle = (angle = 0) => {
        box.rotation.y = MathUtils.degToRad(angle);
    }

    updatePosition(furniture.position);
    updateScale(furniture.scale);
    updateAngle(furniture.angle);

    //delegates
    furniture.onSizeChanged.add(updateScale);
    furniture.onPositionChanged.add(updatePosition);
    furniture.onAngleChanged.add(updateAngle);

    //edge highlights
    let edge = createEdgeHighlights(box);
    box.edge = edge;
    box.attach(edge);
    edge.visible = false;

    //select highlights
    let select = createSelectHighlights(box);
    box.select = select;
    box.attach(select);
    select.visible = false;

    return box;
}

function createEdgeHighlights(mesh) {
    //2024-01-16: copied from https://discourse.threejs.org/t/highlighting-the-edge-of-a-cube-on-hover-linesegmentsgeometry/28480
    const edgesGeometry = new EdgesGeometry(mesh.geometry, 40);

    const line = new LineSegments(edgesGeometry, edgeMaterial);
    line.layers.set(effectMask);

    line.position.copy(mesh.position);
    line.scale.copy(mesh.scale);
    line.rotation.copy(mesh.rotation);

    return line;
}

function createSelectHighlights(mesh) {
    //2024-01-16: copied from https://discourse.threejs.org/t/highlighting-the-edge-of-a-cube-on-hover-linesegmentsgeometry/28480

    const select = new Mesh(mesh.geometry, []);
    select.renderOrder = 998;
    select.layers.set(effectMask);

    select.position.copy(mesh.position);
    select.scale.copy(mesh.scale);
    select.rotation.copy(mesh.rotation);

    return select;
}
