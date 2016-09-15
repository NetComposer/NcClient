
//=========================================================================
// Class / Command (Cmd) Managers
//=========================================================================
// These managers are set up to handle a Class:Cmd combination
//    like Class: "gt2",  Cmd: "call"  or  Class: "nkmedia"  Cmd: "join"
//    IF both the Class and Command are specified using 
//        addClassManager( mngClass, mngCmd, clsManagerFunction )
// OR fallback to use the manager for a Class if there is no match for the 
//    Class:Cmd combination.  Setting a manager for a class is done by using
//    addClassManager( mngClass, clsManagerFunction )
//
// NOTE: If there is a Class:Cmd manager it will ALWAYS be used instead of the 
//    Class only manager.  Class only managers are used as a fallback IF there
//    is no Class:Cmd manager specified.  
// If one function will handle all Cmd: for a Class then, only that manager
//    needs to be giving - no Class:Cmd managers are required.
// However, if neither a Class:Cmd manager or a Class manager are set up, then
//    then request will NOT be handled and NcLite will be sent an error by
//    WsConnection stating that no manager is set to handle that request.
//-------------------------------------------------------------------------

// addClassManager - The clsManagerFunction will handle any cmd for a class that
//   does not have a more specific handler.  A more specific handler would be one that
//   is specified to handle a class:cmd combination, using 
//      addClassManager( mngClass, mngCmd, clsManagerFunction )
// 
// mngClass - String value the names the class the clsManagerFunction will handle.
// clsManagerFunction - A function that can handle and route all commands (cmd:) for class
//

'use strict';


/**
 * Utils File
 * @class  WsLib
 */
(function (root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("WsLib", [], factory);
	else if(typeof exports === 'object')
		exports.WsLib = factory();
	else
		root.WsLib = factory();
})(this, function() {

	var WsLibClass = {};
	WsLibClass = function() {
		// Map of Class Managers.  
		// Only 1 manager per Class - like nkmedia, etc.  Core class handled at WsConnection
	};

	WsLibClass.prototype = {

		cloneObj: function(obj) {
		    var copy;

		    // Handle the 3 simple types, and null or undefined
		    if (null === obj || "object" != typeof obj) return obj;

		    // Handle Date
		    if (obj instanceof Date) {
		        copy = new Date();
		        copy.setTime(obj.getTime());
		        return copy;
		    }

		    // Handle Array
		    if (obj instanceof Array) {
		        copy = [];
		        for (var i = 0, len = obj.length; i < len; i++) {
		            copy[i] = this.cloneObj(obj[i]);
		        }
		        return copy;
		    }

		    // Handle Object
		    if (obj instanceof Object) {
		        copy = {};
		        for (var attr in obj) {
		            // if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
		            if (( typeof(obj[attr]) !==  'function') && ( attr !== '__proto__')) copy[attr] = this.cloneObj(obj[attr]);
		        }
		        return copy;
		    }

		    throw new Error("Unable to copy obj! Its type isn't supported.");
		},		// close function 

		cloneObj4Log: function(obj, maxIndividualLength ) {
		    var copy;
		    var maxILen = (( !!maxIndividualLength) && (maxIndividualLength >= 20 )) ? maxIndividualLength : 20;

		    // Handle the 3 simple types, and null or undefined
		    if ( ( typeof(obj) != 'undefined' ) && ( null !== obj )) {
		    	if ( ( typeof(obj) == 'boolean') || ( typeof(obj) == 'number') ) {
		    		return obj;
		    	} else if ( typeof(obj) == 'string' ) {
		    		return ( obj.length < maxILen ) ? obj : obj.substring(0, maxILen) + "...";
		    	}
		    } else if ( typeof(obj) == 'undefined' ) {
		    	return "undefined";
		    } else if ( null === obj ) {
		    	return "null";
		    }

		    // if (null !== obj && "boolean" === typeof obj) return obj;

		    // if (null == obj || "object" != typeof obj) return ( obj.length < maxILen ) ? obj : obj.substring(0, maxILen) + "...";

		    // Handle Date
		    if (obj instanceof Date) {
		        copy = new Date();
		        copy.setTime(obj.getTime());
		        return copy;
		    }

		    // Handle Array
		    if (obj instanceof Array) {
		        copy = [];
		        for (var i = 0, len = obj.length; i < len; i++) {
		            copy[i] = this.cloneObj4Log(obj[i], maxIndividualLength);
		        }
		        return copy;
		    }

		    // Handle Object
		    if (obj instanceof Object) {
		        copy = {};
		        for (var attr in obj) {
		            // if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
		            if (( typeof(obj[attr]) !==  'function') && ( attr !== '__proto__')) copy[attr] = this.cloneObj4Log(obj[attr], maxIndividualLength);
		        }
		        return copy;
		    }

		    throw new Error("Unable to copy obj! Its type isn't supported. Type = " + (typeof(obj))  );
		}	// close function 


	};	// Close WsLibClass.prototype


	var WsLib = new WsLibClass();
	return WsLib;
});
