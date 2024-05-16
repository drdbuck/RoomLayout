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

    get first() {
        return this._selection[0];
    }

    get last() {
        return this._selection.at(-1);
    }

    /**
     * Returns true if the given item is selected
     * @param {object} item The item to test if it is selected
     */
    isSelected(item) {
        this._selection.includes(item);
    }

    /**
     * Select the given item
     * @param {object} item The item to select
     * @param {boolean} [add=true] Whether or not to add the item to the list. If false, clears the list first
     */
    select(item, add = true) {
        if (!item) { return; }
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
        items = items.flat().filter(item=>item!=undefined);
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
        let removeList = [...this._selection];
        this._selection.length = 0;
        //select
        this._selection.push(item);
        //delegates
        for (let item1 of removeList) {
            this.onSelectionLost.run(item1);
        }
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
     * Keep only the selected items that make the given filterFunc return true
     * @param {(obj: any) => boolean} filterFunc
     */
    filter(filterFunc) {
        this._selection = this._selection.filter(c => {
            let pass = filterFunc(c);
            if (pass) {
                return true;
            }
            else {
                this.onSelectionLost.run(c);
                return false;
            }
        })
        this.onSelectionChanged.run(this._selection);
    }

    /**
     * Deselect all the selected items
     */
    clear() {
        let removeList = [...this._selection];
        this._selection.length = 0;
        for (let item of removeList) {
            this.onSelectionLost.run(item);
        }
        this.onSelectionChanged.run(this._selection);
    }

    /**
     * Returns the first item that matches the given condition
     * @param {(item:object)=>boolean} func The function to test each item
     */
    find(func) {
        return this._selection.find(func);
    }

    /**
     * Returns the all items that match the given condition
     * @param {(item:object)=>boolean} func The function to test each item
     */
    findAll(func) {
        return this._selection.filter(func);
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
     * Maps the selected items using the given func
     * @param {(item:object)=>any} func The function to use to map the items
     * @returns
     */
    map(func) {
        return this._selection.map(func);
    }

    /**
     * Returns true if at least one item meets the given condition
     * @param {(item:object)=>boolean} func
     * @returns True if at least one item meets the given condition
     */
    some(func) {
        return this._selection.some(func);
    }

    /**
     * Sorts the selection using the given func
     * @param {(item:object, item:object)=>number} func
     */
    sort(func) {
        this._selection.sort(func);
    }
}
