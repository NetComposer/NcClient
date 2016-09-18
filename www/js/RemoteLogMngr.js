// https://github.com/gabrielnahmias/Console.js  
'use strict';

const RemoteLogMngr_Version = "RemoteLogMngr 1.0.0";


class RemoteLogMngr {


    static get className() { return "RemoteLogMngr"; }
	static toString() { return `[object RemoteLogMngr]`; }
    
    static get version() { return RemoteLogMngr_Version; }
    static get versions() { return `${RemoteLogMngr_Version} --> Ojbect`; }

	static toJSON() {
		var jsonData = {
			listeners: RemoteLogMngr.listeners
		};

		return jsonData;
	}


	static init() {

		if ( !! RemoteLogMngr._isInited ) {
			return;
		}

		RemoteLogMngr._isInited				= true;


		RemoteLogMngr.logNumber = 0;
		RemoteLogMngr.loggerId = RemoteLogMngr.createUuid();
		RemoteLogMngr.webSocketManager = null;

		RemoteLogMngr.consoleLogLevel = 7;
		RemoteLogMngr.remoteLogLevel = 5;
		
		RemoteLogMngr.gelfHostName = "not set";
		RemoteLogMngr.isFullStackPrinted = true;

		RemoteLogMngr.restoreConsoleFlag = true;

		RemoteLogMngr.realConsoleFunctions = {};

		RemoteLogMngr.webSocketSessionId = "not set";

		RemoteLogMngr.isEventListenerSet = false;


		RemoteLogMngr.OFF = 0;
		RemoteLogMngr.ALERT = 1;
		RemoteLogMngr.CRITICAL = 2;
		RemoteLogMngr.ERROR = 3;
		RemoteLogMngr.WARN = 4;
		RemoteLogMngr.INFO = 5;		// Same as Notice
		RemoteLogMngr.LOG = 6;		// Same as Normal
		RemoteLogMngr.DEBUG = 7;		// Same as Trace

		RemoteLogMngr.copyConsoleFuntions();	// Once only at initialization!!!
		RemoteLogMngr.restoreConsole(); 		// Used to set console funtions like 'alert' that are not part of standard console.

	}

		static createUuid() {
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		    	var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
		    	return v.toString(16);
				});
		}

		static connectWithWebSocket( ) {
			if ( RemoteLogMngr.isEventListenerSet === false ) {
				WsMngr.addEventListener( WsMngr.eventNames.onWsSessionIdChanged, RemoteLogMngr.onWsSessionIdChanged );
				WsMngr.addEventListener( WsMngr.eventNames.onWsLoginSuccess, RemoteLogMngr.onWsLoginSuccess );
				WsMngr.addEventListener( WsMngr.eventNames.onRemoteLoggerInfo, RemoteLogMngr.onRemoteLoggerInfo );
				WsMngr.addEventListener( WsMngr.eventNames.onRemoteLoggerError, RemoteLogMngr.onRemoteLoggerError );
			}
		}

		static onWsLoginSuccess( ) {
			WsMngr.sendRemoteLogs();
		}

		static onWsSessionIdChanged( Data ) {
			RemoteLogMngr.webSocketSessionId = Data.target;
		}

		static onRemoteLoggerInfo( Data ) {
			if ( Array.isArray( Data.target ) ) {
				RemoteLogMngr.eventBasedRemoteInfo.apply( RemoteLogMngr, Data.target );
			}
		}

		static onRemoteLoggerError( Data ) {
			if ( Array.isArray( Data.target ) ) {
				RemoteLogMngr.eventBasedRemoteError.apply( RemoteLogMngr, Data.target );
			}
		}

		static isDebugOn() {
			return (( RemoteLogMngr.remoteLogLevel === RemoteLogMngr.DEBUG ) || (RemoteLogMngr.consoleLogLevel === RemoteLogMngr.DEBUG ));
		}

		// Only do this once when initializing everything!!!!
		static copyConsoleFuntions() {
			RemoteLogMngr.realConsoleFunctions.error = window.console.error;
			RemoteLogMngr.realConsoleFunctions.warn = window.console.warn;
			RemoteLogMngr.realConsoleFunctions.info = window.console.info;
			RemoteLogMngr.realConsoleFunctions.log = window.console.log;
			RemoteLogMngr.realConsoleFunctions.debug = window.console.debug;
			RemoteLogMngr.realConsoleFunctions.trace = window.console.trace;
			RemoteLogMngr.realConsoleFunctions.clear = window.console.clear;
			RemoteLogMngr.realConsoleFunctions.group = window.console.group;
			RemoteLogMngr.realConsoleFunctions.groupEnd = window.console.groupEnd;
		}

		static restoreConsole() {

			RemoteLogMngr.restoreConsoleFlag = true;

			if ( RemoteLogMngr.consoleLogLevel >= RemoteLogMngr.ALERT ) { 
				window.console.alert = RemoteLogMngr.realConsoleFunctions.error;
			} else { 
				window.console.alert = function() {};
			}

			if ( RemoteLogMngr.consoleLogLevel >= RemoteLogMngr.ERROR ) { 
				window.console.error = RemoteLogMngr.realConsoleFunctions.error;
			} else { 
				window.console.error = function() {};
			}

			if ( RemoteLogMngr.consoleLogLevel >= RemoteLogMngr.WARN ) { 
				window.console.warn = RemoteLogMngr.realConsoleFunctions.warn;
			} else { 
				window.console.warn = function() {};
			}

			if ( RemoteLogMngr.consoleLogLevel >= RemoteLogMngr.INFO ) { 
				window.console.info = RemoteLogMngr.realConsoleFunctions.info;
			} else { 
				window.console.info = function() {};
			}

			if ( RemoteLogMngr.consoleLogLevel >= RemoteLogMngr.LOG ) { 
				window.console.log = RemoteLogMngr.realConsoleFunctions.log;
			} else { 
				window.console.log = function() {};
			}

			if ( RemoteLogMngr.consoleLogLevel >= RemoteLogMngr.DEBUG ) { 
				window.console.debug = RemoteLogMngr.realConsoleFunctions.debug;
			} else { 
				window.console.debug = function() {};
			}

			window.console.group = RemoteLogMngr.realConsoleFunctions.group;
			window.console.groupEnd = RemoteLogMngr.realConsoleFunctions.groupEnd;

			window.console.localErrorOnly = RemoteLogMngr.realConsoleFunctions.error;
			window.console.localWarnOnly = RemoteLogMngr.realConsoleFunctions.warn;
			window.console.localInfoOnly = RemoteLogMngr.realConsoleFunctions.info;
			window.console.localLogOnly = RemoteLogMngr.realConsoleFunctions.log;
			window.console.localDebugOnly = RemoteLogMngr.realConsoleFunctions.debug;


		}

		static replaceConsole(  ) {

			RemoteLogMngr.restoreConsoleFlag = false;
			RemoteLogMngr.connectWithWebSocket();

			window.console.alert = RemoteLogMngr.alert;
			window.console.error = RemoteLogMngr.error;
			window.console.warn = RemoteLogMngr.warn;
			window.console.info = RemoteLogMngr.info;
			window.console.log = RemoteLogMngr.log;
			window.console.debug = RemoteLogMngr.debug;
			window.console.group = RemoteLogMngr.group;
			window.console.groupEnd = RemoteLogMngr.groupEnd;

			window.console.localErrorOnly = RemoteLogMngr.localErrorOnly;
			window.console.localWarnOnly = RemoteLogMngr.localWarnOnly;
			window.console.localInfoOnly = RemoteLogMngr.localInfoOnly;
			window.console.localLogOnly = RemoteLogMngr.localLogOnly;
			window.console.localDebugOnly = RemoteLogMngr.localDebugOnly;

		}

		static setConsoleLevel( LogLevel ) {

			if ( ( typeof(LogLevel) === "number") &&
				( LogLevel >= 0 ) &&
				( LogLevel <= 7 )
				 ) {

				RemoteLogMngr.consoleLogLevel = LogLevel;

				RemoteLogMngr.realConsoleFunctions.log.apply( window.console, ["You set CONSOLE log level to: " + LogLevel ] );	// Do it this way For Safari!

			} else {
				throw("LogLevel must be a number from 0-7! You sent: " + LogLevel );
			}

			if ( RemoteLogMngr.restoreConsoleFlag === true ) {
				RemoteLogMngr.restoreConsole();		// We do this to change functions for things that should not be logged.
			}
		}

		static getConsoleLevel( ) {
			return RemoteLogMngr.consoleLogLevel;
		}

		static setRemoteLevel( LogLevel ) {
			if ( ( typeof(LogLevel) === "number") &&
				( LogLevel >= 0 ) &&
				( LogLevel <= 7 )
				 ) {

				RemoteLogMngr.remoteLogLevel = LogLevel;

				RemoteLogMngr.realConsoleFunctions.log.apply( window.console, ["You set REMOTE log level to: " + LogLevel ] );	// Do it this way For Safari!

			} else {
				throw("Remote LogLevel must be a number from 0-7! You sent: " + LogLevel );
			}			
		}

		static getRemoteLevel( ) {
			return RemoteLogMngr.remoteLogLevel;
		}

		static setGelfHostName( GelfHostName ) {
			RemoteLogMngr.gelfHostName = GelfHostName;
		}

		static setPrintFullStack( TrueFalse ) {
			RemoteLogMngr.isFullStackPrinted = TrueFalse;
		}

		static getLogNumber( ) {
			RemoteLogMngr.logNumber = RemoteLogMngr.logNumber + 1;
			return RemoteLogMngr.logNumber;
		}



		// RemoteLogMngr.ALERT = 1;
		// RemoteLogMngr.CRITICAL = 2;
		// RemoteLogMngr.ERROR = 3;
		// RemoteLogMngr.WARN = 4;
		// RemoteLogMngr.INFO = 5;		// Same as Notice
		// RemoteLogMngr.LOG = 6;		// Same as Normal
		// RemoteLogMngr.DEBUG = 7;		// Same as Trace


		static alert( ) {		// 1 - ALERT
			var setupData = {logLevel: RemoteLogMngr.ALERT, stackShiftAmount: 2, forceSendRemote: false, allowedToSendRemote: true };

			RemoteLogMngr.logIt.apply( this, [ setupData ].concat( Array.from(arguments) ) );
		}

		static error( ) {		// 3 - ERR
			var setupData = {logLevel: RemoteLogMngr.ERROR, stackShiftAmount: 2, forceSendRemote: false, allowedToSendRemote: true };
			RemoteLogMngr.logIt.apply( this, [ setupData ].concat( Array.from(arguments) ) );
		}

		static eventBasedRemoteError( ) {		// 3 - ERR
			var setupData = {logLevel: RemoteLogMngr.ERROR, stackShiftAmount: 3, forceSendRemote: false, allowedToSendRemote: true };
			RemoteLogMngr.logIt.apply( this, [ setupData ].concat( Array.from(arguments) ) );
		}

		static localErrorOnly( ) {
			// This is where we do group things for remote logging .. then call native groupEnd for local stuff
			var setupData = {logLevel: RemoteLogMngr.ERROR, stackShiftAmount: 2, forceSendRemote: false, allowedToSendRemote: false };
			RemoteLogMngr.logIt.apply( this, [ setupData ].concat( Array.from(arguments) ) );
		}

		static warn( ) {		// 4 - WARN
			var setupData = {logLevel: RemoteLogMngr.WARN, stackShiftAmount: 2, forceSendRemote: false, allowedToSendRemote: true };
			RemoteLogMngr.logIt.apply( this, [ setupData ].concat( Array.from(arguments) ) );
		}

		static localWarnOnly( ) {
			var setupData = {logLevel: RemoteLogMngr.WARN, stackShiftAmount: 2, forceSendRemote: false, allowedToSendRemote: false };
			RemoteLogMngr.logIt.apply( this, [ setupData ].concat( Array.from(arguments) ) );
		}

		static info( ) {		// 5 - INFO
			var setupData = {logLevel: RemoteLogMngr.INFO, stackShiftAmount: 2, forceSendRemote: false, allowedToSendRemote: true };
			RemoteLogMngr.logIt.apply( this, [ setupData ].concat( Array.from(arguments) ) );
		}

		static eventBasedRemoteInfo( ) {		// 5 - INFO
			var setupData = {logLevel: RemoteLogMngr.INFO, stackShiftAmount: 3, forceSendRemote: false, allowedToSendRemote: true };
			RemoteLogMngr.logIt.apply( this, [ setupData ].concat( Array.from(arguments) ) );
		}

		static localInfoOnly( ) {
			// This is where we do group things for remote logging .. then call native groupEnd for local stuff
			var setupData = {logLevel: RemoteLogMngr.INFO, stackShiftAmount: 2, forceSendRemote: false, allowedToSendRemote: false };
			RemoteLogMngr.logIt.apply( this, [ setupData ].concat( Array.from(arguments) ) );
		}

		static log( ) {		// 6 - LOG
			var setupData = {logLevel: RemoteLogMngr.LOG, stackShiftAmount: 2, forceSendRemote: false, allowedToSendRemote: true };
			RemoteLogMngr.logIt.apply( this, [ setupData ].concat( Array.from(arguments) ) );
		}

		static localLogOnly( ) {
			// This is where we do group things for remote logging .. then call native groupEnd for local stuff
			var setupData = {logLevel: RemoteLogMngr.LOG, stackShiftAmount: 2, forceSendRemote: false, allowedToSendRemote: false };
			RemoteLogMngr.logIt.apply( this, [ setupData ].concat( Array.from(arguments) ) );
		}

		static debug( ) {		// 7 - DEBUG
			var setupData = {logLevel: RemoteLogMngr.DEBUG, stackShiftAmount: 2, forceSendRemote: false, allowedToSendRemote: true };			
			RemoteLogMngr.logIt.apply( this, [ setupData].concat( Array.from(arguments) ) );
		}

		static localDebugOnly( ) {
			// This is where we do group things for remote logging .. then call native groupEnd for local stuff
			var setupData = {logLevel: RemoteLogMngr.DEBUG, stackShiftAmount: 2, forceSendRemote: false, allowedToSendRemote: false };
			RemoteLogMngr.logIt.apply( this, [ setupData ].concat( Array.from(arguments) ) );
		}


		static group( GroupName ) {
			// This is where we do group things for remote logging .. then call native group for local stuff
			RemoteLogMngr.realConsoleFunctions.group( GroupName );
		}

		static groupEnd( GroupName ) {
			// This is where we do group things for remote logging .. then call native groupEnd for local stuff
			RemoteLogMngr.realConsoleFunctions.groupEnd( GroupName );
		}




		// RemoteLogMngr.OFF = 0;
		// RemoteLogMngr.ALERT = 1;
		// RemoteLogMngr.ERROR = 2;
		// RemoteLogMngr.WARN = 3;
		// RemoteLogMngr.INFO = 4;		// Same as Notice
		// RemoteLogMngr.LOG = 5;		// Same as Normal
		// RemoteLogMngr.DEBUG = 6;		// Same as Trace

		// 			var setupData = {logLevel: 6, stackShiftAmount: 3, allowedToSendRemote: true };			

		static logIt( SetupData, EverythingElseWillBeInArguments ) {		// Generic version - All others call this

			var b = EverythingElseWillBeInArguments;
			var args;
			var module; 
			var stackTrace;
			var timeStamp = new Date();
			var timeStampFormatted = RemoteLogMngr.dateToTime(timeStamp);

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
			if (  SetupData.logLevel <= RemoteLogMngr.consoleLogLevel ) {


				args = Array.prototype.slice.call(arguments, 1);

				if ( args[0].length <= 5 ) {
					module = args[0].toUpperCase();
					args.shift();
				} else {
					module = "    ";
				}

				var logHeader = RemoteLogMngr.header( SetupData.logLevel, SetupData.allowedToSendRemote, module, timeStampFormatted );

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

				stackTrace = RemoteLogMngr.getStackTraceString( theStack, "\n\tStack ->  at ", SetupData.stackShiftAmount );
				// logArray = logArray.concat(args);
				logArray.push( stackTrace );


				// RemoteLogMngr.realConsoleFunctions.log.apply( RemoteLogMngr.realConsoleFunctions, logArray );
				RemoteLogMngr.realConsoleFunctions.log.apply( window.console, logArray );

			}

			// Remote Loggin here IF SetupData.allowedToSendRemote === true 
			if ( SetupData.allowedToSendRemote ) {

				// Remote Log Stuff here
				if ( ( SetupData.logLevel <= RemoteLogMngr.remoteLogLevel ) || ( SetupData.forceSendRemote === true ) ){

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

					message =  module + RemoteLogMngr.levelNumberToName( SetupData.logLevel ) + timeStampFormatted + "  " + args[0];
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
					metaData.jsClient_wsSessionIdAtLog = RemoteLogMngr.webSocketSessionId;
					metaData.jsClient_logLevels = "Console: " + RemoteLogMngr.consoleLogLevel + " Remote: " + RemoteLogMngr.remoteLogLevel;

					remoteLogRetVal = WsMngr.remoteLog( SetupData.logLevel, message, metaData );

					if ( remoteLogRetVal === false ) {

					} else {

					}

				}

			}

		}



		static get fontColors() {
			return {
				ALERT: "White",
				CRITICAL: "White",
				ERROR: "Black",
				WARN: "Black",
				INFO: "Black",
				LOG: "Black",
				DEBUG: "Black"
			};
		}

		static get bgColors() {
			return {
				ALERT: "DarkRed",
				CRITICAL: "DarkRed",
				ERROR: "HotPink",
				WARN: "Orange",
				INFO: "GreenYellow",
				LOG: "Lavender",
				DEBUG: "LightBlue"
			};
		}

		static get font2Colors() {
			return {
				ALERT: "Black",
				CRITICAL: "Black",
				ERROR: "Black",
				WARN: "Black",
				INFO: "Black",
				LOG: "Black",
				DEBUG: "Black"
			};
		}

		static get bg2Colors() {
			return {
				ALERT: "LightPink",
				CRITICAL: "LightPink",
				ERROR: "LightPink",
				WARN: "MistyRose",
				INFO: "LightYellow",
				LOG: "LightYellow",
				DEBUG: "LightYellow"
			};
		}


		static levelNumberToName( LevelNumber ) {
			var levelName; 

			switch(LevelNumber) {
			    case RemoteLogMngr.ALERT:
			        levelName = " ALERT ";
			        break;
			    case RemoteLogMngr.CRITICAL:
			        levelName = " CRIT ";
			        break;
			    case RemoteLogMngr.ERROR:
			        levelName = " ERROR ";
			        break;
			    case RemoteLogMngr.WARN:
			        levelName = " WARN ";
			        break;
			    case RemoteLogMngr.INFO:
			        levelName = " INFO ";
			        break;
			    case RemoteLogMngr.LOG:
			        levelName = " LOG ";
			        break;
			    case RemoteLogMngr.DEBUG:
			        levelName = " DEBUG ";
			        break;
			    default:
					levelName = " Unknown ";
				}

			return levelName;
		}

		static header( LogLevel, RemoteFlag, Module, TimeStampMsFormated ) { 
			var headerCssData = "";
			var otherCssData = "";

			var header;

			var remoteFlag = (( RemoteFlag ) && ( LogLevel <= RemoteLogMngr.remoteLogLevel ) )? "->R": "";

			switch(LogLevel) {
			    case RemoteLogMngr.ALERT:
			        header = "%c" + Module + " ALERT" + remoteFlag + "    " + TimeStampMsFormated + "%c";
			        headerCssData = "background: " + RemoteLogMngr.bgColors.ALERT + "; color: " + RemoteLogMngr.fontColors.ALERT;
			        otherCssData = "background: " + RemoteLogMngr.bg2Colors.ALERT + "; color: " + RemoteLogMngr.font2Colors.ALERT;
			        break;
			    case RemoteLogMngr.CRIT:
			        header = "%c" + Module + " CRIT" + remoteFlag + "    " + TimeStampMsFormated + "%c";
			        headerCssData = "background: " + RemoteLogMngr.bgColors.CRIT + "; color: " + RemoteLogMngr.fontColors.CRIT;
			        otherCssData = "background: " + RemoteLogMngr.bg2Colors.CRIT + "; color: " + RemoteLogMngr.font2Colors.CRIT;
			        break;
			    case RemoteLogMngr.ERROR:
			        header = "%c" + Module + " ERROR" + remoteFlag + "    " + TimeStampMsFormated + "%c";
			        headerCssData = "background: " + RemoteLogMngr.bgColors.ERROR + "; color: " + RemoteLogMngr.fontColors.ERROR;
			        otherCssData = "background: " + RemoteLogMngr.bg2Colors.ERROR + "; color: " + RemoteLogMngr.font2Colors.ERROR;
			        break;
			    case RemoteLogMngr.WARN:
			        header = "%c" + Module + " WARN" + remoteFlag + "  " + TimeStampMsFormated + "%c";
			        headerCssData = "background: " + RemoteLogMngr.bgColors.WARN + "; color: " + RemoteLogMngr.fontColors.WARN;
			        otherCssData = "background: " + RemoteLogMngr.bg2Colors.WARN + "; color: " + RemoteLogMngr.font2Colors.WARN;
			        break;
			    case RemoteLogMngr.INFO:
			        header = "%c" + Module + " INFO" + remoteFlag + "     " + TimeStampMsFormated + "%c";
			        headerCssData = "background: " + RemoteLogMngr.bgColors.INFO + "; color: " + RemoteLogMngr.fontColors.INFO;
			        otherCssData = "background: " + RemoteLogMngr.bg2Colors.INFO + "; color: " + RemoteLogMngr.font2Colors.INFO;
			        break;
			    case RemoteLogMngr.LOG:
			        header = "%c" + Module + " LOG" + remoteFlag + "     " + TimeStampMsFormated + "%c";
			        headerCssData = "background: " + RemoteLogMngr.bgColors.LOG + "; color: " + RemoteLogMngr.fontColors.LOG;
			        otherCssData = "background: " + RemoteLogMngr.bg2Colors.LOG + "; color: " + RemoteLogMngr.font2Colors.LOG;
			        break;
			    case RemoteLogMngr.DEBUG:
			        header = "%c" + Module + " DEBUG" + remoteFlag + "    " + TimeStampMsFormated + "%c";
			        headerCssData = "background: " + RemoteLogMngr.bgColors.DEBUG + "; color: " + RemoteLogMngr.fontColors.DEBUG;
			        otherCssData = "background: " + RemoteLogMngr.bg2Colors.DEBUG + "; color: " + RemoteLogMngr.font2Colors.DEBUG;
			        break;
			    default:
			        header = "%c" + Module + " ALERT" + remoteFlag + "   --No Level Provided-- " + TimeStampMsFormated + "%c";
			        headerCssData = "background: " + RemoteLogMngr.bgColors.ALERT + "; color: " + RemoteLogMngr.fontColors.ALERT;
			        otherCssData = "background: " + RemoteLogMngr.bg2Colors.ALERT + "; color: " + RemoteLogMngr.font2Colors.ALERT;
			}

			// var header = "%c" + Module + " " + levelName + " " + TimeStampMsFormated; 

			return { header: header, headerCssData: headerCssData, otherCssData: otherCssData };
		}


		// static ln() {
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


	  //   static getStackTrace( TheStack, StackShiftAmount ) {
	    	
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


	    static getStackTraceString( TheStack, PrependString, StackShiftAmount ) {
	    	// var stack = RemoteLogMngr.getStackTrace( TheStack, StackShiftAmount );


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


	    	if ( RemoteLogMngr.isFullStackPrinted ) {
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
	    }

		static pad(pad, str, padLeft) {
			if (typeof str === 'undefined') {
				return pad;
			}

			if (padLeft) {
				return (pad + str).slice(-pad.length);
			} else {
				return (str + pad).substring(0, pad.length);
			}
		}

		static dateToTime( dtt ) {
			return RemoteLogMngr.pad("00", dtt.getHours(), true) + ":" + 
				RemoteLogMngr.pad("00", dtt.getMinutes(), true) + ":" + 
				RemoteLogMngr.pad("00", dtt.getSeconds(), true) + "." + 
				RemoteLogMngr.pad("000", dtt.getMilliseconds(), false);
		}


}

RemoteLogMngr.init();
