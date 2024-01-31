"use strict";

const stringifyKitBash = [
    "indexs",
];

class KitBash {
    constructor() {
        this._items = [];
        this.indexs = [];
    }

    get items() {
        return [...this._items];
    }

    add(item) {
        if (!this._items.includes(item)) {
            this._items.push(item);
        }
    }

    remove(item) {
        if (this._items.includes(item)) {
            this._items.remove(item);
        }
    }

    has(item) {
        return this._items.includes(item);
    }

    prepareForSave(indexFunc) {
        this.indexs = this._items.map(indexFunc);
    }

    constructAfterLoad(itemFunc) {
        this._items = this.indexs.map(itemFunc);
    }

}

function inflateKitBash(kitbash) {
    let inflated = inflateObject(
        kitbash,
        KitBash.prototype,
        []
    );
    if (!inflated) { return; }
}
