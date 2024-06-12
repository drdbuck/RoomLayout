"use strict";

class Input {
    constructor(mouseTarget, keyTargetList) {
        this.mouseTarget = mouseTarget;
        this.keyTargetList = [keyTargetList].flat(Infinity).filter(kt => kt);

        this.mouse = {
            move: new Delegate(),
            down: new Delegate(),
            hold: new Delegate(),
            up: new Delegate(),
            wheel: new Delegate(),
            doubleclick: new Delegate(),
        };
        this.key = {
            down: new Delegate(),
            hold: new Delegate(),
            up: new Delegate(),
        };
        this.state = {
            mouse: {
                lmbDown: false,
                rmbDown: false,
                //buttons: [],
                pos: new Vector2(),
                posStart: new Vector2(),
                wheelDelta: 0,
                wasDragged: false,
            },
            keys: [],
        };
    }

    processMouseInput(event) {
        if (!this.verifyEvent(event)) { return; }
        //
        //2023-12-21: copied from https://discourse.threejs.org/t/how-can-i-get-the-position-of-mouse-click-point/16864/3
        this.state.mouse.pos.x = event.clientX / window.innerWidth * 2 - 1;
        this.state.mouse.pos.y = -(event.clientY / window.innerHeight) * 2 + 1;
        //
        this.state.mouse.wheelDelta = event.deltaY;
    }

    processMouseMove(event) {
        if (!this.verifyEvent(event)) { return; }
        //
        this.processMouseInput(event);
        if (this.state.mouse.lmbDown || this.state.mouse.rmbDown) {
            let moveAmount = this.state.mouse.posStart.clone().sub(this.state.mouse.pos).length();
            if (moveAmount > 0.0001) {
                this.state.mouse.wasDragged = true;
            }
        }
        this.mouse.move.run(this.state, event);
    }

    processMouseDown(event) {
        if (!this.verifyEvent(event)) { return; }
        //
        this.processMouseInput(event);
        this.state.mouse.lmbDown = event.button == 0;
        this.state.mouse.rmbDown = event.button == 2;
        this.state.mouse.posStart.copy(this.state.mouse.pos);
        this.state.mouse.wasDragged = false;
        this.mouse.down.run(this.state, event);
    }

    processMouseHold(event) {
        if (!this.verifyEvent(event)) { return; }
        //
        this.processMouseInput(event);
        this.mouse.hold.run(this.state, event);
    }

    processMouseUp(event) {
        if (!this.verifyEvent(event)) { return; }
        //
        this.state.mouse.lmbDown &&= !(event.button == 0);
        this.state.mouse.rmbDown &&= !(event.button == 2);
        this.mouse.up.run(this.state, event);
    }

    processMouseWheel(event) {
        if (!this.verifyEvent(event)) { return; }
        //
        this.processMouseInput(event);
        this.mouse.wheel.run(this.state, event);
    }

    processMouseDoubleClick(event) {
        if (!this.verifyEvent(event)) { return; }
        //
        this.processMouseInput(event);
        this.mouse.doubleclick.run(this.state, event);
    }



    processKeyDown(event) {
        if (!this.verifyEvent(event)) { return; }
        //
        if (!this.state.keys.includes(event.keyCode)) {
            this.state.keys.push(event.keyCode);
        }
        //
        this.key.down.run(this.state, event);
    }

    processKeyHold(event) {
        if (!this.verifyEvent(event)) { return; }
        //
        this.key.hold.run(this.state, event);
    }

    processKeyUp(event) {
        if (!this.verifyEvent(event)) { return; }
        //
        let index = this.state.keys.indexOf(event.keyCode);
        if (index >= 0) {
            this.state.keys.splice(index, 1);
        }
        //
        this.key.up.run(this.state, event);
    }



    clearAllDelegates() {
        this.mouse.move.clear();
        this.mouse.down.clear();
        this.mouse.hold.clear();
        this.mouse.up.clear();
        this.mouse.wheel.clear();

        this.key.down.clear();
        this.key.hold.clear();
        this.key.up.clear();
    }

    /**
     * Returns true if the event is processable
     * @param {Event} event The event to verify
     * @returns
     */
    verifyEvent(event) {
        return ["MouseEvent", "WheelEvent"].includes(event.constructor.name)
            && [event.target, event.target?.firstChild].includes(this.mouseTarget)
            || event.constructor.name == "KeyboardEvent" && (this.keyTargetList.includes(event.target) || this.keyTargetList.includes(event.target?.parentElement));
    }
}
