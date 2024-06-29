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
        const ESC = 27;
        const overrideESC = invisibleStack.length > 0;
        const overrideKey = (event.keyCode == ESC && overrideESC);
        let key = menuKeys.find(key =>
            key.key.toLowerCase() == event.key.toLowerCase()
            && key.ctrl == event.ctrlKey
            && key.shift == event.shiftKey
            && key.alt == event.altKey
        );
        if (key && !overrideKey) {
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
        let moveDirection = _zero.clone();
        let speed = 0;
        switch (event.keyCode) {
            //esc key
            case ESC:
                let box = invisibleStack.at(-1);
                if (box) {
                    makeVisible(box, true);
                    //select box
                    let context = uiVars.selector.find(c => c.kitbash == box.group);
                    let newContext = context.clone();
                    newContext.box = box;
                    newContext.grabInfo();
                    uiVars.selector.select(newContext);
                    uiVars.selector.deselect(context);
                }
                break;
            case 87://W key
            case 38://Up Arrow
                this.camera.position.y = Math.clamp(
                    this.camera.position.y + this.speed,
                    ZOOM_MIN,
                    ZOOM_MAX
                );
                uiVars.view.position = this.camera.position;
                player.animate();
                break;
            case 65://A key
            case 37://Left Arrow
                moveDirection.x = 1;
                speed = -1;
                break;
            case 83://S key
            case 40://Down Arrow
                this.camera.position.y = Math.clamp(
                    this.camera.position.y - this.speed,
                    ZOOM_MIN,
                    ZOOM_MAX
                );
                uiVars.view.position = this.camera.position;
                player.animate();
                break;
            case 68://D key
            case 39://Right Arrow
                moveDirection.x = 1;
                speed = 1;
                break;
            default: break;
        }
        //if move the camera,
        if (speed != 0) {

            //move the camera
            this.moveCamera(moveDirection, speed * this.speed);

            //save position
            uiVars.view.position = this.camera.position;

            player.animate();
        }
    }

    moveCamera(direction, speed) {

        direction.normalize();

        //2024-06-13: copied from PointerLockControls.moveForward()
        let moveDirection = new Vector3().setFromMatrixColumn(this.camera.matrix, 0);
        if (direction.z != 0) {
            moveDirection.crossVectors(_up, moveDirection);
        }

        this.camera.position.addScaledVector(moveDirection, speed);
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
        let target = targetBox?.box ?? targetBox?.kitbash;
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
                            if (!uiVars.selector.some(c => c.validFaceIndex())) {
                                let stayInFaceEditModeWhenDeselectLastFace = false;//TODO: make this a user setting
                                //Select other face
                                if (stayInFaceEditModeWhenDeselectLastFace) {
                                    let prevFace = context.face;
                                    let newContext = uiVars.selector.first;
                                    if (!newContext.validFaceIndex(prevFace)) {
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
                    uiVars.prevSelection = uiVars.selector.selection.filter(c => c.stable);
                    let context = this.selectObject(target, false, targetFace, !onlySelectButton);
                    context.stable = false;
                }
            }
            else {
                //if its group is already selected, but the box isnt
                let context2 = this.getSelectContext(target.group);
                if (context2) {
                    //select the box
                }
                else {
                    //check to see if the target is in a group that has some pieces single selected
                    let anyPieceSingleSelected = false;
                    if (target.group) {
                        let items = target.group.items;
                        anyPieceSingleSelected = uiVars.selector.some(c => items.includes(c.obj));
                    }
                    //select object
                    uiVars.prevSelection = uiVars.selector.selection.filter(c => c.stable);
                    let context = this.selectObject(
                        target,
                        this.multiselectButton,
                        targetFace,
                        !onlySelectButton && !anyPieceSingleSelected
                    );
                    context.stable = false;
                }
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
            if (state.mouse.wasDragged) {
                if (uiVars.selector.count > 0) {
                    this.moveObject();
                }
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
                    //remove volatile selections
                    uiVars.selector.filter(c => c.stable);
                    if (uiVars.selector.count == 0) {
                        uiVars.selector.selectAll(uiVars.prevSelection);
                    }
                    // //record undo
                    // undoMan.recordUndo("move object");
                }
            }
            else {
                //
                let targetHit = this.getObjectHitAtMousePos();
                let target = targetHit?.object?.box ?? targetHit?.object?.kitbash;
                let targetFace = targetHit?.face.materialIndex;
                //if an object was clicked on
                if (target) {
                    //if the object is selected
                    let context = this.getSelectContext(target);
                    if (context) {
                        if (context.stable) {
                            //select box
                            if (!context.boxSelected) {
                                if (context.box) {
                                    context.boxSelected = true;
                                    uiVars.selector.callDelegates();//TODO: setup delegates for listening to boxselected and faceselected
                                }
                            }
                            //select face
                            else if (!context.faceSelected) {
                                context.faceSelected = true;
                                context.face = targetFace;
                                uiVars.selector.callDelegates();//TODO: setup delegates for listening to boxselected and faceselected
                            }
                            //select other box/face
                            else {
                                let faceChanged = false;
                                //determine if face is already selected
                                let alreadySelected = context.face == targetFace;
                                if (alreadySelected) {
                                    uiVars.viewPanelFace = true;

                                    //make box invisible
                                    makeVisible(context.box, false);
                                }
                                else {
                                    //deselect all other faces
                                    if (!this.multiselectButton) {
                                        uiVars.selector.forEach(c => c.face = FACE_NONE);
                                    }
                                    //select target face
                                    context.face = targetFace;
                                    faceChanged = true;
                                }
                                if (faceChanged) {
                                    this.updateFaceSelection();
                                    this.runFaceDelegate();
                                    //sort selected
                                    this.sortSelected();
                                }
                            }
                        }
                    }
                    else {
                        if (target.isKitBash) {
                            this.selectObject(target, this.multiselectButton, targetFace, true);
                        }
                        else {
                            let context2 = this.getSelectContext(target.group);
                            if (context2?.stable) {
                                let newcontext = context2.clone();
                                //select the box
                                newcontext.box = target;
                                newcontext.face = targetFace;
                                newcontext.grabInfo();
                                uiVars.selector.select(newcontext);
                                //deselect the other box
                                uiVars.selector.deselect(context2);
                            }
                        }
                    }
                }
                //stabilize volatile selections
                uiVars.selector.forEach(c => c.stable = true);
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
                this.setBoxAltitude(box, box.altitude + convertUnits(zoomDelta, UNITS_FEET, box.units));
            });
            // //record undo
            // undoMan.recordUndo("change object altitude");
        }
        //Rotate / Recline
        else if (uiVars.selector.count > 0) {
            //Recline
            if (event.shiftKey) {
                uiVars.selector.forEach(c => {
                    let deltaAngle = Math.round(zoomDelta) * 15;
                    this.setBoxRecline(c.box, c.box.recline + deltaAngle);
                });
                // //record undo
                // undoMan.recordUndo("change object recline");
            }
            //Rotate
            else {
            uiVars.selector.forEach(c => {
                let deltaAngle = Math.round(zoomDelta) * 15;
                this.setBoxAngle(c.obj, c.obj.angle + deltaAngle);
            });
            // //record undo
            // undoMan.recordUndo("change object angle");
            }
        }
        //Camera zoom
        else {
            //2024-06-13: copied from OrbitControls.updateZoomParameters() and OrbitControls.update()
            let moveDirection = new Vector3(0, 0, 1)
                .unproject(this.camera)
                .sub(this.camera.position)
                .normalize();
            this.camera.position.addScaledVector(moveDirection, -zoomDelta);
        }
        player.animate();
    }

    processMouseDoubleClick(state, event) {
    }

    getHitAtMousePos(findFunc = (rch) => true) {
        //2023-12-21: copied from https://stackoverflow.com/a/30871007/2336212
        this.raycaster.setFromCamera(this.mouse, this.camera);
        let objects = this.raycaster.intersectObjects(this.scene.children);
        return objects.find(findFunc);
    }

    getObjectHitAtMousePos() {
        return this.getHitAtMousePos(o => this.isMeshSelectable(o.object, o.face.materialIndex))
            ?? this.getHitAtMousePos(o => this.isMeshSelectable(o.object, o.face.materialIndex, true));
    }

    getObjectAtMousePos() {
        return this.getObjectHitAtMousePos()?.object;
    }

    isMeshSelectable(mesh, faceIndex, allowInvisible = false) {
        let material = mesh.material[faceIndex] ?? mesh.material;
        return mesh.userData.selectable && ((mesh.visible && material.opacity > 0) || allowInvisible);
    }

    selectObject(obj, add = false, face = FACE_NONE, selectGroups = true) {
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
        }
        else {
            let group = obj.group;
            if (group && selectGroups) {
                selectContext.obj = group;
                selectContext.boxSelected = false;
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
            c1.validFaceIndex() && !c2.validFaceIndex()) ? -1 : 0
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
            });
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
            avgFunc(c => convertToFeet(c.obj.worldPosition.x, c.obj)),
            avgFunc(c => convertToFeet(c.obj.worldPosition.y, c.obj)),
            avgFunc(c => convertToFeet(c.obj.worldPosition.z, c.obj)),
        );
        this.collectiveCenter = collectiveCenter;
        uiVars.selector.forEach(c => c.collectiveCenter = collectiveCenter);
    }

    isSelected(obj) {
        return this.getSelectContext(obj) != undefined;
    }

    getSelectContext(obj) {
        //early exit: no obj
        if (!obj) { return undefined; }
        //find obj
        return uiVars.selector.find(c =>
            c.obj === obj
            || c.box == obj
            || c.kitbash == obj
        );
    }

    calculateSelectedOffsets() {
        let mouseWorld = this.getMouseWorld(this.mouse);
        uiVars.selector.forEach(context => {
            let select = context.obj;
            let origPos = new Vector3(convertUnits(select.worldPosition, select.units, UNITS_FEET));
            let offset = origPos.sub(mouseWorld);
            context.offset.copy(offset);
        });
    }

    clearSelectedOffsets() {
        uiVars.selector.forEach(context => context.offset.copy(_zero));
    }

    selectNextBox(dir) {
        if (dir == undefined) {
            return;
        }
        let selection = uiVars.selector.selection;
        uiVars.selector.clear();
        let newSelection = selection
            .map(context => {
                //early exit: no group
                if (!context.kitbash) {
                    console.error("no group selected!", context);
                    return;
                }
                //early exit: no items
                if (!(context.kitbash.count > 0)) { return context; }
                //
                let item = context.kitbash.nextItem(context.box, dir);
                if (!context.obj.isKitBash) {
                    context.obj = item;
                }
                context.box = item;
                context.grabInfo();
                if (context.face >= 0) {
                    context.face = this.getFaceCloseToCamera(context.box);
                }
                //
                //TODO: verify newly selected face is valid
                //
                //return
                return context;
            })
            .filter(c => c);
        uiVars.selector.selectAll(newSelection);
        this.updateFaceSelection();
        this.runFaceDelegate();
        updateUIVariables(uiVars.selector.selection);
        updateBoxEditPanel();
        updateFaceEditPanel();
    }

    selectNextFace(dir) {
        const min = 0;
        uiVars.selector.forEach(context => {
            //early exit: deselect faces
            if (dir == undefined) {
                context.face = FACE_NONE;
                return;
            }
            //early exit: no items
            if (!(context.kitbash.count > 0)) {
                context.face = FACE_DEFAULT;
                return;
            }
            //early exit: no face selected on this object
            if (!context.validFaceIndex()) {
                return;
            }
            //
            const faceCount = context.mesh.material.length;
            const max = faceCount - 1;
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
                        //cycle through all faces in group
                        if (!context.boxSelected) {
                            //unhighlight prev face
                            let prevFace = context.face;
                            context.face = FACE_NONE;
                            this.updateFaceSelection();
                            context.face = prevFace;
                            //select next object
                            let group = context.kitbash;
                            let nextF = group.nextItem(context.box, dir);
                            let indexF = group.indexOf(nextF);
                            context.face = (dir > 0)
                                ? (indexF == 0) ? FACE_DEFAULT : min
                                : context.face = (indexF == group.count - 1) ? FACE_DEFAULT : max;
                            context.box = nextF;
                            context.grabInfo();
                        }
                        //cycle through just faces on box
                        else {
                            context.face = (context.face + faceCount) % faceCount;
                        }
                    }
                }
                //check for valid face
                validFace = context.face === FACE_DEFAULT
                    || context.box?.getValidFaceIndexes().includes(context.face);
            }
        });
        this.updateFaceSelection();
        this.runFaceDelegate();
    }

    getFaceCloseToCamera(box) {
        //early exit: no box
        if (!box) {
            return;
        }
        //
        let boxpos = box.worldPosition.clone().add(new Vector3(0, box.height / 2, 0));
        this.raycaster.set(
            this.camera.position,
            boxpos.clone().sub(this.camera.position).normalize()
        );
        let objects = this.raycaster.intersectObjects(this.scene.children);
        let face = objects
            .filter(o => o.object.box == box)[0]
            ?.face?.materialIndex ?? 0;
        const validFaces = box.getValidFaceIndexes();
        if (!validFaces.includes(face)) {
            return validFaces[0];
        }
        return face;
    }

    updateFaceSelection() {
        uiVars.selector.forEach(c => {
            updateFace(c.mesh, c.face, c.faceSelected);
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
            this.setBoxPositionWorld(item, convertUnits(pos, UNITS_FEET, item.units));
        });
    }

    setGroupScaleFactor(group, scaleFactor) {
        group.scaleFactor = scaleFactor;
    }

    setBoxPosition(box, position) {
        let room = box.room;
        let min = convertUnits(room.min, room.units, box.units);
        let max = convertUnits(room.max, room.units, box.units);
        position.x = Math.clamp(position.x, min.x, max.x);
        position.z = Math.clamp(position.z, min.z, max.z);
        // position.z = -Math.clamp(position.z, min.z, max.z);
        box.position = position;
    }
    setBoxPositionWorld(box, worldPos) {
        let room = box.room;
        let min = convertUnits(room.min, room.units, box.units);
        let max = convertUnits(room.max, room.units, box.units);
        worldPos.x = Math.clamp(worldPos.x, min.x, max.x);
        worldPos.z = Math.clamp(worldPos.z, min.z, max.z);
        // worldPos.z = -Math.clamp(worldPos.z, min.z, max.z);
        box.worldPosition = worldPos;
    }

    setBoxAltitude(box, altitude) {
        let room = box.room;
        box.altitude = Math.clamp(
            altitude,
            convertUnits(room.min.y, room.units, box.units),
            convertUnits(room.max.y, room.units, box.units) - box.height
        );
    }

    setBoxAngle(box, angle) {
        box.angle = loopAngle(angle);
    }

    setBoxRecline(box, recline) {
        box.recline = Math.clamp(recline, -90, 90);
        updateBoxEditPanel();
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
