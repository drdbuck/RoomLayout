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
            view.position = this.camera.position;
        }
    }

    processMouseInput(event) {
        //2023-12-21: copied from https://discourse.threejs.org/t/how-can-i-get-the-position-of-mouse-click-point/16864/3
        this.mouse.x = event.clientX / window.innerWidth * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    processMouseDown(state, event) {
        if (!state.mouse.lmbDown) { return; }
        this.processMouseInput(event);
        this.origMouse = copyObject(this.mouse, mouseDragStringify);
        let target = this.getObjectAtMousePos()?.furniture;
        if (target) {
            if (this.isSelected(target)) {
            }
            else {
                //select
                let selected = this.selectObject(event.ctrlKey);
            }
            //prepare for drag
            this.calculateSelectedOffsets();
        }
        else {
            this.selector.clear();
        }
    }

    processMouseMove(state, event) {
        this.processMouseInput(event);
        if (state.mouse.lmbDown) {
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
        if (!state.mouse.lmbDown) {
            this.clearSelectedOffsets();
        }
    }

    processMouseWheel(state, event) {
        let zoomDelta = state.mouse.wheelDelta * this.wheelMoveSpeed / 100;
        if (state.mouse.lmbDown || event.altKey) {
            this.selector.forEach(c => {
                let furniture = c.obj;
                furniture.altitude = Math.clamp(
                    furniture.altitude + zoomDelta,
                    furniture.room.min.y,
                    furniture.room.max.y - furniture.scale.y
                );
            });
        }
        else if (event.shiftKey) {
            this.selector.forEach(c => {
                c.obj.angle += zoomDelta / 10;
            });
        }
        else{
        this.camera.position.y = Math.clamp(
            this.camera.position.y + zoomDelta,
            ZOOM_MIN,
            ZOOM_MAX
        );
        }
    }

    getObjectAtMousePos() {
        //2023-12-21: copied from https://stackoverflow.com/a/30871007/2336212
        this.raycaster.setFromCamera(this.mouse, this.camera);
        let objects = this.raycaster.intersectObjects(this.scene.children);
        return objects.find(o => o.object.userData.selectable)?.object;
    }

    selectObject(add = false) {
        let box = this.getObjectAtMousePos();
        let select = box?.furniture;
        if (select) {
            let selectContext = this.createSelectContext(select, box);
            this.selector.select(selectContext, add);
        }
        return select !== undefined;
    }

    createSelectContext(select, box) {
        return {
            obj: select,
            box: box,
            face: -1,
            offset: _zero.clone(),
        };
    }

    isSelected(obj) {
        return this.selector.some(c => c.obj === obj);
    }

    calculateSelectedOffsets() {
        let mouseWorld = this.getMouseWorld(this.mouse);
        this.selector.forEach(context => {
            let select = context.obj;
            let origPos = new Vector3(select.position);
            let offset = origPos.sub(mouseWorld);
            context.offset.copy(offset);
        });
    }

    clearSelectedOffsets() {
        this.selector.forEach(context => context.offset.copy(_zero));
    }

    selectNextFace() {
        this.selector.forEach(context => {
            if (context.face >= 0) {
            context.face++;
            }
            else {
                context.face = 2;
            }
            if (context.face > context.box.material.length) {
                context.face = 0;
            }
        });
        this.updateFaceSelection();
    }

    updateFaceSelection() {
        this.selector.forEach(c => {
            let box = c.box;
            box.material = [...box.materialList];
            if (c.face >= 0 && c.face < box.material.length) {
                box.material[c.face] = selectMaterial;
            }
        });
    }


    moveObject() {
        let mouseWorld = this.getMouseWorld(this.mouse);
        let pos = new Vector3();
        this.selector.forEach(context => {
            let item = context.obj;
            pos.copy(mouseWorld);
            pos = pos.add(context.offset);
            let min = item.room.min;
            let max = item.room.max;
            pos.x = Math.clamp(pos.x, min.x, max.x);
            pos.z = Math.clamp(pos.z, min.z, max.z);
            item.position = pos;
        });
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
