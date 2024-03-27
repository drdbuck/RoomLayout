"use strict";
//2023-12-28: copied from https://raw.githubusercontent.com/mrdoob/three.js/master/examples/jsm/controls/FirstPersonControls.js

const _lookDirection = new Vector3();
const _spherical = new Spherical();
// const _target = new Vector3();

class FirstPersonControls {

	constructor(camera, domElement) {

		this.camera = camera;
		this.domElement = domElement;

		this.controlsPointerLock = new PointerLockControls(camera, domElement);
		this.controlsOrbit = new OrbitControls(camera, domElement);
		this.controls = this.controlsPointerLock;
		this.controls = this.controlsOrbit;

		// API

		this.enabled = true;

		this.movementSpeed = 20.0;

		// internals

		this.moveForward = false;
		this.moveBackward = false;
		this.moveLeft = false;
		this.moveRight = false;

		this.velocity = new Vector3();
		this.direction = new Vector3();

		//

		this._onPointerMove = this.onPointerMove.bind(this);
		this._onPointerDown = this.onPointerDown.bind(this);
		this._onPointerUp = this.onPointerUp.bind(this);
		this._onMouseWheel = this.onMouseWheel.bind(this);
		this._onKeyDown = this.onKeyDown.bind(this);
		this._onKeyUp = this.onKeyUp.bind(this);

		this._update = this.update.bind(this);

	}

	activate(active) {
		if (active) {
			this.controls.lock();
			this.controls.connect();
			// this._onPointerMove(); //for pointer lock controls
		}
		else {
			this.controls.unlock();
			this.controls.disconnect();
		}
	}

	onPointerDown(state, event) {
		this.controls._onMouseDown(event);
	}

	onPointerUp(state, event) {
		this.controls._onMouseUp(event);
	}

	onPointerMove(state, event) {
		//defaults
		event ??= {};

		//locked
		this.controls._onMouseMove(event);

	}

	onMouseWheel(state, event) {
		this.controls._onMouseWheel(event);
	}

	onKeyDown(state, event) {
		switch (event.code) {

			case 'ArrowUp':
			case 'KeyW': this.moveForward = true; break;

			case 'ArrowLeft':
			case 'KeyA': this.moveLeft = true; break;

			case 'ArrowDown':
			case 'KeyS': this.moveBackward = true; break;

			case 'ArrowRight':
			case 'KeyD': this.moveRight = true; break;

			case 'KeyR': this.moveUp = true; break;
			case 'KeyF': this.moveDown = true; break;

		}

	}

	onKeyUp(state, event) {

		switch (event.code) {

			case 'ArrowUp':
			case 'KeyW': this.moveForward = false; break;

			case 'ArrowLeft':
			case 'KeyA': this.moveLeft = false; break;

			case 'ArrowDown':
			case 'KeyS': this.moveBackward = false; break;

			case 'ArrowRight':
			case 'KeyD': this.moveRight = false; break;

			case 'KeyR': this.moveUp = false; break;
			case 'KeyF': this.moveDown = false; break;

		}

	}

	lookAt(x, y, z) {

		if (x.isVector3) {

			_target.copy(x);

		} else {

			_target.set(x, y, z);

		}

		this.camera.lookAt(_target);
		this.object.quaternion.copy(this.camera.quaternion);
		this.object.rotation.x = 0;
		this.object.rotation.z = 0;
		uiVars.view.quaternion = this.camera.quaternion;

		return this;

	}

	update(delta) {

		if (!this.enabled) { return; }
		if (!this.controls.isLocked) { return; }

		// 2024-01-07: copied from https://github.com/mrdoob/three.js/blob/master/examples/misc_controls_pointerlock.html

		this.velocity.x -= this.velocity.x * 10.0 * delta;
		this.velocity.z -= this.velocity.z * 10.0 * delta;

		this.velocity.y = 0;

		this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
		this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
		this.direction.normalize(); // this ensures consistent movements in all directions

		if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * this.movementSpeed * delta;
		if (this.moveLeft || this.moveRight) this.velocity.x -= this.direction.x * this.movementSpeed * delta;

		this.controls.moveRight(- this.velocity.x * delta);
		this.controls.moveForward(- this.velocity.z * delta);

		const obj = this.controls.getObject();
		obj.position.y += (this.velocity.y * delta); // new behavior

		uiVars.view.position = obj.position;
		uiVars.view.quaternion = obj.quaternion;

	}

}

function contextmenu(event) {

	event.preventDefault();

}
