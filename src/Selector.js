"use strict";

/**
 * Class for selecting groups of objects.
 * Meant to work with groups of objects, not groups of primitives or groups of arrays
 */
class Selector {
    constructor() {
        this._selection = [];

        this.onSelectionChanged = new Delegate("selection");
        this.onSelectionLost = new Delegate("oldselect");
        this.onSelectionGained = new Delegate("newselect");
    }

    get selection() {
        return this._selection.slice();
    }

    get count() {
        return this._selection.length;
    }

    /**
     * Select the given item
     * @param {object} item The item to select
     * @param {boolean} [add=true] Whether or not to add the item to the list. If false, clears the list first
     */
    select(item, add = true) {
        if (!add) {
            this.selectOnly(item);
            return;
        }
        if (!this._selection.includes(item)) {
            this._selection.push(item);
            this.onSelectionGained.run(item);
            this.onSelectionChanged.run(this._selection);
        }
    }

    /**
     * Select the given items
     * @param  {...object} items The items to select
     */
    selectAll(...items) {
        items = items.flat();
        let oldlength = this._selection.length;
        for (let item of items) {
            if (!this._selection.includes(item)) {
                this._selection.push(item);
                this.onSelectionGained.run(item);
            }
        }
        if (this._selection.length != oldlength) {
            this.onSelectionChanged.run(this._selection);
        }
    }

    /**
     * Selects the given item, deselecting all other selected items first
     * @param {object} item The object to select
     */
    selectOnly(item) {
        if (!item) { return; }
        //clear
        for (let item1 of this._selection) {
            this.onSelectionLost.run(item1);
        }
        this._selection.length = 0;
        //select
        this._selection.push(item);
        this.onSelectionGained.run(item);
        this.onSelectionChanged.run(this._selection);
    }

    /**
     * Deselect the given item
     * @param {object} item The object to deselect
     */
    deselect(item) {
        let removed = this._selection.remove(item);
        if (removed) {
            this.onSelectionLost.run(item);
            this.onSelectionChanged.run(this._selection);
        }
    }

    /**
     * Deselect all the selected items
     */
    clear() {
        for (let item of this._selection) {
            this.onSelectionLost.run(item);
        }
        this._selection.length = 0;
        this.onSelectionChanged.run(this._selection);
    }

    /**
     * Runs the given function over all the selected items
     * @param {(item:object)=>void} func The function that will process the selected items
     */
    forEach(func) {
        if (!func) {
            console.error("Missing func!", func);
            return;
        }
        //
        this._selection.forEach(func);
    }

    /**
     * Returns true if at least one item meets the given condition
     * @param {(item:object)=>boolean} func
     * @returns True if at least one item meets the given condition
     */
    some(func) {
        return this._selection.some(func);
    }
}
