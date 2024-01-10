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

function constructFurniture(furniture) {
    //2024-01-09: copied from https://github.com/mrdoob/three.js/blob/master/examples/misc_controls_pointerlock.html
    const boxGeometry = new THREE.BoxGeometry( 20, 20, 20 ).toNonIndexed();

				position = boxGeometry.attributes.position;
				const colorsBox = [];

				for ( let i = 0, l = position.count; i < l; i ++ ) {

					color.setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75, THREE.SRGBColorSpace );
					colorsBox.push( color.r, color.g, color.b );

				}

				boxGeometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colorsBox, 3 ) );

				for ( let i = 0; i < 500; i ++ ) {

					const boxMaterial = new THREE.MeshPhongMaterial( { specular: 0xffffff, flatShading: true, vertexColors: true } );
					boxMaterial.color.setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75, THREE.SRGBColorSpace );

					const box = new THREE.Mesh( boxGeometry, boxMaterial );
					box.position.x = Math.floor( Math.random() * 20 - 10 ) * 20;
					box.position.y = Math.floor( Math.random() * 20 ) * 20 + 10;
					box.position.z = Math.floor( Math.random() * 20 - 10 ) * 20;

					scene.add( box );
					objects.push( box );

				}
}
