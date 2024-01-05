"use strict";

const mouseDragStringify = [
    "x",
    "y",
];

class Controller {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;
        this.speed = 1;
        this.mouse = {};
        this.raycaster = new Raycaster();
        
        this.save = {
            quaternion: new Quaternion(-0.7,0,0,0.7),
            position: new Vector3(0,10,0),
        };
    }

    processInput(state, event) {
        let moveCamera = false;
        switch (event.keyCode) {
            case 87://W key
            case 38://Up Arrow
                this.camera.position.z -= this.speed;
                moveCamera = true;
                break;
            case 65://A key
            case 37://Left Arrow
                this.camera.position.x -= this.speed;
                moveCamera = true;
                break;
            case 83://S key
            case 40://Up Arrow
                this.camera.position.z += this.speed;
                moveCamera = true;
                break;
            case 68://D key
            case 39://Right Arrow
                this.camera.position.x += this.speed;
                moveCamera = true;
                break;
            default: break;
        }
        //if move the camera,
        if (moveCamera) {
            //save position
            this.save.position.copy(this.camera.position);
            //interrupt mouse action
            if (this.select) {
                this.mouse.down = false;
            }
        }
    }

    processMouseInput(event) {
        //2023-12-21: copied from https://discourse.threejs.org/t/how-can-i-get-the-position-of-mouse-click-point/16864/3
        this.mouse.x = event.clientX / window.innerWidth * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    processMouseDown(state, event) {
        this.processMouseInput(event);
        this.mouse.down = true;
        this.origMouse = copyObject(this.mouse, mouseDragStringify);
        this.selectObject();
    }

    processMouseMove(state, event) {
        this.processMouseInput(event);
        if (this.mouse.down) {
            if (this.select) {
                this.moveObject();
            }
        }
        else {
            this.mouse.over = this.getObjectAtMousePos();
            if (this.mouse.over) {
                this.changeCursor("move");
            }
            else {
                this.changeCursor("auto");
            }
        }
    }

    processMouseUp(state, event) {
        this.mouse.down = false;
        this.select = undefined;
    }

    getObjectAtMousePos() {
        //2023-12-21: copied from https://stackoverflow.com/a/30871007/2336212
        this.raycaster.setFromCamera(this.mouse, this.camera);
        let objects = this.raycaster.intersectObjects(this.scene.children);
        return objects.find(o => o.object.userData.selectable)?.object;
    }

    selectObject() {
        this.select = this.getObjectAtMousePos();
        if (this.select) {
            this.origPos = new Vector3(this.select.position);
            this.selectOffset = this.origPos.sub(this.getMouseWorld(this.mouse));
        }
    }

    moveObject() {
        let mouseWorld = this.getMouseWorld(this.mouse);
        this.select.position.copy(mouseWorld.add(this.selectOffset));
    }

    getMouseWorld(mouse) {
        //2023-12-21: copied from https://stackoverflow.com/a/13091694/2336212
        var vec = new Vector3();
        var pos = new Vector3();

        vec.set(
            mouse.x,
            mouse.y,
            0.5,
        );

        vec.unproject(this.camera);

        vec.sub(this.camera.position).normalize();

        var distance = - this.camera.position.y / vec.y;

        vec = vec.multiplyScalar(distance);

        pos.copy(this.camera.position).add(vec);

        return pos;
    }

    changeCursor(cursorStyle) {
        $("cvsDisplay").style.cursor = cursorStyle;
    }
}
