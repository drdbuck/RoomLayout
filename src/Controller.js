"use strict";
import { Raycaster } from "../js/three.module.js";

class Controller {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;
        this.speed = 1;
        this.mouse = {};
        this.raycaster = new Raycaster();
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

    processMouseInput(event) {
        //2023-12-21: copied from https://discourse.threejs.org/t/how-can-i-get-the-position-of-mouse-click-point/16864/3
        this.mouse.x = event.clientX / window.innerWidth * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        console.log("mouse", this.mouse);
        //2023-12-21: copied from https://stackoverflow.com/a/30871007/2336212
        this.raycaster.setFromCamera(this.mouse, this.camera); 
        let objects = this.raycaster.intersectObjects(this.scene.children);
        console.log("objects", objects);
    }
}
export { Controller };
