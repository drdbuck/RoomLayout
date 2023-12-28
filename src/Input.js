"use strict";

class Input {
    constructor(camera, scene) {
        this.mouse = {
            state: {},
            down: new Delegate(),
            hold: new Delegate(),
            up: new Delegate(),
        };
        this.key = {
            down: new Delegate(),
            hold: new Delegate(),
            up: new Delegate(),
        };
    }

    processInput(event) {
        this.key.down.run(event);
    }

    processMouseInput(event) {
        //2023-12-21: copied from https://discourse.threejs.org/t/how-can-i-get-the-position-of-mouse-click-point/16864/3
        this.mouse.state.x = event.clientX / window.innerWidth * 2 - 1;
        this.mouse.state.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    processMouseDown(event) {
        this.processMouseInput(event);
        this.mouse.state.down = true;
        this.origMouse = copy(this.mouse.state);
        this.selectObject();
    }

    processMouseMove(event) {
        this.processMouseInput(event);
        if (this.mouse.state.down) {
            // console.log("mouse", this.mouse.state);
            if (this.select) {
                this.moveObject();
            }
        }
        else {
            this.mouse.state.over = this.getObjectAtMousePos();
            if (this.mouse.state.over) {
                this.changeCursor("move");
            }
            else {
                this.changeCursor("auto");
            }
        }
    }

    processMouseUp(event) {
        this.mouse.state.down = false;
        this.select = undefined;
    }

    getObjectAtMousePos() {
        //2023-12-21: copied from https://stackoverflow.com/a/30871007/2336212
        this.raycaster.setFromCamera(this.mouse.state, this.camera);
        let objects = this.raycaster.intersectObjects(this.scene.children);
        return objects.find(o => o.object.userData.selectable)?.object;
    }

    selectObject() {
        this.select = this.getObjectAtMousePos();
        if (this.select) {
            this.origPos = new Vector3(this.select.position);
            this.selectOffset = this.origPos.sub(this.getMouseWorld(this.mouse.state));
        }
    }

    moveObject() {
        let mouseWorld = this.getMouseWorld(this.mouse.state);
        this.select.position.copy(mouseWorld.add(this.selectOffset));
    }

    getMouseWorld(mouse) {
        //2023-12-21: copied from https://stackoverflow.com/a/13091694/2336212
        var vec = new Vector3();
        var pos = new Vector3();

        vec.set(
            mouse.state.x,
            mouse.state.y,
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