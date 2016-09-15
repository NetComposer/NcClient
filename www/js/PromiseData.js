'use strict';

/**
 * Object to pass in and out of promises that all use the same input and output
 * @param  {this}	Self 	The instance to be passed
 * @param  {whatever}	Args 	Generally speaking we do not want to pass in arguments (rather get them from the instance), but we can put anything in here
 * @return {PromiseData}
 */
class PromiseData {

    /**
     * @param  {this}	Self 	The instance to be passed
     * @param  {whatever}	Args 	Generally speaking we do not want to pass in arguments (rather get them from the instance), but we can put anything in here
     * @return {PromiseData}
     */
    constructor( Self ) {
    	this._self = Self;
    	this._data = null;
    	// this._args = Args;
    	// this._resolve = null;
    }

    get self() {
    	return this._self;
    }

    set data( Data ) {
    	this._data = Data;
    }

    get data() {
    	return this._data;
    }

    toString(){
    	return `[object PromiseData = ${JSON.stringify(this)}]`;
    }
}
