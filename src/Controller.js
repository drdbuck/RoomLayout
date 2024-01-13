"use strict";

const mouseDragStringify = [
    "x",
    "y",
];

const ZOOM_MIN = 2;
const ZOOM_MAX = 100;

class Controller {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;
        this.speed = 1;
        this.wheelMoveSpeed = 1;
        this.mouse = {};
        this.raycaster = new Raycaster();

        this.selector = new Selector();

        this.save = {
            quaternion: new Quaternion(-0.7, 0, 0, 0.7),
            position: new Vector3(0, 10, 0),
        };
    }

    activate(active) {
        //do nothing
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
            if (this.selector.count > 0) {
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
    }

    processMouseWheel(state, event) {
        let zoomDelta = state.mouse.wheelDelta * this.wheelMoveSpeed / 100;
        this.camera.position.y = Math.clamp(
            this.camera.position.y + zoomDelta,
            ZOOM_MIN,
            ZOOM_MAX
        );
    }

    getObjectAtMousePos() {
        //2023-12-21: copied from https://stackoverflow.com/a/30871007/2336212
        this.raycaster.setFromCamera(this.mouse, this.camera);
        let objects = this.raycaster.intersectObjects(this.scene.children);
        return objects.find(o => o.object.userData.selectable)?.object;
    }

    selectObject() {
        let select = this.getObjectAtMousePos()?.furniture;
        if (select) {
            let origPos = new Vector3(select.position);
            this.selectOffset = origPos.sub(this.getMouseWorld(this.mouse));
            this.selector.selectOnly(select);
        }
    }

    moveObject() {
        let mouseWorld = this.getMouseWorld(this.mouse);
        let pos = mouseWorld.add(this.selectOffset);
        this.selector.forEach(item => item.position = pos);
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
