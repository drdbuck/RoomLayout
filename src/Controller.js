"use strict";

const mouseDragStringify = [
    "x",
    "y",
];

const ZOOM_MIN = 2;
const ZOOM_MAX = 100;

class Controller {
    constructor(camera, scene, canvas) {
        this.camera = camera;
        this.scene = scene;
        this.canvas = canvas;
        this.speed = 1;
        this.wheelMoveSpeed = 1;
        this.mouse = {
            targetY: 0,
        };
        this.raycaster = new Raycaster();
        this.raycaster.layers.set(objectMask);

        this.onFaceSelectionChanged = new Delegate("faces");
    }

    activate(active) {
        //do nothing
    }

    processInput(state, event) {
        let key = menuKeys.find(key =>
            key.key.toLowerCase() == event.key.toLowerCase()
            && key.ctrl == event.ctrlKey
            && key.shift == event.shiftKey
            && key.alt == event.altKey
        );
        if (key) {
            //limit it to only calling action methods (for more security)
            if (!(/^action[a-zA-Z0-9]*\(\);$/.test(key.action))) { return; }
            //call the action method
            new Function(key.action)();
            //don't do other actions with this input
            event.preventDefault();
            event.stopPropagation();
            //update
            player.animate();
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
            default: break;
        }
        //if move the camera,
        if (moveCamera) {
            //save position
            uiVars.view.position = this.camera.position;

            player.animate();
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
        let target = targetBox?.box;
        //if an object was clicked on
        if (target) {
            let targetFace = targetHit.face.materialIndex;
            //if the object is selected already
            let context = this.getSelectContext(target);
            if (context) {
                //if multiselect button is down (ctrl, shift)
                if (this.multiselectButton) {
                    //select face
                    if (uiVars.viewPanelFace && context.face != targetFace) {
                        context.face = targetFace;
                        this.updateFaceSelection();
                        this.runFaceDelegate();
                    }
                    //deselect object
                    else {
                        this.deselectObject(target, !onlySelectButton);
                        //check if there's no other face selected now
                        if (uiVars.viewPanelFace) {
                            if (!uiVars.selector.some(c => c.box.validFaceIndex(c.face))) {
                                let stayInFaceEditModeWhenDeselectLastFace = false;//TODO: make this a user setting
                                //Select other face
                                if (stayInFaceEditModeWhenDeselectLastFace) {
                                    let prevFace = context.face;
                                    let newContext = uiVars.selector.first;
                                    if (!newContext.box.validFaceIndex(prevFace)) {
                                        prevFace = 2;
                                    }
                                    newContext.face = prevFace;
                                    this.updateFaceSelection();
                                    this.runFaceDelegate();
                                }
                            }
                        }
                    }
                }
                //if only select button is down (alt)
                else if (onlySelectButton) {
                    //select this object only
                    this.selectObject(target, false, targetFace, !onlySelectButton);
                }
            }
            else {
                //check to see if the target is in a group that has some pieces single selected
                let anyPieceSingleSelected = false;
                if (target.group) {
                    let items = target.group.items;
                    anyPieceSingleSelected = uiVars.selector.some(c => items.includes(c.obj));
                }
                //select object
                this.selectObject(
                    target,
                    this.multiselectButton,
                    targetFace,
                    !onlySelectButton && !anyPieceSingleSelected
                );
            }
            //sort selected
            this.sortSelected();
            //prepare for drag
            let hit = this.getHitAtMousePos();
            this.mouse.targetY = hit?.point.y ?? 0;
            this.calculateSelectedOffsets();
        }
        //if no object was clicked on
        else {
            uiVars.selector.clear();
        }
        player.animate();
    }

    processMouseMove(state, event) {
        this.processMouseInput(event);
        if (state.mouse.lmbDown) {
            if (uiVars.selector.count > 0) {
                this.moveObject();
            }
        }
        else {
            this.mouse.over = this.getObjectAtMousePos();
            let cursor = (this.mouse.over) ? CURSOR_MOVE : CURSOR_AUTO;
            this.changeCursor(cursor);
        }
        player.animate();
    }

    processMouseUp(state, event) {
        if (!state.mouse.lmbDown) {
            //select face
            if (state.mouse.wasDragged) {
                if (uiVars.selector.count > 0) {
                    //record undo
                    undoMan.recordUndo("move object");
                }
            }
            else {
                let targetHit = this.getObjectHitAtMousePos();
                let target = targetHit?.object?.box;
                //if an object was clicked on
                if (target) {
                    //if the object is selected
                    let context = this.getSelectContext(target);
                    if (context) {
                        let faceChanged = false;
                        //if its part of group, select this one
                        if (context.box != target) {
                            //unhighlight prev face
                            let prevFace = context.face;
                            context.face = -2;
                            this.updateFaceSelection();
                            context.face = prevFace;
                            //select this mesh as the target
                            context.box = target;
                            context.grabInfo();
                            faceChanged = true;
                        }
                        //determine if face is already selected
                        let targetFace = targetHit.face.materialIndex;
                        let alreadySelected = context.face == targetFace;
                        if (alreadySelected) {
                            //do nothing
                        }
                        else {
                            //deselect all other faces
                            if (!this.multiselectButton) {
                                uiVars.selector.forEach(c => c.face = -2);
                            }
                            //select target face
                            context.face = targetFace;
                            faceChanged = true;
                        }
                        if (faceChanged) {
                            if (uiVars.viewPanelFace) {
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
        player.animate();
        this.updateCollectiveCenter();
    }

    processMouseWheel(state, event) {
        let zoomDelta = state.mouse.wheelDelta * this.wheelMoveSpeed / 100;
        //Altitude
        if (state.mouse.lmbDown || event.altKey) {
            uiVars.selector.forEach(c => {
                let box = c.obj;
                this.setBoxAltitude(box, box.altitude + zoomDelta);
            });
            //record undo
            undoMan.recordUndo("change object altitude");
        }
        //Rotate
        else if (event.shiftKey) {
            uiVars.selector.forEach(c => {
                //Rotate object
                let deltaAngle = Math.round(zoomDelta) * 15;
                this.setBoxAngle(c.obj, c.obj.angle + deltaAngle);
            });
            //record undo
            undoMan.recordUndo("change object angle");
        }
        //Camera zoom
        else {
            this.camera.position.y = Math.clamp(
                this.camera.position.y + zoomDelta,
                ZOOM_MIN,
                ZOOM_MAX
            );
        }
        player.animate();
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
        let selectContext = new SelectContext(obj, face);
        if (obj.isKitBash) {
            selectContext.kitbash = obj;
            let items = obj.items;
            selectContext.box = items[0];
        }
        else {
            selectContext.box = obj;
            let group = obj.group;
            selectContext.kitbash = group;
            if (group && selectGroups) {
                selectContext.obj = group;
            }
        }
        selectContext.grabInfo();
        //select the context
        uiVars.selector.select(selectContext, add);
        //return the selected context
        return selectContext;
    }

    sortSelected() {
        //sort selected
        uiVars.selector.sort((c1, c2) => (
            c1.box.validFaceIndex(c1.face) && !c2.box.validFaceIndex(c2.face)) ? -1 : 0
        );
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
        uiVars.selector.deselect(context);
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
                    (item == context.box) ? context.face : undefined,
                    false
                );
            })
        }
        //return the deselected context
        return context;
    }

    updateCollectiveCenter() {
        const count = uiVars.selector.count;
        if (count <= 0) {
            //TODO: use room's origin
            this.collectiveCenter = _zero.clone().setY(house.rooms[0].height / 2);//dirty: hard coding what room to use
            return;
        }
        const avgFunc = (func) => uiVars.selector.map(func).sum() / count;
        let collectiveCenter = new Vector3(
            avgFunc(c => c.obj.position.x),
            avgFunc(c => c.obj.position.y),
            avgFunc(c => c.obj.position.z),
        );
        this.collectiveCenter = collectiveCenter;
        uiVars.selector.forEach(c => c.collectiveCenter = collectiveCenter);
    }

    isSelected(obj) {
        return this.getSelectContext(obj) != undefined;
    }

    getSelectContext(obj) {
        return uiVars.selector.find(c => c.obj === obj)
            || uiVars.selector.find(c => c.box == obj)
            || uiVars.selector.find(c => c.obj.has?.(obj));
    }

    calculateSelectedOffsets() {
        let mouseWorld = this.getMouseWorld(this.mouse);
        uiVars.selector.forEach(context => {
            let select = context.obj;
            let origPos = new Vector3(select.position);
            let offset = origPos.sub(mouseWorld);
            context.offset.copy(offset);
        });
    }

    clearSelectedOffsets() {
        uiVars.selector.forEach(context => context.offset.copy(_zero));
    }

    selectNextFace(dir) {
        const min = 0;
        uiVars.selector.forEach(context => {
            //early exit: deselect faces
            if (dir == undefined) {
                context.face = -2;
                return;
            }
            //early exit: no face selected on this object
            if (!context.box.validFaceIndex(context.face)) {
                return;
            }
            //
            const max = context.mesh.material.length - 1;
            let validFace = false;
            let loopProtect = 100;//to prevent infinite loops
            while (!validFace && loopProtect > 0) {
                loopProtect--;
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
                        //group
                        if (context.obj.isKitBash) {
                            //unhighlight prev face
                            let prevFace = context.face;
                            context.face = -2;
                            this.updateFaceSelection();
                            context.face = prevFace;
                            //select next object
                            let group = context.obj;
                            let nextF = group.nextItem(context.box, dir);
                            let indexF = group.indexOf(nextF);
                            context.face = (dir > 0)
                                ? (indexF == 0) ? FACE_DEFAULT : min
                                : context.face = (indexF == group.count - 1) ? FACE_DEFAULT : max;
                            context.box = nextF;
                            context.grabInfo();
                        }
                        //just mesh
                        else {
                            context.face = FACE_DEFAULT;
                        }
                    }
                }
                //check for valid face
                validFace = context.face === FACE_DEFAULT
                    || context.box.getValidFaceIndexes().includes(context.face);
            }
        });
        this.updateFaceSelection();
        this.runFaceDelegate();
    }

    updateFaceSelection() {
        uiVars.selector.forEach(c => {
            updateFace(c.mesh, c.face);
        });
    }

    runFaceDelegate() {
        this.onFaceSelectionChanged.run(uiVars.selector.map(c => c.face));
    }


    moveObject() {
        let mouseWorld = this.getMouseWorld(this.mouse);
        let pos = new Vector3();
        uiVars.selector.forEach(context => {
            let item = context.obj;
            pos.copy(mouseWorld);
            pos = pos.add(context.offset);
            this.setBoxPosition(item, pos);
        });
    }

    setGroupScaleFactor(group, scaleFactor){
        group.scaleFactor = scaleFactor;
    }

    setBoxPosition(box, position) {
        let min = box.room.min;
        let max = box.room.max;
        position.x = Math.clamp(position.x, min.x, max.x);
        position.z = Math.clamp(position.z, min.z, max.z);
        // position.z = -Math.clamp(position.z, min.z, max.z);
        box.position = position;
    }

    setBoxAltitude(box, altitude) {
        box.altitude = Math.clamp(
            altitude,
            box.room.min.y,
            box.room.max.y - box.height
        );
    }

    setBoxAngle(box, angle) {
        box.angle = loopAngle(angle);
    }

    setBoxRecline(box, recline) {
        box.recline = Math.clamp(recline, -90, 90);
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
        this.canvas.style.cursor = cursorStyle;
    }
}
