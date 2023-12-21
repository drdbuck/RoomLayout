"use strict";

class Controller {
    constructor(camera) {
        this.camera = camera;
        this.speed = 1;
    }

    processInput(event) {
        switch (event.keyCode) {
            case 87://W key
            case 38://Up Arrow
                this.camera.position.z -= this.speed;
                break;
            case 65://A key
            case 37://Left Arrow
                this.camera.position.x -= this.speed;
                break;
            case 83://S key
            case 40://Up Arrow
                this.camera.position.z += this.speed;
                break;
            case 68://D key
            case 39://Right Arrow
                this.camera.position.x += this.speed;
                break;
            default: break;
        }
    }
}
export { Controller };
