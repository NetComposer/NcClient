// https://github.com/gabrielnahmias/Console.js  
'use strict';

// var WebSocketManager = window.WebSocketManager;
// var NcEvents = window.NcEvents;


/**
 * Remote Logger
 * @class  RemoteLogger
 */

(function (root, factory) {
	if(typeof exports === 'object' && typeof module === 'object') {
		module.exports = factory();
	} else if(typeof define === 'function' && define.amd) {
		define("RemoteLogger", [], factory);
	} else if(typeof exports === 'object') {
		exports.RemoteLogger = factory();
	} else {
		root.RemoteLogger = factory();
	}
})(this, function() {

	var RemoteLoggerClass = {};
	
	RemoteLoggerClass = function() {
		// var self = this;

		this.logNumber = 0;
		this.loggerId = this.createUuid();
		this.webSocketManager = null;

		this.consoleLogLevel = 7;
		this.remoteLogLevel = 5;
		
		this.gelfHostName = "not set";
		this.isFullStackPrinted = true;

		this.restoreConsoleFlag = true;

		this.realConsoleFunctions = {};

		this.webSocketSessionId = "not set";

		this.isEventListenerSet = false;


		this.OFF = 0;
		this.ALERT = 1;
		this.CRITICAL = 2;
		this.ERROR = 3;
		this.WARN = 4;
		this.INFO = 5;		// Same as Notice
		this.LOG = 6;		// Same as Normal
		this.DEBUG = 7;		// Same as Trace

		this.copyConsoleFuntions();	// Once only at initialization!!!
		this.restoreConsole(); 		// Used to set console funtions like 'alert' that are not part of standard console.
	};

	RemoteLoggerClass.prototype = {
		createUuid:function() {
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		    	var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
		    	return v.toString(16);
				});
		},

		connectWithWebSocket:function( ) {
			if ( this.isEventListenerSet === false ) {
				WebSocketManager.addEventListener( NcEvents.onSessionIdChanged, this.onSessionIdChanged );
				WebSocketManager.addEventListener( NcEvents.onLoginSuccess, this.onLoginSuccess );
				WebSocketManager.addEventListener( NcEvents.onRemoteLoggerInfo, this.onRemoteLoggerInfo );
				WebSocketManager.addEventListener( NcEvents.onRemoteLoggerError, this.onRemoteLoggerError );
			}
		},

		onLoginSuccess:function( ) {
			WebSocketManager.sendRemoteLogs();
		},

		onSessionIdChanged:function( Data ) {
			RemoteLogger.webSocketSessionId = Data.target;
		},

		onRemoteLoggerInfo:function( Data ) {
			if ( Array.isArray( Data.target ) ) {
				RemoteLogger.eventBasedRemoteInfo.apply( RemoteLogger, Data.target );
			}
		},

		onRemoteLoggerError:function( Data ) {
			if ( Array.isArray( Data.target ) ) {
				RemoteLogger.eventBasedRemoteError.apply( RemoteLogger, Data.target );
			}
		},

		isDebugOn() {
			return (( this.remoteLogLevel === this.DEBUG ) || (this.consoleLogLevel === this.DEBUG ));
		},

		// Only do this once when initializing everything!!!!
		copyConsoleFuntions:function() {
			this.realConsoleFunctions.error = window.console.error;
			this.realConsoleFunctions.warn = window.console.warn;
			this.realConsoleFunctions.info = window.console.info;
			this.realConsoleFunctions.log = window.console.log;
			this.realConsoleFunctions.debug = window.console.debug;
			this.realConsoleFunctions.trace = window.console.trace;
			this.realConsoleFunctions.clear = window.console.clear;
			this.realConsoleFunctions.group = window.console.group;
			this.realConsoleFunctions.groupEnd = window.console.groupEnd;
		},

		restoreConsole:function() {

			this.restoreConsoleFlag = true;

			if ( this.consoleLogLevel >= this.ALERT ) { 
				window.console.alert = this.realConsoleFunctions.error;
			} else { 
				window.console.alert = function() {};
			}

			if ( this.consoleLogLevel >= this.ERROR ) { 
				window.console.error = this.realConsoleFunctions.error;
			} else { 
				window.console.error = function() {};
			}

			if ( this.consoleLogLevel >= this.WARN ) { 
				window.console.warn = this.realConsoleFunctions.warn;
			} else { 
				window.console.warn = function() {};
			}

			if ( this.consoleLogLevel >= this.INFO ) { 
				window.console.info = this.realConsoleFunctions.info;
			} else { 
				window.console.info = function() {};
			}

			if ( this.consoleLogLevel >= this.LOG ) { 
				window.console.log = this.realConsoleFunctions.log;
			} else { 
				window.console.log = function() {};
			}

			if ( this.consoleLogLevel >= this.DEBUG ) { 
				window.console.debug = this.realConsoleFunctions.debug;
			} else { 
				window.console.debug = function() {};
			}

			window.console.group = this.realConsoleFunctions.group;
			window.console.groupEnd = this.realConsoleFunctions.groupEnd;

			window.console.localErrorOnly = this.realConsoleFunctions.error;
			window.console.localWarnOnly = this.realConsoleFunctions.warn;
			window.console.localInfoOnly = this.realConsoleFunctions.info;
			window.console.localLogOnly = this.realConsoleFunctions.log;
			window.console.localDebugOnly = this.realConsoleFunctions.debug;


		},

		replaceConsole:function(  ) {

			RemoteLogger.restoreConsoleFlag = false;
			RemoteLogger.connectWithWebSocket();

			window.console.alert = this.alert;
			window.console.error = this.error;
			window.console.warn = this.warn;
			window.console.info = this.info;
			window.console.log = this.log;
			window.console.debug = this.debug;
			window.console.group = this.group;
			window.console.groupEnd = this.groupEnd;

			window.console.localErrorOnly = this.localErrorOnly;
			window.console.localWarnOnly = this.localWarnOnly;
			window.console.localInfoOnly = this.localInfoOnly;
			window.console.localLogOnly = this.localLogOnly;
			window.console.localDebugOnly = this.localDebugOnly;

		},

		setConsoleLevel:function( LogLevel ) {

			if ( ( typeof(LogLevel) === "number") &&
				( LogLevel >= 0 ) &&
				( LogLevel <= 7 )
				 ) {

				this.consoleLogLevel = LogLevel;

				RemoteLogger.realConsoleFunctions.log.apply( window.console, ["You set CONSOLE log level to: " + LogLevel ] );	// Do it this way For Safari!

			} else {
				throw("LogLevel must be a number from 0-7! You sent: " + LogLevel );
			}

			if ( RemoteLogger.restoreConsoleFlag === true ) {
				RemoteLogger.restoreConsole();		// We do this to change functions for things that should not be logged.
			}
		},

		getConsoleLevel:function( ) {
			return RemoteLogger.consoleLogLevel;
		},

		setRemoteLevel:function( LogLevel ) {
			if ( ( typeof(LogLevel) === "number") &&
				( LogLevel >= 0 ) &&
				( LogLevel <= 7 )
				 ) {

				this.remoteLogLevel = LogLevel;

				RemoteLogger.realConsoleFunctions.log.apply( window.console, ["You set REMOTE log level to: " + LogLevel ] );	// Do it this way For Safari!

			} else {
				throw("Remote LogLevel must be a number from 0-7! You sent: " + LogLevel );
			}			
		},

		getRemoteLevel:function( ) {
			return RemoteLogger.remoteLogLevel;
		},

		setWebSocketManager:function( WebSocketManagerInstance ) {
			this.webSocketManager = WebSocketManagerInstance;
		},

		setGelfHostName:function( GelfHostName ) {
			this.gelfHostName = GelfHostName;
		},

		setPrintFullStack:function( TrueFalse ) {
			this.isFullStackPrinted = TrueFalse;
		},

		getLogNumber:function( ) {
			this.logNumber = this.logNumber + 1;
			return this.logNumber;
		},



		// this.ALERT = 1;
		// this.CRITICAL = 2;
		// this.ERROR = 3;
		// this.WARN = 4;
		// this.INFO = 5;		// Same as Notice
		// this.LOG = 6;		// Same as Normal
		// this.DEBUG = 7;		// Same as Trace


		alert:function( ) {		// 1 - ALERT
			var setupData = {logLevel: RemoteLogger.ALERT, stackShiftAmount: 2, forceSendRemote: false, allowedToSendRemote: true };

			RemoteLogger.logIt.apply( this, [ setupData ].concat( Array.from(arguments) ) );
		},

		error:function( ) {		// 3 - ERR
			var setupData = {logLevel: RemoteLogger.ERROR, stackShiftAmount: 2, forceSendRemote: false, allowedToSendRemote: true };
			RemoteLogger.logIt.apply( this, [ setupData ].concat( Array.from(arguments) ) );
		},

		eventBasedRemoteError:function( ) {		// 3 - ERR
			var setupData = {logLevel: RemoteLogger.ERROR, stackShiftAmount: 3, forceSendRemote: false, allowedToSendRemote: true };
			RemoteLogger.logIt.apply( this, [ setupData ].concat( Array.from(arguments) ) );
		},

		localErrorOnly:function( ) {
			// This is where we do group things for remote logging .. then call native groupEnd for local stuff
			var setupData = {logLevel: RemoteLogger.ERROR, stackShiftAmount: 2, forceSendRemote: false, allowedToSendRemote: false };
			RemoteLogger.logIt.apply( this, [ setupData ].concat( Array.from(arguments) ) );
		},

		warn:function( ) {		// 4 - WARN
			var setupData = {logLevel: RemoteLogger.WARN, stackShiftAmount: 2, forceSendRemote: false, allowedToSendRemote: true };
			RemoteLogger.logIt.apply( this, [ setupData ].concat( Array.from(arguments) ) );
		},

		localWarnOnly:function( ) {
			var setupData = {logLevel: RemoteLogger.WARN, stackShiftAmount: 2, forceSendRemote: false, allowedToSendRemote: false };
			RemoteLogger.logIt.apply( this, [ setupData ].concat( Array.from(arguments) ) );
		},

		info:function( ) {		// 5 - INFO
			var setupData = {logLevel: RemoteLogger.INFO, stackShiftAmount: 2, forceSendRemote: false, allowedToSendRemote: true };
			RemoteLogger.logIt.apply( this, [ setupData ].concat( Array.from(arguments) ) );
		},

		eventBasedRemoteInfo:function( ) {		// 5 - INFO
			var setupData = {logLevel: RemoteLogger.INFO, stackShiftAmount: 3, forceSendRemote: false, allowedToSendRemote: true };
			RemoteLogger.logIt.apply( this, [ setupData ].concat( Array.from(arguments) ) );
		},

		localInfoOnly:function( ) {
			// This is where we do group things for remote logging .. then call native groupEnd for local stuff
			var setupData = {logLevel: RemoteLogger.INFO, stackShiftAmount: 2, forceSendRemote: false, allowedToSendRemote: false };
			RemoteLogger.logIt.apply( this, [ setupData ].concat( Array.from(arguments) ) );
		},

		log:function( ) {		// 6 - LOG
			var setupData = {logLevel: RemoteLogger.LOG, stackShiftAmount: 2, forceSendRemote: false, allowedToSendRemote: true };
			RemoteLogger.logIt.apply( this, [ setupData ].concat( Array.from(arguments) ) );
		},

		localLogOnly:function( ) {
			// This is where we do group things for remote logging .. then call native groupEnd for local stuff
			var setupData = {logLevel: RemoteLogger.LOG, stackShiftAmount: 2, forceSendRemote: false, allowedToSendRemote: false };
			RemoteLogger.logIt.apply( this, [ setupData ].concat( Array.from(arguments) ) );
		},

		debug:function( ) {		// 7 - DEBUG
			var setupData = {logLevel: RemoteLogger.DEBUG, stackShiftAmount: 2, forceSendRemote: false, allowedToSendRemote: true };			
			RemoteLogger.logIt.apply( this, [ setupData].concat( Array.from(arguments) ) );
		},

		localDebugOnly:function( ) {
			// This is where we do group things for remote logging .. then call native groupEnd for local stuff
			var setupData = {logLevel: RemoteLogger.DEBUG, stackShiftAmount: 2, forceSendRemote: false, allowedToSendRemote: false };
			RemoteLogger.logIt.apply( this, [ setupData ].concat( Array.from(arguments) ) );
		},


		group:function( GroupName ) {
			// This is where we do group things for remote logging .. then call native group for local stuff
			RemoteLogger.realConsoleFunctions.group( GroupName );
		},

		groupEnd:function( GroupName ) {
			// This is where we do group things for remote logging .. then call native groupEnd for local stuff
			RemoteLogger.realConsoleFunctions.groupEnd( GroupName );
		},




		// this.OFF = 0;
		// this.ALERT = 1;
		// this.ERROR = 2;
		// this.WARN = 3;
		// this.INFO = 4;		// Same as Notice
		// this.LOG = 5;		// Same as Normal
		// this.DEBUG = 6;		// Same as Trace

		// 			var setupData = {logLevel: 6, stackShiftAmount: 3, allowedToSendRemote: true };			

		logIt:function( SetupData, EverythingElseWillBeInArguments ) {		// Generic version - All others call this

			var args;
			var module; 
			var stackTrace;
			var timeStamp = new Date();
			var timeStampFormatted = RemoteLogger.dateToTime(timeStamp);

			var theStack = new Error();

			if ( ! theStack.stack ) {
				try {
					// IE requires the Error to actually be throw or else the Error's 'stack' property is undefined.
					throw theStack;
				} catch (theStack) {
					if (!theStack.stack) {
					  return 0; // IE < 10, likely
					}
				}
			}


			// Console Log Stuff here
			if (  SetupData.logLevel <= RemoteLogger.consoleLogLevel ) {


				args = Array.prototype.slice.call(arguments, 1);

				if ( args[0].length <= 5 ) {
					module = args[0].toUpperCase();
					args.shift();
				} else {
					module = "    ";
				}

				var logHeader = RemoteLogger.header( SetupData.logLevel, SetupData.allowedToSendRemote, module, timeStampFormatted );

				var logArray = [ logHeader.header, logHeader.headerCssData, logHeader.otherCssData ];

				// if ( typeof( args === "object" ) && ( typeof( args[0] ) === "string" ) ) {
				// 	logArray[0] = logHeader.header + " " +  args[0];
				// 	args.shift();
				// } else if ( typeof( args ) === "string" ) {
				// 	logArray[0] = logHeader.header + " " + args;
				// 	args = [];
				// }

				if ( typeof( args ) === "object" ) {
					while(  typeof( args[0] ) === 'string' ) {
						logArray[0] = logArray[0] + " " +  args[0];
						args.shift();
					}
				} else if ( typeof( args ) === "string" ) {
					logArray[0] = logArray[0] + " " + args;
					args = [];
				}

				while ( args.length !== 0 ) {
					logArray.push( "\n\t\t");
					logArray.push( args[0] );
					args.shift();
				}

				stackTrace = RemoteLogger.getStackTraceString( theStack, "\n\tStack ->  at ", SetupData.stackShiftAmount );
				// logArray = logArray.concat(args);
				logArray.push( stackTrace );


				// RemoteLogger.realConsoleFunctions.log.apply( RemoteLogger.realConsoleFunctions, logArray );
				RemoteLogger.realConsoleFunctions.log.apply( window.console, logArray );

			}

			// Remote Loggin here IF SetupData.allowedToSendRemote === true 
			if ( SetupData.allowedToSendRemote ) {

				// Remote Log Stuff here
				if ( ( SetupData.logLevel <= RemoteLogger.remoteLogLevel ) || ( SetupData.forceSendRemote === true ) ){

					var message = "";
					var metaData = {};
					var remoteLogRetVal; 
					args = Array.prototype.slice.call(arguments, 1);
					

					if ( args[0].length <= 5 ) {
						module = args[0].toUpperCase();
						metaData.jsClient_module = module;
						args.shift();
					} else {
						module = "";
					}

					message =  module + RemoteLogger.levelNumberToName( SetupData.logLevel ) + timeStampFormatted + "  " + args[0];
					args.shift();

					var argsLength = args.length;

					for (var i = 0; i < argsLength; i++) {
						if ( typeof args[i] !== 'undefined' ) {
							var msg = args[i];

							if ( typeof args[i] === 'object' ) {
								msg = DebugData.JsonTab( args[i] );
							}

							metaData[ "jsClient_msg" + ( i + 1) ] = msg;
						}
					}

					metaData.jsClient_stackTrace = stackTrace;
					metaData.jsClient_timeStamp = timeStamp.getTime();
					metaData.jsClient_timeStampFormatted = timeStampFormatted;
					metaData.jsClient_wsSessionIdAtLog = RemoteLogger.webSocketSessionId;
					metaData.jsClient_logLevels = "Console: " + RemoteLogger.consoleLogLevel + " Remote: " + RemoteLogger.remoteLogLevel;

					remoteLogRetVal = window.WebSocketManager.remoteLog( SetupData.logLevel, message, metaData );

					if ( remoteLogRetVal === false ) {

					} else {

					}

				}

			}

		},



		fontColors: {
			ALERT: "White",
			CRITICAL: "White",
			ERROR: "Black",
			WARN: "Black",
			INFO: "Black",
			LOG: "Black",
			DEBUG: "Black"
		},

		bgColors: {
			ALERT: "DarkRed",
			CRITICAL: "DarkRed",
			ERROR: "HotPink",
			WARN: "Orange",
			INFO: "GreenYellow",
			LOG: "Lavender",
			DEBUG: "LightBlue"
		},

		font2Colors: {
			ALERT: "Black",
			CRITICAL: "Black",
			ERROR: "Black",
			WARN: "Black",
			INFO: "Black",
			LOG: "Black",
			DEBUG: "Black"
		},

		bg2Colors: {
			ALERT: "LightPink",
			CRITICAL: "LightPink",
			ERROR: "LightPink",
			WARN: "MistyRose",
			INFO: "LightYellow",
			LOG: "LightYellow",
			DEBUG: "LightYellow"
		},


		levelNumberToName:function( LevelNumber ) {
			var levelName; 

			switch(LevelNumber) {
			    case RemoteLogger.ALERT:
			        levelName = " ALERT ";
			        break;
			    case RemoteLogger.CRITICAL:
			        levelName = " CRIT ";
			        break;
			    case RemoteLogger.ERROR:
			        levelName = " ERROR ";
			        break;
			    case RemoteLogger.WARN:
			        levelName = " WARN ";
			        break;
			    case RemoteLogger.INFO:
			        levelName = " INFO ";
			        break;
			    case RemoteLogger.LOG:
			        levelName = " LOG ";
			        break;
			    case RemoteLogger.DEBUG:
			        levelName = " DEBUG ";
			        break;
			    default:
					levelName = " Unknown ";
				}

			return levelName;
		},

		header:function( LogLevel, RemoteFlag, Module, TimeStampMsFormated ) { 
			var headerCssData = "";
			var otherCssData = "";

			var header;

			var remoteFlag = (( RemoteFlag ) && ( LogLevel <= RemoteLogger.remoteLogLevel ) )? "->R": "";

			switch(LogLevel) {
			    case RemoteLogger.ALERT:
			        header = "%c" + Module + " ALERT" + remoteFlag + "    " + TimeStampMsFormated + "%c";
			        headerCssData = "background: " + this.bgColors.ALERT + "; color: " + this.fontColors.ALERT;
			        otherCssData = "background: " + this.bg2Colors.ALERT + "; color: " + this.font2Colors.ALERT;
			        break;
			    case RemoteLogger.CRIT:
			        header = "%c" + Module + " CRIT" + remoteFlag + "    " + TimeStampMsFormated + "%c";
			        headerCssData = "background: " + this.bgColors.CRIT + "; color: " + this.fontColors.CRIT;
			        otherCssData = "background: " + this.bg2Colors.CRIT + "; color: " + this.font2Colors.CRIT;
			        break;
			    case RemoteLogger.ERROR:
			        header = "%c" + Module + " ERROR" + remoteFlag + "    " + TimeStampMsFormated + "%c";
			        headerCssData = "background: " + this.bgColors.ERROR + "; color: " + this.fontColors.ERROR;
			        otherCssData = "background: " + this.bg2Colors.ERROR + "; color: " + this.font2Colors.ERROR;
			        break;
			    case RemoteLogger.WARN:
			        header = "%c" + Module + " WARN" + remoteFlag + "  " + TimeStampMsFormated + "%c";
			        headerCssData = "background: " + this.bgColors.WARN + "; color: " + this.fontColors.WARN;
			        otherCssData = "background: " + this.bg2Colors.WARN + "; color: " + this.font2Colors.WARN;
			        break;
			    case RemoteLogger.INFO:
			        header = "%c" + Module + " INFO" + remoteFlag + "     " + TimeStampMsFormated + "%c";
			        headerCssData = "background: " + this.bgColors.INFO + "; color: " + this.fontColors.INFO;
			        otherCssData = "background: " + this.bg2Colors.INFO + "; color: " + this.font2Colors.INFO;
			        break;
			    case RemoteLogger.LOG:
			        header = "%c" + Module + " LOG" + remoteFlag + "     " + TimeStampMsFormated + "%c";
			        headerCssData = "background: " + this.bgColors.LOG + "; color: " + this.fontColors.LOG;
			        otherCssData = "background: " + this.bg2Colors.LOG + "; color: " + this.font2Colors.LOG;
			        break;
			    case RemoteLogger.DEBUG:
			        header = "%c" + Module + " DEBUG" + remoteFlag + "    " + TimeStampMsFormated + "%c";
			        headerCssData = "background: " + this.bgColors.DEBUG + "; color: " + this.fontColors.DEBUG;
			        otherCssData = "background: " + this.bg2Colors.DEBUG + "; color: " + this.font2Colors.DEBUG;
			        break;
			    default:
			        header = "%c" + Module + " ALERT" + remoteFlag + "   --No Level Provided-- " + TimeStampMsFormated + "%c";
			        headerCssData = "background: " + this.bgColors.ALERT + "; color: " + this.fontColors.ALERT;
			        otherCssData = "background: " + this.bg2Colors.ALERT + "; color: " + this.font2Colors.ALERT;
			}

			// var header = "%c" + Module + " " + levelName + " " + TimeStampMsFormated; 

			return { header: header, headerCssData: headerCssData, otherCssData: otherCssData };
		},


		// ln:function() {
		// 	var e = new Error();
		// 	if (!e.stack) try {
		// 		// IE requires the Error to actually be throw or else the Error's 'stack' property is undefined.
		// 		throw e;
		// 	} catch (e) {
		// 		if (!e.stack) {
		// 		  return 0; // IE < 10, likely
		// 		}
		// 	}

		// 	var stack = e.stack.toString().split(/\r\n|\n/);
		// 	// We want our caller's frame. It's index into |stack| depends on the
		// 	// browser and browser version, so we need to search for the second frame:
		// 	var frameRE = /:(\d+):(?:\d+)[^\d]*$/;
			
		// 	do {
		// 		var frame = stack.shift();
		// 	} while (!frameRE.exec(frame) && stack.length);

		// 	return frameRE.exec(stack.shift())[1];
		// },


	  //   getStackTrace:function( TheStack, StackShiftAmount ) {
	    	
		 //  // 	var stack = e.stack.replace(/^[^\(]+?[\n$]/gm, '')
			// 	// .replace(/^\s+at\s+/gm, '')
			// 	// .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
			// 	// .split(/\r\n|\n/);

		 //  	var stack = TheStack.stack.replace(/^\s+at\s+/gm, '')
			// 	.replace(/\@/gm, ' ')
			// 	.replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
			// 	.split(/\r\n|\n/);

			// var shiftNum = (( !!StackShiftAmount) && ( typeof(StackShiftAmount) === "number")) ? StackShiftAmount : 1;

			// if ( stack[0] === "Error") { stack.shift(); }	// Handle differences in Chrome vs Safari and Firefox
			// if ( stack[ stack.length - 1 ] === "") { stack.pop(); }	// Handle differences in Chrome vs Safari and Firefox

			// for (var i = shiftNum; i >= 0; i--) {
		 //    	stack.shift();
			// }

		 //    return stack;
	  //   },


	    getStackTraceString:function( TheStack, PrependString, StackShiftAmount ) {
	    	// var stack = this.getStackTrace( TheStack, StackShiftAmount );


	    	var retString = PrependString;

		  	var stack = TheStack.stack.replace(/^\s+at\s+/gm, '')
				.replace(/\@/gm, ' ')
				.replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
				.split(/\r\n|\n/);

			var shiftNum = (( !!StackShiftAmount) && ( typeof(StackShiftAmount) === "number")) ? StackShiftAmount : 1;

			if ( stack[0] === "Error") { stack.shift(); }	// Handle differences in Chrome vs Safari and Firefox
			if ( stack[ stack.length - 1 ] === "") { stack.pop(); }	// Handle differences in Chrome vs Safari and Firefox

			for (var i = shiftNum; i > 0; --i ) {
		    	stack.shift();
			}


	    	if ( this.isFullStackPrinted ) {
				stack.forEach( function( Str ) { 
					retString = retString + Str + " \n\t\t at ";
				});
				retString = retString.substring(0, retString.length - 6 );

	    	} else {
	    		retString = retString + stack[0];
	    	}

			// var re = /\(|\)/g;
			// retString = retString.replace( re, '');

			return retString;
	    },

		pad:function(pad, str, padLeft) {
			if (typeof str === 'undefined') {
				return pad;
			}

			if (padLeft) {
				return (pad + str).slice(-pad.length);
			} else {
				return (str + pad).substring(0, pad.length);
			}
		},

		dateToTime:function( dtt ) {
			return this.pad("00", dtt.getHours(), true) + ":" + 
				this.pad("00", dtt.getMinutes(), true) + ":" + 
				this.pad("00", dtt.getSeconds(), true) + "." + 
				this.pad("000", dtt.getMilliseconds(), false);
		},


	};
	var RemoteLogger = new RemoteLoggerClass();
	return RemoteLogger;
});

// new RemoteLogger();
