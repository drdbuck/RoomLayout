"use strict";

class Input {
    constructor(target) {
        this.target = target;

        this.mouse = {
            move: new Delegate(),
            down: new Delegate(),
            hold: new Delegate(),
            up: new Delegate(),
            wheel: new Delegate(),
        };
        this.key = {
            down: new Delegate(),
            hold: new Delegate(),
            up: new Delegate(),
        };
        this.state = {
            mouse: {
                lmbDown: false,
                //rmbDown: false,
                //buttons: [],
                pos: new Vector2(),
                posStart: new Vector2(),
                wheelDelta: 0,
            },
            keys: [],
        }
    }

    processMouseInput(event) {
        //2023-12-21: copied from https://discourse.threejs.org/t/how-can-i-get-the-position-of-mouse-click-point/16864/3
        this.state.mouse.pos.x = event.clientX / window.innerWidth * 2 - 1;
        this.state.mouse.pos.y = -(event.clientY / window.innerHeight) * 2 + 1;
        //
        this.state.mouse.wheelDelta = event.deltaY;
    }

    processMouseMove(event) {
        this.processMouseInput(event);
        this.mouse.move.run(this.state, event);
    }

    processMouseDown(event) {
        this.processMouseInput(event);
        this.state.mouse.lmbDown = true;
        this.state.mouse.posStart.copy(this.state.mouse.pos);
        this.mouse.down.run(this.state, event);
    }

    processMouseHold(event) {
        this.processMouseInput(event);
        this.mouse.hold.run(this.state, event);
    }

    processMouseUp(event) {
        this.state.mouse.lmbDown = false;
        this.mouse.up.run(this.state, event);
    }

    processMouseWheel(event) {
        this.processMouseInput(event);
        this.mouse.wheel.run(this.state, event);
    }



    processKeyDown(event) {
        if (!this.state.keys.includes(event.keyCode)) {
            this.state.keys.push(event.keyCode);
        }
        //
        this.key.down.run(this.state, event);
    }

    processKeyHold(event) {
        this.key.hold.run(this.state, event);
    }

    processKeyUp(event) {
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

        this.key.down.clear();
        this.key.hold.clear();
        this.key.up.clear();
    }
}
