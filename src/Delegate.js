"use strict";

class Delegate {
    constructor(requireExplicitContinue) {
        this.delegateList = [];
        //True: after processing, each delegate must return true to remain in the queue
        this.requireExplicitContinue = requireExplicitContinue ?? false;
    }

    add(func){
        if (!func){
            reportInternalError(false,"func cannot be null or undefined! func: ", func);
            return;
        }
        if (!this.contains(func)) {
            this.delegateList.push(func);
        }
    }

    run(...params){
        let returnValList = [];
        //Run delegates
        for (let i = 0; i < this.delegateList.length; i++) {
            let returnVal = this.delegateList[i](...params);
            returnValList.push(returnVal);
            //keep in queue?
            let keepInQueue = !!returnVal;
            if (this.requireExplicitContinue && !keepInQueue){
                this.delegateList[i] = undefined;
            }
        }
        //Remove blank spaces in queue
        this.delegateList = this.delegateList.filter(f => f);
        //Return vals
        return returnValList;
    }

    /**
     * Runs the delegate and returns true or false, and'ing the return value of the delegates together
     * @returns {boolean}
     * */
    runAnd(...params) {
        let returnValList = this.run(...params);
        let andResult = returnValList.length === 0 || returnValList.every(val => val);
        return andResult;
    }

    /**
     * Runs the delegate and returns true or false, or'ing the return value of the delegates together
     * @returns {boolean}
     * */
    runOr(...params) {
        let returnValList = this.run(...params);
        let orResult = returnValList.length === 0 || returnValList.some(val => val);
        return orResult;
    }

    contains(func){
        return this.delegateList.includes(func);
    }

    remove(func){
        let index = this.delegateList.indexOf(func);
        if (index >= 0) {
            this.delegateList.splice(index, 1);
        }
    }
}