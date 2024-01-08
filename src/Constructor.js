"use strict";

function construct(house) {
    let scene = new Scene();

    for (let room of house.rooms) {
        constructRoom(room, scene);
    }

    return scene;
}

function constructRoom(room, scene) {
    let floor = createFloor(room.width, room.height);
    scene.add(floor);
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
