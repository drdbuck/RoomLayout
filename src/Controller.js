"use strict";

class Controller {
    constructor(camera) {
        this.camera = camera;
        this.speed = 1;
    }

    processInput(event) {
        switch (event.keyCode) {
            case 68://D key
                this.camera.position.x += this.speed;
                break;
            case 65://A key
                this.camera.position.x -= this.speed;
                break;
            case 87://W key
                this.camera.position.z -= this.speed;
                break;
            case 83://S key
                this.camera.position.z += this.speed;
                break;
            default: break;
        }
    }
}
export { Controller };
