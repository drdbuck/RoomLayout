"use strict";
//2023-12-28: copied from https://raw.githubusercontent.com/mrdoob/three.js/master/examples/jsm/controls/FirstPersonControls.js

const _lookDirection = new Vector3();
const _spherical = new Spherical();
// const _target = new Vector3();

class FirstPersonControls {

	constructor(camera, object, domElement) {

		this.camera = camera;
		this.object = object;
		this.domElement = domElement;

		this.controls = new PointerLockControls(camera, domElement);

		// API

		this.enabled = true;

		this.movementSpeed = 20.0;
		this.lookSpeed = 0.1;

		this.lookVertical = true;
		this.autoForward = false;

		this.activeLook = true;

		this.heightSpeed = false;
		this.heightCoef = 1.0;
		this.heightMin = 0.0;
		this.heightMax = 1.0;

		this.constrainVertical = false;
		this.verticalMin = 0;
		this.verticalMax = Math.PI;

		this.mouseDragOn = false;

		// internals

		this.autoSpeedFactor = 0.0;

		this.pointerX = 0;
		this.pointerY = 0;

		this.moveForward = false;
		this.moveBackward = false;
		this.moveLeft = false;
		this.moveRight = false;

		this.viewHalfX = 0;
		this.viewHalfY = 0;

		this.velocity = new Vector3();
		this.direction = new Vector3();

		// private variables

		this.lat = 0;
		this.lon = 0;

		this.targetPosition = new Vector3();

		//

		this._onPointerMove = this.onPointerMove.bind(this);
		this._onPointerDown = this.onPointerDown.bind(this);
		this._onPointerUp = this.onPointerUp.bind(this);
		this._onKeyDown = this.onKeyDown.bind(this);
		this._onKeyUp = this.onKeyUp.bind(this);

		this._update = this.update.bind(this);

		this.handleResize();

		this.setOrientation(this);
	}

	activate(active) {
		if (active) {
			this.controls.lock();
			this.controls.connect();
			this._onPointerMove();
		}
		else {
			this.controls.unlock();
			this.controls.disconnect();
		}
	}

	handleResize() {

		if (this.domElement === document) {

			this.viewHalfX = window.innerWidth / 2;
			this.viewHalfY = window.innerHeight / 2;

		} else {

			this.viewHalfX = this.domElement.offsetWidth / 2;
			this.viewHalfY = this.domElement.offsetHeight / 2;

		}

	}

	onPointerDown(state, event) {
		return;
		if (this.domElement !== document) {

			this.domElement.focus();

		}

		if (this.activeLook) {

			switch (event.button) {

				case 0: this.moveForward = true; break;
				case 2: this.moveBackward = true; break;

			}

		}

		this.mouseDragOn = true;

	}

	onPointerUp(state, event) {
		return;
		if (this.activeLook) {

			switch (event.button) {

				case 0: this.moveForward = false; break;
				case 2: this.moveBackward = false; break;

			}

		}

		this.mouseDragOn = false;

	}

	onPointerMove(state, event) {
		//defaults
		if (!event) {
			event = {
				pageX: this.viewHalfX,
				pageY: this.viewHalfY,
			};
		}

		//locked
		this.controls._onMouseMove(event);

		//not locked
		if (this.domElement === document) {

			this.pointerX = event.pageX - this.viewHalfX;
			this.pointerY = event.pageY - this.viewHalfY;

		} else {

			this.pointerX = event.pageX - this.domElement.offsetLeft - this.viewHalfX;
			this.pointerY = event.pageY - this.domElement.offsetTop - this.viewHalfY;

		}


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
		view.quaternion = this.camera.quaternion;

		setOrientation(this);

		return this;

	}

	update(delta) {

		if (this.enabled === false) return;
		if (this.controls.isLocked) {
			this._updateLocked(delta);
		}
		else {
			this._updateUnlocked(delta);
		}
	}

	_updateLocked(delta) {
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

		view.position = obj.position;
		view.quaternion = obj.quaternion;

	}

	_updateUnlocked(delta) {

		if (this.heightSpeed) {

			const y = MathUtils.clamp(this.object.position.y, this.heightMin, this.heightMax);
			const heightDelta = y - this.heightMin;

			this.autoSpeedFactor = delta * (heightDelta * this.heightCoef);

		} else {

			this.autoSpeedFactor = 0.0;

		}

		const actualMoveSpeed = delta * this.movementSpeed;

		if (this.moveForward || (this.autoForward && !this.moveBackward)) this.object.translateZ(- (actualMoveSpeed + this.autoSpeedFactor));
		if (this.moveBackward) this.object.translateZ(actualMoveSpeed);

		if (this.moveLeft) this.object.translateX(- actualMoveSpeed);
		if (this.moveRight) this.object.translateX(actualMoveSpeed);

		if (this.moveUp) this.object.translateY(actualMoveSpeed);
		if (this.moveDown) this.object.translateY(- actualMoveSpeed);
		this.camera.position.copy(this.object.position);
		view.position = this.object.position;

		let actualLookSpeed = delta * this.lookSpeed;

		if (!this.activeLook) {

			actualLookSpeed = 0;

		}

		let verticalLookRatio = 1;

		if (this.constrainVertical) {

			verticalLookRatio = Math.PI / (this.verticalMax - this.verticalMin);

		}

		this.lon -= this.pointerX * actualLookSpeed;
		if (this.lookVertical) this.lat -= this.pointerY * actualLookSpeed * verticalLookRatio;

		this.lat = Math.max(- 85, Math.min(85, this.lat));

		let phi = MathUtils.degToRad(90 - this.lat);
		const theta = MathUtils.degToRad(this.lon);

		if (this.constrainVertical) {

			phi = MathUtils.mapLinear(phi, 0, Math.PI, this.verticalMin, this.verticalMax);

		}

		const position = this.camera.position;

		this.targetPosition.setFromSphericalCoords(1, phi, theta).add(position);

		this.camera.lookAt(this.targetPosition);
		this.object.quaternion.copy(this.camera.quaternion);
		this.object.rotation.x = 0;
		this.object.rotation.z = 0;
		view.quaternion = this.camera.quaternion;

	}

	setOrientation(controls) {

		const quaternion = controls.object.quaternion;

		_lookDirection.set(0, 0, - 1).applyQuaternion(quaternion);
		_spherical.setFromVector3(_lookDirection);

		this.lat = 90 - MathUtils.radToDeg(_spherical.phi);
		this.lon = MathUtils.radToDeg(_spherical.theta);

	}

}

function contextmenu(event) {

	event.preventDefault();

}
