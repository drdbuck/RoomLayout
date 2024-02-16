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
        this.selector.onSelectionChanged.add(this.updateCollectiveCenter.bind(this));

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
        this.multiselectButton = event.ctrlKey || event.shiftKey;
        let onlySelectButton = event.altKey;
        this.origMouse = copyObject(this.mouse, mouseDragStringify);
        let targetHit = this.getObjectHitAtMousePos();
        let targetBox = targetHit?.object;
        let target = targetBox?.furniture;
        if (target) {
            let targetFace = targetHit.face.materialIndex;
            if (this.isSelected(target)) {
                if (this.multiselectButton) {
                    let context = this.selector.find(c => c.obj === target);
                    //select face
                    if (uiVars.editFaces && context.face != targetFace) {
                        context.face = targetFace;
                        this.updateFaceSelection();
                        this.runFaceDelegate();
                    }
                    //deselect object
                    else {
                        this.selector.deselect(context);
                    }
                }
                else if (onlySelectButton) {
                    this.selectObject(targetBox, false, targetFace);
                }
            }
            else {
                //select
                let select = this.selectObject(targetBox, this.multiselectButton, targetFace);
                //
                if (!onlySelectButton && !uiVars.editFaces) {
                    //select other objects in group
                    house.rooms[0].groups.forEach(g => {
                        if (g.has(select)) {
                            g.items.forEach(i => {
                                //dont double select
                                if (i == select) { return; }
                                //
                                let box = player.scene.children.find(box => box.furniture == i);
                                this.selectObject(box, true, -2);
                            });
                        }
                    });
                }
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
            //select face
            if (!state.mouse.wasDragged) {
                let targetHit = this.getObjectHitAtMousePos();
                let target = targetHit?.object?.furniture;
                if (target) {
                    if (this.isSelected(target)) {
                        if (uiVars.editFaces) {
                            //determine if face is already selected
                            let targetFace = targetHit.face.materialIndex;
                            let context = this.selector.find(c => c.obj == target);
                            let alreadySelected = context.face == targetFace;
                            if (!alreadySelected) {
                                //deselect other faces
                                if (!this.multiselectButton) {
                                    this.selector.forEach(c => c.face = -2);
                                }
                                //select target face
                                context.face = targetFace;
                                this.updateFaceSelection();
                                this.runFaceDelegate();
                            }
                        }
                    }
                }
            }
            //reset drag variables
            this.mouse.targetY = 0;
            this.clearSelectedOffsets();
        }
    }

    processMouseWheel(state, event) {
        let zoomDelta = state.mouse.wheelDelta * this.wheelMoveSpeed / 100;
        //Camera zoom
        if (state.mouse.lmbDown || event.altKey) {
            this.selector.forEach(c => {
                let furniture = c.obj;
                this.setFurnitureAltitude(furniture, furniture.altitude + zoomDelta);
            });
        }
        //Rotate
        else if (event.shiftKey) {
            let onlyOne = this.selector.count == 1;
            this.selector.forEach(c => {
                //Rotate object
                this.setFurnitureAngle(c.obj, c.obj.angle + zoomDelta);
                //Move around collective center
                if (onlyOne) { return; }
                let f = c.obj;
                let offset = new Vector3(f.position);
                offset.sub(c.collectiveCenter);
                let radians = toRadians(zoomDelta)
                offset.applyAxisAngle(_up, radians);
                offset.add(c.collectiveCenter);
                f.position = offset;
            });
        }
        //Altitude
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

    getObjectHitAtMousePos() {
        return this.getHitAtMousePos(o => o.object.userData.selectable);
    }

    getObjectAtMousePos() {
        return this.getObjectHitAtMousePos()?.object;
    }

    selectObject(box, add, face = -2) {
        //defaults
        if (!box) {
            let hit = this.getObjectHitAtMousePos();
            box = hit?.object;
            face ??= hit?.face.materialIndex;
            if (!box) {
                console.error("no box!", box, "hit", hit);
            }
        }
        add ??= false;
        //
        let select = box?.furniture;
        if (!select) { return undefined; }
        //create select context
        let selectContext = this.createSelectContext(select, box);
        selectContext.face = face;
        //select the context
        this.selector.select(selectContext, add);
        //return the selected furniture
        return select;
    }

    createSelectContext(select, box) {
        return {
            obj: select,
            box: box,
            face: -2,
            offset: _zero.clone(),
        };
    }

    updateCollectiveCenter() {
        const count = this.selector.count;
        if (count <= 0) { return; }
        const avgFunc = (func) => this.selector.map(func).sum() / count;
        let collectiveCenter = new Vector3(
            avgFunc(c => c.obj.position.x),
            avgFunc(c => c.obj.position.y),
            avgFunc(c => c.obj.position.z),
        );
        this.selector.forEach(c => c.collectiveCenter = collectiveCenter);
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
        const min = -1;
        this.selector.forEach(context => {
            //early exit: deselect faces
            if (dir == undefined) {
                context.face = -2;
                return;
            }
            //early exit: no face selected on this object
            if (context.face < min) {
                return;
            }
            //
            const max = context.box.material.length - 1;
            if (context.face >= min) {
                context.face += dir;
                if (context.face > max) {
                    context.face = min;
                }
                if (context.face < min) {
                    context.face = max;
                }
            }
            else if (dir != 0) {
                context.face = min;
            }
        });
        this.updateFaceSelection();
        this.runFaceDelegate();
    }

    updateFaceSelection() {
        this.selector.forEach(c => {
            updateFace(c.box, c.face);
        });
    }

    runFaceDelegate() {
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
