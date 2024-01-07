"use strict";

class Room extends Block {
    constructor(width, length, height) {
        super(width, length, height);

        this.furnitures = [];

        this.onFurnituresChanged = new Delegates("furnitures");
    }

    addFurniture(furniture) {
        if (!this.furnitures.includes(furniture)) {
            this.furnitures.push(furniture);
            this.onFurnituresChanged.run([...this.furnitures]);
        }
    }

    removeFurniture(furniture) {
        let removed = this.furnitures.remove(furniture);
        if (removed) {
            this.onFurnituresChanged.run([...this.furnitures]);
        }
    }
}
