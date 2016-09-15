'use strict';

const EventMngr_Version = "EventMngr 1.0.0";


class EventMngr {

    constructor( ) {
    	this.listeners = {};
	}


	get className() { return EventMngr.className; }
	toString() { return `[object ${this.className}]`; }

    static get className() { return "EventMngr"; }
	static toString() { return `[object EventMngr]`; }

	get version() { return EventMngr.version; }
	get versions() { return EventMngr.versions; }

    static get version() { return EventMngr_Version; }
    static get versions() { return `${EventMngr_Version} --> Ojbect`; }  // there is no super for this.

	toJSON() {
		var jsonData = {
			listeners: this.listeners
		};

		return jsonData;
	}


	addEventListener(CbName, Callback, ...TheArgs ) {
		var dbg = new DebugData( EventMngr.className, this, "addEventListener", CbName, Callback, TheArgs ).dbgEnter( true );

		if ( typeof CbName === 'undefined' || typeof this.eventNames[ CbName ] === 'undefined' ) {
			var cbNameError = new Error( `EventMngr.addEventListener: Cannot add Event Listener for CbName = ${CbName}.  That is not an event available for ${this.toString()}` );
			throw(cbNameError);
		}

		if ( typeof Callback !== 'function' ) {
			var cbError = new Error( `EventMngr.addEventListener: Cannot add Event Listener for Callback that is not a function. Make sure Callback is a function!` );
			throw(cbError);			
		}

		// var args = [];
		// var numOfArgs = arguments.length;

		// for ( var i = 0; i < numOfArgs; i++ ) {
		// 	args.push( arguments[i] );
		// }

		// args = args.length > 3 ? args.splice(3, args.length-1) : [];

		if ( typeof this.listeners[CbName] !== 'undefined' ) {
			this.listeners[CbName].push( 
				{ 
					callback: Callback,
					args: TheArgs 
				} 
			);
		} else {
			this.listeners[CbName] = [ 
				{
					callback: Callback,
					args: TheArgs
				} 
			];
		}
		dbg.dbgExit();
	}

	removeEventListener( CbName, Callback ) {
		var dbg = new DebugData( EventMngr.className, this, "removeEventListener", CbName, Callback ).dbgEnter( true );

		if ( typeof CbName === 'undefined' || typeof this.eventNames[ CbName ] === 'undefined' ) {
			var cbNameError = new Error( `EventMngr.removeEventListener: Cannot remove Event Listener for CbName = ${CbName}.  That is not an event available for ${this.toString()}` );
			throw(cbNameError);
		}

		if ( typeof Callback !== 'function' ) {
			var cbError = new Error( `EventMngr.removeEventListener: Cannot remove Event Listener for Callback that is not a function. Make sure Callback is a function!` );
			throw(cbError);			
		}

		if ( typeof this.listeners[CbName] === 'undefined' ) {
			dbg.infoMessage( `EventMngr.removeEventListener: Cannot remove Event Listener for CbName = ${CbName} because it has not been previously added.` );
		}

		var numOfCallbacks = this.listeners[CbName].length;
		var newArray = [];

		for ( var i = 0; i < numOfCallbacks; i++ ) {
			var listener = this.listeners[CbName][i];

			if ( listener.callback === Callback) {
				
			} else {
				newArray.push(listener);
			}
		}
		
		this.listeners[CbName] = newArray;

		dbg.dbgExit();
	}

	hasEventListener( CbName, Callback ) {
		var dbg = new DebugData( EventMngr.className, this, "hasEventListener", CbName, Callback ).dbgEnter( true );

		if ( typeof this.listeners[CbName] !== 'undefined' ) {

			var numOfCallbacks = this.listeners[CbName].length;
			
			if ( typeof Callback === 'undefined' ) {
				return numOfCallbacks > 0;
			}

			for ( var i = 0; i < numOfCallbacks; i++ ) {

				var listener = this.listeners[CbName][i];

				if ( listener.callback === Callback) {
					return true;
				}
			}
		}

		dbg.dbgExit( false );
		return false;
	}

	dispatchEvent( CbName, CbEvent, ...TheArgs ) {
		var dbg = new DebugData( EventMngr.className, this, "dispatchEvent", CbName, CbEvent, TheArgs ).dbgEnter( true );

		if ( typeof CbName === 'undefined' ) {
			var myError = new Error( `EventMngr.dispatchEvent: Cannot dispatch Event for CbName = ${CbName}. It is undefined!` );
			throw(myError);
		}

		var numOfListeners = 0;
		var i;

		var event = {
			type: CbName,
			target: CbEvent
		};

		var args = [];

		// var numOfArgs = arguments.length;
		// for( i=0; i<numOfArgs; i++){
		// 	args.push(arguments[i]);
		// }

		// args = args.length > 2 ? args.splice(2, args.length-1) : [];

		args = [event].concat(TheArgs);

		if ( typeof this.listeners[ CbName ] !== 'undefined' ) {

			var numOfCallbacks = this.listeners[ CbName ].length;
			
			for ( i = 0; i < numOfCallbacks; i++ ) {

				var listener = this.listeners[ CbName ][ i ];
				
				if ( listener && listener.callback ) {

					var concatArgs = args.concat(listener.args);
					listener.callback.apply(listener.scope, concatArgs);
					numOfListeners += 1;
				}
			}
		}

		dbg.dbgExit();
	}

	getEvents() {
		var dbg = new DebugData( EventMngr.className, this, "getEvents" ).dbgEnter( );

		var str = "";
		
		for ( var type in this.listeners ) {
			var numOfCallbacks = this.listeners[type].length;

			for ( var i = 0; i < numOfCallbacks; i++ ) {
				var listener = this.listeners[type][i];
				str += listener.scope && listener.scope.className ? listener.scope.className : "anonymous";
				str += " listen for '" + type + "'\n";
			}
		}
		dbg.dbgExit( str );
		return str;
	}










	static addEventListener(type, callback, scope) {
		var args = [];
		var numOfArgs = arguments.length;
		for ( var i=0; i<numOfArgs; i++){
			args.push(arguments[i]);
		}		
		args = args.length > 3 ? args.splice(3, args.length-1) : [];

		if ( typeof EventMngr.listeners === 'undefined') { EventMngr.listeners = {}; }

		if ( typeof EventMngr.listeners[type] !== 'undefined' ) {
			EventMngr.listeners[type].push({scope:scope, callback:callback, args:args});
		} else {
			EventMngr.listeners[type] = [{scope:scope, callback:callback, args:args}];
		}
	}

	static removeEventListener(type, callback, scope) {
		if ( typeof EventMngr.listeners[type] !== 'undefined' ) {
			var numOfCallbacks = EventMngr.listeners[type].length;
			var newArray = [];
			for ( var i=0; i<numOfCallbacks; i++) {
				var listener = EventMngr.listeners[type][i];
				if(listener.scope === scope && listener.callback === callback) {
					
				} else {
					newArray.push(listener);
				}
			}
			EventMngr.listeners[type] = newArray;
		}
	}

	static hasEventListener(type, callback, scope) {
		if ( typeof EventMngr.listeners[type] !== 'undefined' ) {
			var numOfCallbacks = EventMngr.listeners[type].length;
			if ( callback === 'undefined' && scope === 'undefined' ){
				return numOfCallbacks > 0;
			}
			for ( var i=0; i<numOfCallbacks; i++) {
				var listener = EventMngr.listeners[type][i];
				if((scope ? listener.scope === scope : true) && listener.callback === callback) {
					return true;
				}
			}
		}
		return false;
	}

	static dispatchEvent(type, target) {
		var numOfListeners = 0;
		var i;

		var event = {
			type:type,
			target:target
		};
		var args = [];
		var numOfArgs = arguments.length;
		for( i=0; i<numOfArgs; i++){
			args.push(arguments[i]);
		}

		args = args.length > 2 ? args.splice(2, args.length-1) : [];
		args = [event].concat(args);
		if ( typeof EventMngr.listeners[type] !== 'undefined' ) {
			var numOfCallbacks = EventMngr.listeners[type].length;
			for( i=0; i<numOfCallbacks; i++) {
				var listener = EventMngr.listeners[type][i];
				if(listener && listener.callback) {					
					var concatArgs = args.concat(listener.args);
					listener.callback.apply(listener.scope, concatArgs);
					numOfListeners += 1;
				}
			}
		}
	}

	static getEvents() {
		var str = "";
		for ( var type in EventMngr.listeners) {
			var numOfCallbacks = EventMngr.listeners[type].length;
			for ( var i=0; i<numOfCallbacks; i++) {
				var listener = EventMngr.listeners[type][i];
				str += listener.scope && listener.scope.className ? listener.scope.className : "anonymous";
				str += " listen for '" + type + "'\n";
			}
		}
		return str;
	}

}
