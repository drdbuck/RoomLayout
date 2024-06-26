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
    //ceil
    let ceil = createCeiling(room.width, room.length, room.height);
    scene.add(ceil);
    //walls
    let walls = [];
    for (let i = 0; i < 4; i++) {
        let length = (i % 2 == 0) ? room.width : room.length;
        let wall = createWall(length, room.height, i);
        walls.push(wall);
        scene.add(wall);
    }
    //furniture
    const _furnitureFunc = (furniture) => {
        let box = constructFurniture(furniture);
        scene.add(box);
    };
    const furnitureFunc = (furniture) => {
        if (furniture.isKitBash) {
            furniture.items.forEach(_furnitureFunc);
        }
        else {
            _furnitureFunc(furniture);
        }
    };
    room.furnitures.forEach(furnitureFunc);
    room.onFurnitureAdded.add(furnitureFunc);

    //delegates
    let updateSize = (size) => {
        //floor
        floor.scale.x = size.x;
        floor.scale.z = size.z;
        //ceil
        ceil.scale.x = size.x;
        ceil.scale.z = size.z;
        //walls
        walls.forEach((wall, i) => {
            if (i % 2 == 0) {
                wall.position.z = size.z / 2 * Math.sign(i - 1.5);
                wall.scale.x = size.x;
            }
            else {
                wall.position.x = size.x / 2 * Math.sign(i - 1.5);
                wall.scale.z = size.z;
            }
            wall.position.y = size.y / 2;
            wall.scale.y = size.y;
        });
    }
    room.onSizeChanged.add(updateSize);
    updateSize(room.scale);
}

function createFloor(width = 11, length = 12, showTriangles = false) {
    //2024-01-07: copied from https://github.com/mrdoob/three.js/blob/master/examples/misc_controls_pointerlock.html

    const color = new Color();

    // floor

    let floorGeometry = new PlaneGeometry(
        1,
        1,
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

    //position
    floor.position.y = -0.001;//needed to prevent artifacts with backs of faces on floor

    return floor;
}
function createCeiling(width = 11, length = 12, height = 9, showTriangles = false) {
    //2024-01-07: copied from https://github.com/mrdoob/three.js/blob/master/examples/misc_controls_pointerlock.html

    const color = new Color();

    // ceil

    let ceilGeometry = new PlaneGeometry(
        1,
        1,
        Math.ceil(width * 2),
        Math.ceil(length * 2)
    );
    ceilGeometry.rotateX( Math.PI / 2);

    //color triangles

    let position = ceilGeometry.attributes.position;

    if (showTriangles) {
        ceilGeometry = ceilGeometry.toNonIndexed(); // ensure each face has unique vertices
        position = ceilGeometry.attributes.position;
    }

    const colorsCeil = [];

    for (let i = 0, l = position.count; i < l; i++) {

        let shade = Math.random() * 0.05 + 0.5;
        color.setRGB(shade, shade, shade, SRGBColorSpace);
        colorsCeil.push(color.r, color.g, color.b);

    }

    ceilGeometry.setAttribute('color', new Float32BufferAttribute(colorsCeil, 3));

    //ceil material
    const ceilMaterial = new MeshBasicMaterial({ vertexColors: true });

    //ceil mesh
    const ceil = new Mesh(ceilGeometry, ceilMaterial);
    ceil.layers.set(objectMask);

    //position
    ceil.position.y = height
        + 0.001;//needed to prevent artifacts with backs of faces on ceil

    return ceil;
}

function createWall(length = 11, height = 9, side = 0, showTriangles = false) {
    //2024-01-07: copied from https://github.com/mrdoob/three.js/blob/master/examples/misc_controls_pointerlock.html

    const color = new Color();

    // wall

    let wallGeometry = new PlaneGeometry(
        1,
        1,
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

    //holder
    //essentially make the anchor point of data furniture object to be bottom center,
    //while the 3D object's anchor point is still true center
    const holder = new Group();
    holder.layers.set(effectMask);
    holder.scale.copy(_one);
    holder.position.copy(box.position);
    holder.position.y = box.position.y - (box.scale.y/2);
    holder.attach(box);

    //update functions
    let updatePosition = (pos = furniture.position) => {
        holder.position.copy(pos);
    };
    let updateScale = (scale) => {
        holder.scale.copy(scale);
        //need to make it small but nonzero so it can be detected by raycast
        let minFunc = (dim) => Math.max(dim, 0.0001);
        holder.scale.x = minFunc(holder.scale.x);
        holder.scale.y = minFunc(holder.scale.y);
        holder.scale.z = minFunc(holder.scale.z);
        //
        // updatePosition();
    };
    let updateRotation = (angle = 0, recline = 0) => {
        //rotate to default
        holder.rotation.x = 0;
        holder.rotation.y = 0;
        holder.rotation.z = 0;

        //angle
        let radAngle = MathUtils.degToRad(angle);
        let axisAngle = new Vector3(0, 1, 0);
        holder.rotateOnAxis(axisAngle, radAngle);

        //recline
        let radRecline = -MathUtils.degToRad(recline);
        let axisRecline = new Vector3(1, 0, 0);
        holder.rotateOnAxis(axisRecline, radRecline);

        //
        // updatePosition();
    }


    //inside faces
    let insideMesh = createInsideFaces(box, furniture);
    box.attach(insideMesh);
    box.insideMesh = insideMesh;
    insideMesh.position.copy(_zero);

    //delegates
    furniture.onSizeChanged.add(updateScale);
    furniture.onPositionChanged.add(updatePosition);
    furniture.onAngleChanged.add(() => updateRotation(furniture.angle, furniture.recline));
    furniture.onReclineChanged.add(() => updateRotation(furniture.angle, furniture.recline));
    furniture.onFaceChanged.add((index, url) => {
        let material = createMaterial(url ?? furniture.defaultFace);
        let materialBack = createMaterial(url ?? furniture.defaultFace, false);
        let insideMaterials = box.insideMesh.material;
        //Set all faces with the default face
        if (index == FACE_DEFAULT) {
            for (let i = 0; i < boxMaterials.length; i++) {
                if (!furniture.getFace(i)) {
                    boxMaterials[i] = material;
                    insideMaterials[i] = materialBack;
                }
            }
        }
        //Set just the one face that was changed
        else {
            boxMaterials[index] = material;
            insideMaterials[index] = materialBack;
        }
    });

    //edge highlights
    let edge = createEdgeHighlights(box);
    box.edge = edge;
    box.attach(edge);
    edge.visible = false;
    edge.position.copy(_zero);

    //select highlights
    let select = createSelectHighlights(box);
    box.select = select;
    box.attach(select);
    select.visible = false;
    select.position.copy(_zero);

    //init with update functions
    updatePosition(furniture.position);
    updateScale(furniture.scale);
    updateRotation(furniture.angle, furniture.recline);

    return holder;
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

function createInsideFaces(mesh, furniture) {
    //dirty: assumes a cube

    const boxMaterials = createMaterials(furniture.faceList, 6, furniture.defaultFace, false);

    //create mesh
    const box = new Mesh(boxGeometry, boxMaterials);
    box.layers.set(effectMask);

    box.position.copy(mesh.position);
    box.scale.copy(mesh.scale);
    box.rotation.copy(mesh.rotation);

    return box;
}
