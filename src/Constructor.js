"use strict";

const SIDE_FRONT = 0;
const SIDE_LEFT = 1;
const SIDE_BACK = 2;
const SIDE_RIGHT = 3;

//create geometry
const meshGeometry = new BoxGeometry().toNonIndexed();
//2024-05-21: copied from https://stackoverflow.com/a/78485870/2336212
const wireFrameMaterial = new MeshBasicMaterial({ color: "#8ce8ff", wireframe: true });

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
    //box
    const _boxFunc = (box) => {
        let mesh = constructBox(box);
        scene.add(mesh);
    };
    const boxFunc = (box) => {
        if (box.isKitBash) {
            let bounds = constructKitBash(box);
            scene.add(bounds);
            box.items.forEach(_boxFunc);
        }
        else {
            _boxFunc(box);
        }
    };
    room.furnitures.forEach(boxFunc);
    room.onFurnitureAdded.add(boxFunc);

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
    };
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

    //type
    floor.planeType = "floor";

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
    ceilGeometry.rotateX(Math.PI / 2);

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

    //type
    ceil.planeType = "ceiling";

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

    //type
    wall.planeType = "wall";

    return wall;
}

function constructKitBash(kitbash) {

    let hasItems = kitbash.count > 0;

    //create mesh
    const mesh = new Mesh(meshGeometry, createMaterial((hasItems) ? PIXEL_TRANSPARENT : kitbash.defaultFace));
    mesh.layers.set(objectMask);

    mesh.userData ??= {};
    mesh.userData.selectable = true;

    mesh.box = kitbash;
    mesh.kitbash = kitbash;

    //update functions
    let updatePosition = (pos) => {
        mesh.position.copy(pos);
        mesh.position.y += mesh.scale.y / 2;
    };
    let updateScale = (scale) => {
        mesh.scale.copy(scale);
        //need to make it small but nonzero so it can be detected by raycast
        let minFunc = (dim) => Math.max(dim, 0.0001);
        mesh.scale.x = minFunc(mesh.scale.x);
        mesh.scale.y = minFunc(mesh.scale.y);
        mesh.scale.z = minFunc(mesh.scale.z);
    };
    let updateRotation = (angle = 0) => {
        //rotate to default
        mesh.rotation.x = 0;
        mesh.rotation.y = 0;
        mesh.rotation.z = 0;

        //angle
        let radAngle = MathUtils.degToRad(angle);
        let axisAngle = new Vector3(0, 1, 0);
        mesh.rotateOnAxis(axisAngle, radAngle);
    };
    let updateFace = (hasItemsNow) => {
        if (hasItems != hasItemsNow) {
            hasItems = hasItemsNow;
            mesh.material = createMaterial((hasItems) ? PIXEL_TRANSPARENT : kitbash.defaultFace);
            mesh.visible = !hasItems || uiVars.selector.find(c => c.obj == kitbash);
        }
    }


    //inside faces
    // let insideMesh = createInsideFaces(mesh, kitbash);
    // mesh.attach(insideMesh);
    // mesh.insideMesh = insideMesh;
    // insideMesh.position.copy(_zero);

    //delegates
    kitbash.onSizeChanged.add(() => {
        updateScale(kitbash.scale);
        updatePosition(kitbash.position);
    });
    kitbash.onPositionChanged.add(() => updatePosition(kitbash.position));
    kitbash.onAngleChanged.add(() => {
        updateRotation(kitbash.angle);
        updatePosition(kitbash.position);
    });
    kitbash.onItemAdded.add(() => updateFace(kitbash.count > 0));
    kitbash.onItemRemoved.add(() => updateFace(kitbash.count > 0));

    //edge highlights
    let edge = createEdgeHighlights(mesh);
    mesh.edge = edge;
    mesh.attach(edge);
    edge.visible = false;
    edge.position.copy(_zero);

    //init with update functions
    updateScale(kitbash.scale);
    updateRotation(kitbash.angle);
    updatePosition(kitbash.position);

    return mesh;
}

function constructBox(box) {
    //2024-01-09: copied from https://github.com/mrdoob/three.js/blob/master/examples/misc_controls_pointerlock.html

    //create geometry
    const boxGeometry = createGeometry(box);

    //create material
    const meshMaterials = createMaterials(box.faceList, 6, box.defaultFace);

    //create mesh
    const mesh = new Mesh(boxGeometry, meshMaterials);
    mesh.layers.set(objectMask);

    mesh.userData ??= {};
    mesh.userData.selectable = true;

    mesh.box = box;

    //holder
    //essentially make the anchor point of data box object to be bottom center,
    //while the 3D object's anchor point is still true center
    const holder = new Group();
    holder.layers.set(effectMask);
    holder.scale.copy(_one);
    holder.position.copy(mesh.position);
    holder.attach(mesh);

    //update functions
    let updatePosition = (pos) => {
        holder.position.copy(pos);
    };
    let updateScale = (scale) => {
        holder.scale.copy(scale);
        //need to make it small but nonzero so it can be detected by raycast
        let minFunc = (dim) => Math.max(dim, 0.0001);
        holder.scale.x = 1; //minFunc(holder.scale.x);
        holder.scale.y = 1; //minFunc(holder.scale.y);
        holder.scale.z = 1; //minFunc(holder.scale.z);
        let newgeom = createGeometry(box);
        mesh.geometry.setAttribute('position', newgeom.attributes.position);
        mesh.geometry.setAttribute('uv', newgeom.attributes.uv);
        let newselect = createSelectHighlights(mesh);
        mesh.select.geometry.setAttribute('position', newselect.geometry.attributes.position);
        let newedge = createEdgeHighlights(mesh);
        mesh.edge.geometry.setAttribute('position', newedge.geometry.attributes.position);
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
    };


    //inside faces
    // let insideMesh = createInsideFaces(mesh, box);
    // mesh.attach(insideMesh);
    // mesh.insideMesh = insideMesh;
    // insideMesh.position.copy(_zero);

    //delegates
    box.onSizeChanged.add(() => {
        updateScale(box.worldScale);
        updatePosition(box.worldPosition);
    });
    box.onScaleTopChanged.add(() => {
        updateScale(box.worldScale);
    });
    box.onPositionTopChanged.add(() => {
        updateScale(box.worldScale);
    });
    box.onPositionChanged.add(() => updatePosition(box.worldPosition));
    box.onAngleChanged.add(() => {
        updateRotation(box.worldAngle, box.recline);
        updatePosition(box.worldPosition);
    });
    box.onReclineChanged.add(() => updateRotation(box.worldAngle, box.recline));
    box.onFaceChanged.add((index, url) => {
        let material = createMaterial(url ?? box.defaultFace);
        let materialBack = createMaterial(url ?? box.defaultFace, false);
        let insideMaterials = mesh.insideMesh.material;
        //Set all faces with the default face
        if (index == FACE_DEFAULT) {
            for (let i = 0; i < meshMaterials.length; i++) {
                if (!box.getFace(i)) {
                    meshMaterials[i] = material;
                    insideMaterials[i] = materialBack;
                }
            }
        }
        //Set just the one face that was changed
        else {
            meshMaterials[index] = material;
            insideMaterials[index] = materialBack;
        }
    });

    //edge highlights
    let edge = createEdgeHighlights(mesh);
    mesh.edge = edge;
    mesh.attach(edge);
    edge.visible = false;
    edge.position.copy(_zero);

    //select highlights
    let select = createSelectHighlights(mesh);
    mesh.select = select;
    mesh.attach(select);
    select.visible = false;
    select.position.copy(_zero);

    //init with update functions
    updatePosition(box.worldPosition);
    updateScale(box.worldScale);
    updateRotation(box.worldAngle, box.recline);

    return holder;
}

function createGeometry(box) {

    //create geometry
    let bufferGeometry = new BufferGeometry();

    //create base points
    const width = box.width;
    const depth = box.depth;
    const w2 = width / 2;
    const d2 = depth / 2;
    let v0 = new Vector3(-w2, 0, -d2);
    let v1 = new Vector3(w2, 0, -d2);
    let v2 = new Vector3(w2, 0, d2);
    let v3 = new Vector3(-w2, 0, d2);
    //create top points
    const posTop = box.positionTop;
    const height = box.height;
    const widthTop = box.widthTop;
    const depthTop = box.depthTop;
    const wt2 = widthTop / 2;
    const dt2 = depthTop / 2;
    let v4 = new Vector3(-wt2, height, -dt2).add(posTop);
    let v5 = new Vector3(wt2, height, -dt2).add(posTop);
    let v6 = new Vector3(wt2, height, dt2).add(posTop);
    let v7 = new Vector3(-wt2, height, dt2).add(posTop);
    // points
    let points = [
        v0, v1, v2, v3,
        v4, v5, v6, v7,
    ];

    //vertices
    const vertices = new Float32Array(
        points
            .map(p => [p.x, p.y, p.z])
            .flat(Infinity)
    );

    //indices
    const indices = new Uint32Array([

        //right
        0, 3, 7,
        7, 4, 0,

        //left
        2, 1, 5,
        5, 6, 2,

        //top
        7, 6, 5,
        5, 4, 7,

        //bottom
        0, 1, 2,
        2, 3, 0,

        //back
        1, 0, 4,
        4, 5, 1,

        //front
        3, 2, 6,
        6, 7, 3,

    ]);

    //width uv constants
    const widthOffset = posTop.x;
    const maxWidth = Math.max(width, w2 + wt2 + Math.abs(widthOffset));
    const widthDiffLeft = w2 - wt2 + widthOffset;
    const widthDiffRight = width - (w2 + wt2 + widthOffset);

    //depth uv constants
    const depthOffset = posTop.z;
    const maxDepth = Math.max(depth, d2 + dt2 + Math.abs(depthOffset));
    const depthDiffLeft = d2 - dt2 + depthOffset;
    const depthDiffRight = depth - (d2 + dt2 + depthOffset);

    //uv
    const uvs = new Float32Array([

        //right
        Math.max(0, (0 - depthDiffLeft) / maxDepth), 0,//BL
        Math.min(1, (maxDepth + depthDiffRight) / maxDepth), 0,//BR
        Math.min(1, (maxDepth - depthDiffRight) / maxDepth), 1,//TR
        Math.min(1, (maxDepth - depthDiffRight) / maxDepth), 1,//TR
        Math.max(0, (0 + depthDiffLeft) / maxDepth), 1,//TL
        Math.max(0, (0 - depthDiffLeft) / maxDepth), 0,//BL

        //left
        Math.max(0, (0 - depthDiffRight) / maxDepth), 0,//BL
        Math.min(1, (maxDepth + depthDiffLeft) / maxDepth), 0,//BR
        Math.min(1, (maxDepth - depthDiffLeft) / maxDepth), 1,//TR
        Math.min(1, (maxDepth - depthDiffLeft) / maxDepth), 1,//TR
        Math.max(0, (0 + depthDiffRight) / maxDepth), 1,//TL
        Math.max(0, (0 - depthDiffRight) / maxDepth), 0,//BL

        //top
        0, 0,
        1, 0,
        1, 1,
        1, 1,
        0, 1,
        0, 0,

        //bottom
        0, 0,
        1, 0,
        1, 1,
        1, 1,
        0, 1,
        0, 0,

        //back
        Math.max(0, (0 - widthDiffRight) / maxWidth), 0,//BL
        Math.min(1, (maxWidth + widthDiffLeft) / maxWidth), 0,//BR
        Math.min(1, (maxWidth - widthDiffLeft) / maxWidth), 1,//TR
        Math.min(1, (maxWidth - widthDiffLeft) / maxWidth), 1,//TR
        Math.max(0, (0 + widthDiffRight) / maxWidth), 1,//TL
        Math.max(0, (0 - widthDiffRight) / maxWidth), 0,//BL

        //front
        Math.max(0, (0 - widthDiffLeft) / maxWidth), 0,//BL
        Math.min(1, (maxWidth + widthDiffRight) / maxWidth), 0,//BR
        Math.min(1, (maxWidth - widthDiffRight) / maxWidth), 1,//TR
        Math.min(1, (maxWidth - widthDiffRight) / maxWidth), 1,//TR
        Math.max(0, (0 + widthDiffLeft) / maxWidth), 1,//TL
        Math.max(0, (0 - widthDiffLeft) / maxWidth), 0,//BL

    ]);

    //compile it together
    bufferGeometry.setIndex(new BufferAttribute(indices, 1));
    bufferGeometry.setAttribute('position', new BufferAttribute(vertices, 3));
    
    const sideCount = 6;//dirty: assumes 6 sides
    for (let i = 0; i < sideCount; i++){
        bufferGeometry.addGroup(i * sideCount, sideCount, i);
    }
    bufferGeometry.attributes.position.needsUpdate = true;

    bufferGeometry = bufferGeometry.toNonIndexed();

    bufferGeometry.setAttribute('uv', new BufferAttribute(uvs, 2));
    bufferGeometry.attributes.uv.needsUpdate = true;

    //return
    return bufferGeometry;
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

function createInsideFaces(mesh, box) {
    //dirty: assumes a cube

    const meshMaterials = createMaterials(box.faceList, 6, box.defaultFace, false);

    //create mesh
    const insideMesh = new Mesh(meshGeometry, meshMaterials);
    insideMesh.layers.set(effectMask);

    insideMesh.position.copy(mesh.position);
    insideMesh.scale.copy(mesh.scale);
    insideMesh.rotation.copy(mesh.rotation);

    return insideMesh;
}
