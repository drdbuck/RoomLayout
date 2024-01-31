"use strict";

const stringifyGroup = [
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

}
