"use strict";

/**
 * Class for selecting groups of objects.
 * Meant to work with groups of objects, not groups of primitives or groups of arrays
 */
class Selector{
    constructor() {
        this.selection = [];

        this.onSelectionChanged = new Delegate("selection");
        this.onSelectionLost = new Delegate("oldselect");
        this.onSelectionGained = new Delegate("newselect");
    }

    /**
     * Select the given item
     * @param {object} item The item to select
     */
    select(item) {
        if (!this.selection.includes(item)) {
            this.selection.push(item);
            this.onSelectionGained.run(item);
            this.onSelectionChanged.run(this.selection);
        }
    }

    /**
     * Select the given items
     * @param  {...object} items The items to select
     */
    selectAll(...items) {
        items = items.flat();
        let oldlength = this.selection.length;
        for (let item of items) {
            if (!this.selection.includes(item)) {
                this.selection.push(item);
                this.onSelectionGained.run(item);
            }
        }
        if (this.selection.length != oldlength) {
            this.onSelectionChanged.run(this.selection);
        }
    }

    /**
     * Deselect the given item
     * @param {object} item The object to deselect
     */
    deselect(item) {
        let removed = this.selection.remove(item);
        if (removed) {
            this.onSelectionLost.run(item);
            this.onSelectionChanged.run(this.selection);
        }
    }

    /**
     * Deselect all the selected items
     */
    clear() {
        for (let item of this.selection) {
            this.onSelectionLost.run(item);
        }
        this.selection.length = 0;
        this.onSelectionChanged.run(this.selection);
    }
}
