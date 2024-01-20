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
        this.mouse = {
            targetY: 0,
        };
        this.raycaster = new Raycaster();
        this.raycaster.layers.set(objectMask);

        this.selector = new Selector();

        this.onFaceSelectionChanged = new Delegate("faces");
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
            case 46://DEL key
                let delList = this.selector.selection;
                this.selector.clear();
                delList.forEach(c => {
                    let f = c.obj;
                    f.room.removeFurniture(f);
                    let box = c.box;
                    box.parent.remove(box);
                })
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
        let multiselectButton = event.ctrlKey || event.shiftKey;
        this.origMouse = copyObject(this.mouse, mouseDragStringify);
        let target = this.getObjectAtMousePos()?.furniture;
        if (target) {
            if (this.isSelected(target)) {
                if (multiselectButton) {
                    let context = this.selector.find(c => c.obj === target);
                    this.selector.deselect(context);
                }
            }
            else {
                //select
                let selected = this.selectObject(multiselectButton);
            }
            //prepare for drag
            let hit = this.getHitAtMousePos();
            this.mouse.targetY = hit?.point.y ?? 0;
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
            this.mouse.targetY = 0;
            this.clearSelectedOffsets();
        }
    }

    processMouseWheel(state, event) {
        let zoomDelta = state.mouse.wheelDelta * this.wheelMoveSpeed / 100;
        if (state.mouse.lmbDown || event.altKey) {
            this.selector.forEach(c => {
                let furniture = c.obj;
                this.setFurnitureAltitude(furniture, furniture.altitude + zoomDelta);
            });
        }
        else if (event.shiftKey) {
            this.selector.forEach(c => {
                this.setFurnitureAngle(c.obj, c.obj.angle + zoomDelta / 10);
            });
        }
        else {
            this.camera.position.y = Math.clamp(
                this.camera.position.y + zoomDelta,
                ZOOM_MIN,
                ZOOM_MAX
            );
        }
    }

    getHitAtMousePos(findFunc = (rch) => true) {
        //2023-12-21: copied from https://stackoverflow.com/a/30871007/2336212
        this.raycaster.setFromCamera(this.mouse, this.camera);
        let objects = this.raycaster.intersectObjects(this.scene.children);
        return objects.find(findFunc);
    }

    getObjectAtMousePos() {
        return this.getHitAtMousePos(o => o.object.userData.selectable)?.object;
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
            face: -2,
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

    selectNextFace(dir) {
        this.selector.forEach(context => {
            if (!dir) {
                context.face = -1;
                return;
            }
            //
            if (context.face >= 0) {
                context.face += dir;
            }
            else {
                context.face = 2;
            }
            const min = 0;
            const max = context.box.material.length - 1;
            if (context.face > max) {
                context.face = min;
            }
            if (context.face < min) {
                context.face = max;
            }
        });
        this.updateFaceSelection();
    }

    updateFaceSelection() {
        this.selector.forEach(c => {
            updateFace(c.box, c.face);
        });
        this.onFaceSelectionChanged.run(this.selector.map(c => c.face));
    }


    moveObject() {
        let mouseWorld = this.getMouseWorld(this.mouse);
        let pos = new Vector3();
        this.selector.forEach(context => {
            let item = context.obj;
            pos.copy(mouseWorld);
            pos = pos.add(context.offset);
            this.setFurniturePosition(item, pos);
        });
    }

    setFurniturePosition(furniture, position) {
            let min = furniture.room.min;
            let max = furniture.room.max;
            position.x = Math.clamp(position.x, min.x, max.x);
            position.z = Math.clamp(position.z, min.z, max.z);
            // position.z = -Math.clamp(position.z, min.z, max.z);
            furniture.position = position;
    }

    setFurnitureAltitude(furniture, altitude) {
        furniture.altitude = Math.clamp(
            altitude,
            furniture.room.min.y,
            furniture.room.max.y - furniture.height
        );
    }

    setFurnitureAngle(furniture, angle) {
        furniture.angle = angle;
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

        var distance = (mouse.targetY - this.camera.position.y) / vec.y;

        vec = vec.multiplyScalar(distance);

        pos.copy(this.camera.position).add(vec);

        return pos;
    }

    changeCursor(cursorStyle) {
        $("cvsDisplay").style.cursor = cursorStyle;
    }
}
