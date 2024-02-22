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
        if (event.ctrlKey) {
            switch (event.keyCode) {
                //D key
                case 68:
                    duplicateFurniture();
                    event.preventDefault();
                    break;
            }
            return;
        }
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
                    c.boxes.forEach(box => box.parent.remove(box));
                });
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
            let context = this.getSelectContext(target);
            if (context) {
                if (this.multiselectButton) {
                    //select face
                    if (uiVars.editFaces && context.face != targetFace) {
                        context.face = targetFace;
                        this.updateFaceSelection();
                        this.runFaceDelegate();
                    }
                    //deselect object
                    else {
                        this.deselectObject(target, !onlySelectButton);
                        //check if there's no other face selected now
                        if (uiVars.editFaces) {
                            if (!this.selector.some(c => c.furniture.validFaceIndex(c.face))) {
                                let stayInFaceEditModeWhenDeselectLastFace = false;//TODO: make this a user setting
                                //Select other face
                                if (stayInFaceEditModeWhenDeselectLastFace) {
                                    let prevFace = context.face;
                                    let newContext = this.selector.first;
                                    if (!newContext.furniture.validFaceIndex(prevFace)) {
                                        prevFace = 2;
                                    }
                                    newContext.face = prevFace;
                                    this.updateFaceSelection();
                                    this.runFaceDelegate();
                                }
                                //Exit mode
                                else {
                                    uiVars.editFaces = false;
                                }
                            }
                        }
                    }
                }
                else if (onlySelectButton) {
                    this.selectObject(target, false, targetFace, !onlySelectButton);
                }
            }
            else {
                //select
                this.selectObject(target, this.multiselectButton, targetFace, !onlySelectButton);
            }
            //sort selected
            this.sortSelected();
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
                    let context = this.getSelectContext(target);
                    if (context) {
                        //determine if face is already selected
                        let targetFace = targetHit.face.materialIndex;
                        let alreadySelected = context.face == targetFace;
                        if (!alreadySelected) {
                            //deselect other faces
                            if (!this.multiselectButton) {
                                this.selector.forEach(c => c.face = -2);
                            }
                            //select target face
                            context.face = targetFace;
                            if (uiVars.editFaces) {
                                this.updateFaceSelection();
                                this.runFaceDelegate();
                                //sort selected
                                this.sortSelected();
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

    selectObject(obj, add = false, face = -2, selectGroups = true) {
        //early exit: no obj
        if (!obj) {
            console.error("can't select obj", obj);
            return undefined;
        }
        //warning
        if (obj.isKitBash && !selectGroups) {
            console.warn("obj is a KitBash, selectGroups will be ignored", obj, selectGroups);
        }
        //create select context
        let selectContext = this.createSelectContext(obj, face);
        if (obj.isKitBash) {
            selectContext.kitbash = obj;
            selectContext.boxes = getBoxes(obj.items);
        }
        else{
            selectContext.furniture = obj;
            let box = getBox(obj);
            selectContext.box = box;
            let group = obj.group;
        if (group && selectGroups) {
            selectContext.obj = group;
            selectContext.kitbash = group;
            selectContext.boxes = getBoxes(group.items);
        }
            else {
                selectContext.boxes = [box];
            }
        }
        //select the context
        this.selector.select(selectContext, add);
        //return the selected context
        return selectContext;
    }

    sortSelected() {
        //sort selected
        this.selector.sort((c1, c2) => (
            c1.furniture.validFaceIndex(c1.face) && !c2.furniture.validFaceIndex(c2.face)) ? -1 : 0
        );
    }

    createSelectContext(select, face = -2) {
        return {
            obj: select,
            furniture: undefined,
            kitbash: undefined,
            box: undefined,
            boxes: undefined,
            face: face,
            offset: _zero.clone(),
        };
    }

    deselectObject(obj, deselectGroups = true) {
        //early exit: no obj
        if (!obj) {
            console.error("can't deselect obj", obj);
            return undefined;
        }
        //warning
        if (obj.isKitBash && !deselectGroups) {
            console.warn("obj is a KitBash, deselectGroups will be ignored", obj, deselectGroups);
        }
        //get select context
        let context = this.getSelectContext(obj);
        //Deselect
        this.selector.deselect(context);
        //Groups
        if (!obj.isKitBash && context.kitbash && !deselectGroups) {
            //select each piece individually,
            //except for the clicked on object
            context.kitbash.items.forEach(item => {
                //don't select clicked on object
                if (item == obj) { return; }
                //select other kitbash pieces individually
                this.selectObject(
                    item,
                    true,
                    (item == context.furniture) ? context.face : undefined,
                    false
                );
            })
        }
        //return the deselected context
        return context;
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
        return this.getSelectContext(obj) != undefined;
    }

    getSelectContext(obj) {
        return this.selector.find(c => c.obj === obj)
            || this.selector.find(c => c.furniture == obj)
            || this.selector.find(c => c.obj.has?.(obj));
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
        const min = 0;
        this.selector.forEach(context => {
            //early exit: deselect faces
            if (dir == undefined) {
                context.face = -2;
                return;
            }
            //early exit: no face selected on this object
            if (!context.furniture.validFaceIndex(context.face)) {
                return;
            }
            //
            const max = context.box.material.length - 1;
            //Cycle from default
            if (context.face == FACE_DEFAULT) {
                if (dir > 0) {
                    context.face = min;
                }
                else if (dir < 0) {
                    context.face = max;
                }
            }
            //Cycle normally
            else {
                context.face += dir;
                if (!between(context.face, min, max)) {
                    context.face = FACE_DEFAULT;
                }
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
