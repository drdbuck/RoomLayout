"use strict";

const stringifyKitBash = [
    "_items",
];

class KitBash extends Block {
    constructor(items = []) {
        super();

        this.isKitBash = true;

        this._items = [];
        items.filter(i => i).forEach(item => this.add(item));
    }

    get items() {
        return [...this._items];
    }

    add(item) {
        //early exit: invalid item
        if (!item) { return; }
        //early exit: item is kitbash
        if (item.isKitBash) { return; }
        //
        //tell item its in a new group now
        item.group = this;
        //
        if (!this._items.includes(item)) {
            this._items.push(item);
            //remove from other group if necessary
            item.group?.remove(item);
            //
            this.onItemAdded.run(item);
        }
    }

    remove(item) {
        if (item?.group == this) {
            item.group = undefined;
        }
        if (this._items.includes(item)) {
            this._items.remove(item);
            this.onItemRemoved.run(item);
        }
    }

    has(item) {
        return this._items.includes(item);
    }

}

function inflateKitBash(kitbash) {

    kitbash.isKitBash = true;

    let inflated = inflateObject(
        kitbash,
        KitBash.prototype,
        ["onItemAdded", "onItemRemoved"]
    );
    if (!inflated) { return; }

    inflateBlock(kitbash);

    backwardsCompatifyKitBash(kitbash);

    for (let item of kitbash._items) {
        item.room = kitbash.room;
        item.group = kitbash;
        inflateFurniture(item);
    }

}

function backwardsCompatifyKitBash(kitbash) {
    //Refactor 1: list -> selectable object
    if (kitbash.indexs) {
        kitbash._items = kitbash.indexs.map(kitbash.itemFunc);
    }
}
