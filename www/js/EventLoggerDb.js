
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


const EventLoggerDb_Version = "EventLoggerDb 1.0.0";


class EventLoggerDb {

    constructor( ) {
	}


	get className() { return EventLoggerDb.className; }
	toString() { return `[object ${this.className}]`; }

    static get className() { return "EventLoggerDb"; }
	static toString() { return `[object EventLoggerDb]`; }

	get version() { return EventLoggerDb.version; }
	get versions() { return EventLoggerDb.versions; }

    static get version() { return EventLoggerDb_Version; }
    static get versions() { return `${EventLoggerDb_Version} --> Ojbect`; }  // there is no super for this.

	toJSON() {
		var jsonData = {
			logDb: EventLoggerDb._logDb,
			counter: EventLoggerDb._counter,
			header: EventLoggerDb._headerStr
		};

		return jsonData;
	}



	static init() {

		if ( !! EventLoggerDb._isInited ) {
			return;
		}

		EventLoggerDb._isInited				= true;

		// Getters Only
		EventLoggerDb._logDb = [];
		EventLoggerDb._headerStr = "";
		EventLoggerDb._counter = 0;

	}



	static getShortId( ThreeCharNamePrefix ) {
		EventLoggerDb._counter = EventLoggerDb._counter + 1;
		return ThreeCharNamePrefix.substring(0,3) + EventLoggerDb.pad("000", EventLoggerDb._counter, true);
	}
	static getEvent( EventNumber ) {
		return EventLoggerDb._logDb[ EventNumber ];
	}

	static push( EventObject ) {
		EventLoggerDb.init();
		EventLoggerDb._logDb.push(EventObject);		// Put in the logging Array (DB like) 
	}

	static header( HeaderString ) {
		EventLoggerDb._headerStr = HeaderString;
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
		return EventLoggerDb.pad("00", dtt.getHours(), true) + ":" + 
			EventLoggerDb.pad("00", dtt.getMinutes(), true) + ":" + 
			EventLoggerDb.pad("00", dtt.getSeconds(), true) + "." + 
			EventLoggerDb.pad("000", dtt.getMilliseconds(), false);
	}

	static argsFormater( args, maxIndividualLength ) {
		var bigLength = 180;
		var smallLength = (( !!maxIndividualLength) && (maxIndividualLength >= bigLength )) ? maxIndividualLength : bigLength;
		var retVal = args;

		if ( args === "" ) { 
			return args;
		}

		var cloneOjb = EventLoggerDb.cloneObj4Log( args, smallLength );
		retVal = JSON.stringify( cloneOjb );

		return ( retVal.length <= bigLength ) ? retVal : retVal.substring(1, bigLength) + "...";

	}

	static json_stringify( Data ) {
		if ( !! Data ) {
			return JSON.stringify(Data);
		} else {
			return "";
		}
	}


	static cloneObj4Log(obj, maxIndividualLength ) {
	    var copy;
	    var maxILen = (( !!maxIndividualLength) && (maxIndividualLength >= 20 )) ? maxIndividualLength : 20;

	    // Handle the 3 simple types, and null or undefined
	    if ( ( typeof(obj) !== 'undefined' ) && ( null !== obj )) {
	    	if ( ( typeof(obj) === 'boolean') || ( typeof(obj) === 'number') ) {
	    		return obj;
	    	} else if ( typeof(obj) === 'string' ) {
	    		return ( obj.length < maxILen ) ? obj : obj.substring(0, maxILen) + "...";
	    	}
	    } else if ( typeof(obj) === 'undefined' ) {
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
	            copy[i] = EventLoggerDb.cloneObj4Log(obj[i], maxIndividualLength);
	        }
	        return copy;
	    }

	    // Handle Object
	    if (obj instanceof Object) {
	        copy = {};
	        for (var attr in obj) {
	            // if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
	            if (( typeof(obj[attr]) !==  'function') && ( attr !== '__proto__')) {
	            	copy[attr] = EventLoggerDb.cloneObj4Log(obj[attr], maxIndividualLength);
	            }
	        }
	        return copy;
	    }

	    throw new Error("Unable to copy obj! Its type isn't supported. Type = " + (typeof(obj))  );
	}	// close function 



	//=========================================================================
	// PUBLIC: wsConnLogger(...) 
	//=========================================================================
	// Log WebSocket Connection things ...
	// 
	// @param	State:  String - Tells what state "onConnect", "onClose", etc
	// @param	Event: Object - The Event from the websocket callback or {} 
	//					or { header: "things in here" }
	// @param	StartDate: Date - The date of the WS start
	//-------------------------------------------------------------------------
	static wsConnLogger( State, ThisEvent, StartDate ) {
		// var dTime = new Date();

		var wsEvt = EventLoggerDb.createAndLogEvent( "WebSkt", "CORE", State, ThisEvent, "wsConn" );
		wsEvt.setRoundTripAlert( false );		// Do this befor setting other things.
		wsEvt.setStartDate( StartDate );
		wsEvt.setSuccess( ThisEvent );

		// var evtObj = {
		// 	type: "wsConn",
		// 	date: dTime,
		// 	connDate: StartDate,		// Should be when connection started trying.
		// 	roundTrip: (dTime - StartDate),
		// 	state: State,
		// 	evt: ThisEvent
		// };
		// this.push(evtObj);
	}

	static pingLogger( evt ) {
		var evtObj = {
			type: "ping",
			evt: evt, 
			date: new Date()
		};
		EventLoggerDb.push(evtObj);		// Put in the logging Array (DB like) 
	}


	static createAndLogEvent( CallingModShortName, TypeStr, FunctionNameStr, Args, FormatType ) {
		var logEvent = new LoggerEvent( CallingModShortName, TypeStr, FunctionNameStr, Args, FormatType );
		EventLoggerDb.push(logEvent);
		return logEvent;
	}

	static wRtcLogger( Event ) {
		var dTime = new Date();
		var evtObj = {
			type: "wRtc",
			date: dTime,
			evt: Event 
		};
		EventLoggerDb.push(evtObj);
	}


	//=========================================================================
	// PUBLIC: queueLogger(...) 
	//=========================================================================
	// Log Queue details 
	// 
	// @param	Name:  String - Name of the queue
	// @param	Queue: Object - The queue or {} 
	//-------------------------------------------------------------------------
	static queueLogger( Name, Queue ) {
		var evtObj = {
			type: Name,
			date: new Date(),
			queString: EventLoggerDb.json_stringify(Queue), 
			que: JSON.parse(EventLoggerDb.json_stringify(Queue)) // A Copy Object Function ... 
		};
		EventLoggerDb.push(evtObj);		// Put in the logging Array (DB like) 
	}

	static stringLogger( LogLevel, LogString ) {
		var evtObj = {
			type: "LStr",
			date: new Date(),
			logLevel: LogLevel, 
			logString: LogString // A Copy Object Function ... 
		};
		EventLoggerDb.push(evtObj);		// Put in the logging Array (DB like) 
	}

	static objectLogger( LogLevel, LogString, LogObject ) {
		var evtObj = {
			type: "LObj",
			date: new Date(),
			logLevel: LogLevel, 
			logObject: LogObject,
			logString: LogString // A Copy Object Function ... 
		};
		EventLoggerDb.push(evtObj);		// Put in the logging Array (DB like) 
	}

	static getJsonLogData( ) {
		return EventLoggerDb.json_stringify( EventLoggerDb._logDb );
	}

	static dataToString( Data ) {

		// if ((!!Data) && ( typeof(Data) === 'object' )) {
		if (!!Data)  {
			if ( Data.toString() === "[object Object]" ) {
				return JSON.stringify( Data );
			} else if ( Data.toString() === "[object MediaStream]" ) {
				return "MediaStream: { active: " + Data.active + ", id: " + Data.id + " }"; 
			} else if ( Data.toString() === "[object RTCIceCandidateEvent]" ) {
				return "RTCIceCandidateEvent: { " +
					"iceConnectionState: " + Data.currentTarget.iceConnectionState +
					", iceGatheringState: " + Data.currentTarget.iceGatheringState +
					", signalingState: " + Data.currentTarget.signalingState +
					" }"; 
			} else {
				return JSON.stringify( Data );
			}
		} else {
			return "";
		}
	} 

	static mainFormater( logObj, loopNumber, extraFirstLine ) {
	    var logData =  
	    	EventLoggerDb.pad("0000", loopNumber, true) + ") " +
	    	logObj.rtFlag +

	    	(( !!logObj.errorVal ) ? " ERR" : "    " ) +
	    	(( !!logObj.hasReturned ) ? " y" : " N") +

	    	EventLoggerDb.pad("         ", logObj.roundTrip, true) + "  " +
	    	EventLoggerDb.dateToTime( logObj.startDate )  +

	    	" | "  +
	    	((logObj.callingModShortName !== null) ? logObj.callingModShortName.substring(0,6) + " ": "       " )  +
	    	logObj.type  +
	    	" | "  +
	    	(( !!logObj.direction && (logObj.direction  === "inbound" )) ? "<- " : ((logObj.direction === "outbound") ? "-> " : "   ") ) +

	    	logObj.functionName  +
	    	(( !!extraFirstLine ) ? extraFirstLine : "") +

	    	"\n\t\t\t  Args: ( " + EventLoggerDb.argsFormater(logObj.arguments, 100) + " )" +
	    	"\n\t\t\t  RetVal: ";

	    	var tmpVal;

	    	if ( logObj.errorVal ) {
	    		tmpVal = "ERROR: " + EventLoggerDb.dataToString(logObj.errorVal);
	    		logData = logData + ((tmpVal.length > 130) ? tmpVal.substring(0,100) + " ..." : tmpVal );
	    	} else {
	    		tmpVal = EventLoggerDb.argsFormater(logObj.returnValShort, 60) + " " + EventLoggerDb.dataToString(logObj.returnVal);
	    		logData = logData + ((tmpVal.length > 130) ? tmpVal.substring(0,100) + " ..." : tmpVal );

	    	}
		 return logData;
	}

	//=========================================================================
	// PUBLIC: showSimpleLogs(...) 
	//=========================================================================
	// When NetComposer initates a request, this JS Object is created as a wrapper
	//     for logging and other things.
	// 
	// @param	consoleLogTF: Boolean - If true then things get sent to the console.log
	// @param	showEventTF: Boolean - If consoleLogTF = true AND showEventTF = true
	//					then also print the Event Ojbects on the console.log so they
	//					can be viewed in detail.
	// @return 	String with logging details.  It is the same thing that would get
	// 					printed on console.log with showSimpleLogs( true, false )
	//-------------------------------------------------------------------------

	static showSimpleLogs(  consoleLogTF, showEventTF  ) {
		var arrayLength = EventLoggerDb._logDb.length;
		var retData = 
		"Evt#) T Err Dn RndTrip  StartTime      Module Type   NC Function\n" +
		"----- - --- -- -------  ------------ | ------ ---- | -- -----------------";


		 // "Version: " + this.CODE_REV + "  Host: " + self.host +
			// "  Port: " + self.port + "\n" +
			// "LoginObj: " + this.json_stringify(LoginObj) + "\n--------------------";


		for (var i = 0; i < arrayLength; i++) {

			var logObj = EventLoggerDb._logDb[i];
			var logAck = "no";
			var logData = ""; 
			var iFormat = EventLoggerDb.pad("0000", i, true) + ") ";
			var extraFirstLine;
			var objKeys;

			if ( logObj.type ) {

				// ========= Client Based Events ==================
				if ( logObj.type === "SendObj") {

					console.log("i = " + i + ") skip for SendObj");

					if ( logObj.ackDate > 0 ) {
						logAck = "" + (logObj.ackDate - logObj.sentDate);
					}

					extraFirstLine = " tid: " + logObj.tid +
				    	" Sts: " + logObj.status +
				    	" Ack: " + logAck;

					logData = EventLoggerDb.mainFormater( logObj.evtLogObj, i, extraFirstLine );
					logData = logData + "\n";
					 
				} else if ( logObj.type === "RecvObj" ) {

					if ( logObj.ackDate > 0 ) {
						logAck = "" + (logObj.ackDate - logObj.arriveDate);
					}

				    logData =  
				    	iFormat  +
				    	EventLoggerDb.dateToTime( logObj.arriveDate )  +
				    	" | RECV | "  +
				    	logObj.wsRecvData.class + "/" + logObj.wsRecvData.cmd  +
				    	" tid: " + logObj.tid  +
				    	" Sts: " + logObj.status  +
				    	"  rt: " + logObj.roundTrip  +
				    	" Ack: " + logAck  +
				    	"\n\t\t Recv: " + EventLoggerDb.json_stringify(logObj.wsRecvData.data) +
				    	"\n\t\t Send: " + EventLoggerDb.json_stringify(logObj.wsResponseData.data);


				} else if ( logObj.type === "wsConn" ) {
					var header = ""; 
					if ( (!!logObj.evt) && (!!logObj.evt.header) ) {
						header = logObj.evt.header;
					} 

				    logData =  
				    	iFormat + 
				    	EventLoggerDb.dateToTime( logObj.date ) + 
				    	" | WSkt | State: " + logObj.state + " connectTime: " + logObj.roundTrip + header;

				} else if ( logObj.type === "sentQueue" ) {
				    logData =  
				    	// iFormat + EventLoggerDb.pad("                  ", "", true) 
				    	iFormat + EventLoggerDb.pad("= WS Closed =     ", "", true) +
				    	EventLoggerDb.dateToTime( logObj.date ) +
				    	" | Queue  Sent | Waiting for NC response \n\t\t\t  Sent Queue: ";
				    	// + logObj.queString;

				    	objKeys = Object.keys(logObj.que);

				    	if ( objKeys.length > 0 ) {
				    		objKeys.forEach( function ( q ) {

				    			var jsonQ = JSON.stringify( logObj.que[q].wsSendData );
					    		logData = logData +
					    			"\n\t\t\t\t  " +
					    			"tid: " + logObj.que[q].tid  +
					    			" " + ((jsonQ.length > 130) ? jsonQ.substring(0,100) + " ..." : jsonQ );
				    		});
				    	} else {
				    		logData = logData + "{}";
				    	}


				} else if ( logObj.type === "recvQueue" ) {
				    logData =  
				    	iFormat + EventLoggerDb.pad("= WS Closed =     ", "", true) +
				    	EventLoggerDb.dateToTime( logObj.date ) +
				    	" | Queue  Recv | Waiting for Client Response \n\t\t\t  Recv Queue: ";
				    	 // + logObj.queString;

				    	objKeys = Object.keys(logObj.que);

				    	if ( objKeys.length > 0 ) {
				    		objKeys.forEach( function ( q ) {

				    			var jsonQ = JSON.stringify( logObj.que[q].wsRecvData );
					    		logData = logData  +
					    			"\n\t\t\t\t  " +
					    			"tid: " + logObj.que[q].tid  +
					    			" " + ((jsonQ.length > 130) ? jsonQ.substring(0,100) + " ..." : jsonQ );
				    		});
				    	} else {
				    		logData = logData + "{}";
				    	}

				} else if ( logObj.type === "toSendQueue" ) {
				    logData =  
				    	iFormat + EventLoggerDb.pad("= WS Closed =     ", "", true)  +
				    	EventLoggerDb.dateToTime( logObj.date ) +
				    	" | Queue  Prep | Not Yet Sent \n\t\t\t  Prep Queue: ";

				    	if ( logObj.que.length > 0 ) {
				    		logData.que.forEach( function ( q ) {
				    			var jsonQ = JSON.stringify( q );
					    		logData = logData +
					    		"\n\t\t\t\t  " +
								((jsonQ.length > 130) ? jsonQ.substring(0,100) + " ..." : jsonQ );
				    		});
				    	} else {
				    		logData = logData + "{}";
				    	}

				} else if ( logObj.type === "LStr" ) {
				    logData =  
				    	iFormat + EventLoggerDb.pad("                  ", "", true)  +
				    	EventLoggerDb.dateToTime( logObj.date ) +
				    	" | Object Logs | LogLevel: " + logObj.logLevel + "\n\t\t  Log: " + logObj.logString;

				} else if ( logObj.type === "LObj" ) {
				    logData =  
				    	iFormat + EventLoggerDb.pad("                  ", "", true)  +
				    	EventLoggerDb.dateToTime( logObj.date ) +
				    	" | Object Logs | LogLevel: " + logObj.logLevel + "\n\t\t  Log: " + logObj.logString +
				    	"\n\t\t  " + EventLoggerDb.json_stringify(logObj.logObject);

				} else if ( logObj.type === "ping" ) {
				    logData =  
				    	iFormat + EventLoggerDb.pad("                  ", "", true)  +
				    	EventLoggerDb.dateToTime( logObj.date ) +
				    	" | WsMngr ping | tid: " + logObj.evt.tid;

				} else if (( logObj.formatType === "generic") ||
						(logObj.formatType === "wRtcCore" ) ||
						(logObj.formatType === "wRtcEvent" ) ||
						(logObj.formatType === "wRtcPromiseGroup" )
						) {

					logData = EventLoggerDb.mainFormater( logObj, i );

				} else if ( logObj.formatType === "wsSend") {

					extraFirstLine = " tid: " + logObj.tid  +
				    	" Sts: " + logObj.status  +
				    	" Ack: " + ((( !!logObj.ackDate ) && (logObj.ackDate > 0 )) ? (logObj.ackDate - logObj.startDate) : "no" );

					logData = EventLoggerDb.mainFormater( logObj, i, extraFirstLine );

				} else if ( logObj.formatType === "wsRecv") {

					extraFirstLine = " tid: " + logObj.tid  +
				    	" Sts: " + logObj.status  +
				    	" Ack: " + ((( !!logObj.ackDate ) && (logObj.ackDate > 0 )) ? (logObj.ackDate - logObj.startDate) : "no" );

					logData = EventLoggerDb.mainFormater( logObj, i, extraFirstLine );

				} else if ( logObj.formatType === "wsConn") {

					logData = iFormat +
			    	EventLoggerDb.pad("-WSckt-", "", true) +
	    			EventLoggerDb.pad("         ", logObj.roundTrip, true) + "  " +
			    	EventLoggerDb.dateToTime( logObj.startDate )  +

			    	" | "  +
			    	((logObj.callingModShortName !== null) ? logObj.callingModShortName.substring(0,6) + " ": "       " )  +
			    	logObj.type  +
			    	" | "  +
			    	logObj.functionName  +
			    	"\n\t\t\t  ( " + EventLoggerDb.argsFormater(logObj.arguments,80) + " )";

				} else {
					console.log( "\n\n### Non documented event ", JSON.stringify( logObj, null, '\t') );

						logData = EventLoggerDb.mainFormater( logObj, i, "### Non documented event ");

				}

				// Log to console 
				if ( !! consoleLogTF ) {
				 	if ( !! showEventTF ) { 
				 		console.log( logData, logObj );
				 	} else {
				 		console.log( logData );
				 	}
				 }


			} else if ( logObj.cmd === "ping" ) { 

			} else if ( logObj.wsConn ) { 

			}

			retData = retData + "\n" + logData;

		}

		return retData;
	}

}



class LoggerEvent {


    constructor( CallingModShortName, TypeStr, FunctionNameStr, Args, FormatType ) {
		this.formatType = (( !!FormatType ) ? FormatType : "generic");
		this.type = TypeStr;
		this.createDate = new Date();
		this.startDate = new Date();
		this.endDate = null;
		this.ackDate = 0;	   // new Date when callbac;
		this.direction = 'NA';	// Options inbound, outbound, NA
		this.roundTrip = 1;
		this.rtWarn = 1500;	// 150;
		this.rtError = 2000;	// 200;
		this.roundTripAlert = true;
		this.rtFlag = " ";
		this.status = "";	// String status used in some things;
		this.tid = 0;	// Transaction Id - used for somethings;
		this.callingModShortName = CallingModShortName;
		this.functionName = FunctionNameStr;
		this.args = Args;
		this.argsString = "";
		this.returnValShort = "";
		this.returnVal = 'not set';
		this.errorVal = false;
		this.hasReturned = false;
	}


	
	setRoundTripWarnMsTime( MsTime ) { 
		this.rtWarn = MsTime; 
	}

	setRoundTripErrorMsTime( MsTime ) { 
		this.rtError = MsTime; 
	}				
	
	setSuccess( RetVal, OptionalShortRetVal ){
		this.endDate = new Date();
		this.roundTrip = ( this.endDate - this.startDate );
		if (!!OptionalShortRetVal) { this.returnValShort = OptionalShortRetVal; }
		this.returnVal = RetVal;
		this.hasReturned = true;
		this.setRtFlags();
	}
	
	setError( Error, OptionalShortRetVal ) { 
		this.endDate = new Date();
		this.roundTrip = ( this.endDate - this.startDate );
		this.errorVal = Error;
		if (!!OptionalShortRetVal) { this.returnValShort = OptionalShortRetVal; }
		this.hasReturned = true;
		this.setRtFlags();
	}
	
	setRtFlags() {
		if ( (this.roundTripAlert) && (this.roundTrip > this.rtError )) {
			this.rtFlag = "E";
			console.error("\n## Process took to long: This should be fixed! " +
				"\nEither fix the problem so it takes less time or ..." +
				"\nIncrease the timer with setRoundTripErrorMsTime( MsTime ) or ..." +
				"\nTell this not to care about time EventLoggerDb. with setRoundTripAlert( false )" +
				"\nERROR: ", JSON.stringify( this, null, '\t' ) );
		} else if ( (this.roundTripAlert) && (this.roundTrip > this.rtWarn )) {
			this.rtFlag = "w";
			console.log("\n## Process time passed Warning Threshold: This should be looked into!" +
				"\nEither fix the problem so it takes less time or ..." +
				"\nIncrease the timer with EventLoggerDb.setRoundTripErrorMsTim +e( MsTime ) or ..." +
				"\nTell this not to care about time EventLoggerDb. with setRoundTripAlert( false )" +
				"\nWarning: ", JSON.stringify( this, null, '\t' ) );
		} else {
			this.rtFlag = " ";
		}					
	}
	
	setDirection( DirectionString ) {		// Options inbound, outbound
		this.direction = DirectionString;
	}
	
	setTransactionId( TransactionId ) {		// Options inbound, outbound
		this.tid = TransactionId;
	}
	
	setStartDate( StartDate ) {		// Options inbound, outbound
		this.startDate = ( !!StartDate ) ? StartDate : new Date();
	}

	
	setReturnValueString( ReturnValue ) {		// Options inbound, outbound
		this.returnValShort = ReturnValue;
	}
	
	setReturnValue( ReturnValue ) {		// Options inbound, outbound
		this.returnVal = ReturnValue;
	}
	
	setArgs( NewArgs ) {		// Options inbound, outbound
		this.args = NewArgs;
	}
	
	setArgsString( ArgsString ) {		// Options inbound, outbound
		this.argsString = ArgsString;
	}
	
	setRoundTripAlert( TrueFalse ) {
		this.roundTripAlert = TrueFalse;
	}


}














// (function (root, factory) {
// 	if(typeof exports === 'object' && typeof module === 'object')
// 		module.exports = factory();
// 	else if(typeof define === 'function' && define.amd)
// 		define("EventLoggerDb", [], factory);
// 	else if(typeof exports === 'object')
// 		exports.EventLoggerDb = factory();
// 	else
// 		root.EventLoggerDb = factory();
// })(this, function() {

// 	var EventLoggerDbClass = {};
// 	EventLoggerDbClass = function() {
// 		// Map of Class Managers.  
// 		// Only 1 manager per Class - like nkmedia, etc.  Core class handled at WsConnection
// 		this._logDb = [];
// 		this._headerStr = "";
// 		this._counter = 0;
// 	};

// 	EventLoggerDbClass.prototype = {

// 		getShortId:function( ThreeCharNamePrefix ) {
// 			this._counter = this._counter + 1;
// 			return ThreeCharNamePrefix.substring(0,3) + this.pad("000", this._counter, true);
// 		},
// 		getEvent:function( EventNumber ) {
// 			return this._logDb[ EventNumber ];
// 		},

// 		push:function( EventObject ) {
// 			this._logDb.push(EventObject);		// Put in the logging Array (DB like) 
// 		},
// 		header:function( HeaderString ) {
// 			this._headerStr = HeaderString;
// 		},
// 		pad:function(pad, str, padLeft) {
// 			if (typeof str === 'undefined') 
// 				return pad;
// 			if (padLeft) {
// 				return (pad + str).slice(-pad.length);
// 			} else {
// 				return (str + pad).substring(0, pad.length);
// 			}
// 		},
// 		dateToTime:function( dtt ) {
// 			return this.pad("00", dtt.getHours(), true) + ":" + 
// 				this.pad("00", dtt.getMinutes(), true) + ":" + 
// 				this.pad("00", dtt.getSeconds(), true) + "." + 
// 				this.pad("000", dtt.getMilliseconds(), false);
// 		},
// 		argsFormater:function( args, maxIndividualLength ) {
// 			var bigLength = 180;
// 			var smallLength = (( !!maxIndividualLength) && (maxIndividualLength >= bigLength )) ? maxIndividualLength : bigLength;
// 			var retVal = args;

// 			if ( args === "" ) return args;

// 			var cloneOjb = this.cloneObj4Log( args, smallLength );
// 			retVal = JSON.stringify( cloneOjb );

// 			return ( retVal.length <= bigLength ) ? retVal : retVal.substring(1, bigLength) + "...";

// 		},

// 		json_stringify:function( Data ) {
// 			if ( !! Data ) {
// 				return JSON.stringify(Data);
// 			} else {
// 				return "";
// 			}
// 		},


// 		cloneObj4Log:function(obj, maxIndividualLength ) {
// 		    var copy;
// 		    var maxILen = (( !!maxIndividualLength) && (maxIndividualLength >= 20 )) ? maxIndividualLength : 20;

// 		    // Handle the 3 simple types, and null or undefined
// 		    if ( ( typeof(obj) != 'undefined' ) && ( null !== obj )) {
// 		    	if ( ( typeof(obj) == 'boolean') || ( typeof(obj) == 'number') ) {
// 		    		return obj;
// 		    	} else if ( typeof(obj) == 'string' ) {
// 		    		return ( obj.length < maxILen ) ? obj : obj.substring(0, maxILen) + "...";
// 		    	}
// 		    } else if ( typeof(obj) == 'undefined' ) {
// 		    	return "undefined";
// 		    } else if ( null === obj ) {
// 		    	return "null";
// 		    }

// 		    // if (null !== obj && "boolean" === typeof obj) return obj;

// 		    // if (null == obj || "object" != typeof obj) return ( obj.length < maxILen ) ? obj : obj.substring(0, maxILen) + "...";

// 		    // Handle Date
// 		    if (obj instanceof Date) {
// 		        copy = new Date();
// 		        copy.setTime(obj.getTime());
// 		        return copy;
// 		    }

// 		    // Handle Array
// 		    if (obj instanceof Array) {
// 		        copy = [];
// 		        for (var i = 0, len = obj.length; i < len; i++) {
// 		            copy[i] = this.cloneObj4Log(obj[i], maxIndividualLength);
// 		        }
// 		        return copy;
// 		    }

// 		    // Handle Object
// 		    if (obj instanceof Object) {
// 		        copy = {};
// 		        for (var attr in obj) {
// 		            // if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
// 		            if (( typeof(obj[attr]) !==  'function') && ( attr !== '__proto__')) copy[attr] = this.cloneObj4Log(obj[attr], maxIndividualLength);
// 		        }
// 		        return copy;
// 		    }

// 		    throw new Error("Unable to copy obj! Its type isn't supported. Type = " + (typeof(obj))  );
// 		},	// close function 



// 		//=========================================================================
// 		// PUBLIC: wsConnLogger(...) 
// 		//=========================================================================
// 		// Log WebSocket Connection things ...
// 		// 
// 		// @param	State:  String - Tells what state "onConnect", "onClose", etc
// 		// @param	Event: Object - The Event from the websocket callback or {} 
// 		//					or { header: "things in here" }
// 		// @param	StartDate: Date - The date of the WS start
// 		//-------------------------------------------------------------------------
// 		wsConnLogger:function( State, ThisEvent, StartDate ) {
// 			// var dTime = new Date();

// 			var wsEvt = this.createAndLogEvent( "WebSkt", "CORE", State, ThisEvent, "wsConn" );
// 			wsEvt.setRoundTripAlert( false );		// Do this befor setting other things.
// 			wsEvt.setStartDate( StartDate );
// 			wsEvt.setSuccess( ThisEvent );

// 			// var evtObj = {
// 			// 	type: "wsConn",
// 			// 	date: dTime,
// 			// 	connDate: StartDate,		// Should be when connection started trying.
// 			// 	roundTrip: (dTime - StartDate),
// 			// 	state: State,
// 			// 	evt: ThisEvent
// 			// };
// 			// this.push(evtObj);
// 		},

// 		pingLogger:function( evt ) {
// 			var evtObj = {
// 				type: "ping",
// 				evt: evt, 
// 				date: new Date()
// 			};
// 			this.push(evtObj);		// Put in the logging Array (DB like) 
// 		},



// 		createLogEvent:function( CallingModShortName, TypeStr, FunctionNameStr, Args, FormatType )
// 		{
// 			var data = {
// 				formatType: (( !!FormatType ) ? FormatType : "generic"),
// 				type: TypeStr, 
// 				createDate: new Date(),
// 				startDate: new Date(),
// 				endDate: null,
// 				ackDate: 0,   // new Date when callback
// 				direction: 'NA',		// Options inbound, outbound, NA
// 				roundTrip: -1,
// 				rtWarn: 1500,			// 1500
// 				rtError: 2000,			// 2000
// 				roundTripAlert: true,
// 				rtFlag: " ",
// 				status: "",				// String status used in some things.
// 				tid: 0,					// Transaction Id - used for somethings 
// 				callingModShortName: CallingModShortName,
// 				functionName: FunctionNameStr,
// 				arguments: Args,
// 				argsString: "",
// 				returnValShort: "",
// 				returnVal: "not set",
// 				errorVal: false,
// 				hasReturned: false,
// 				setRoundTripWarnMsTime:function( MsTime ) { 
// 					this.rtWarn = MsTime; 
// 				},
// 				setRoundTripErrorMsTime:function( MsTime ) { 
// 					this.rtError = MsTime; 
// 				},				
// 				setSuccess:function( RetVal, OptionalShortRetVal ){
// 					this.endDate = new Date();
// 					this.roundTrip = ( this.endDate - this.startDate );
// 					if (!!OptionalShortRetVal) { this.returnValShort = OptionalShortRetVal; }
// 					this.returnVal = RetVal;
// 					this.hasReturned = true;
// 					this.setRtFlags();
// 				},
// 				setError:function( Error, OptionalShortRetVal ) { 
// 					this.endDate = new Date();
// 					this.roundTrip = ( this.endDate - this.startDate );
// 					this.errorVal = Error;
// 					if (!!OptionalShortRetVal) { this.returnValShort = OptionalShortRetVal; }
// 					this.hasReturned = true;
// 					this.setRtFlags();
// 				},
// 				setRtFlags:function() {
// 					if ( (this.roundTripAlert) && (this.roundTrip > this.rtError )) {
// 						this.rtFlag = "E";
// 						console.error("\n## Process took to long: This should be fixed! " +
// 							"\nEither fix the problem so it takes less time or ..." +
// 							"\nIncrease the timer with setRoundTripErrorMsTime( MsTime ) or ..." +
// 							"\nTell this not to care about time EventLoggerDb. with setRoundTripAlert( false )" +
// 							"\nERROR: ", JSON.stringify( this, null, '\t' ) );
// 					} else if ( (this.roundTripAlert) && (this.roundTrip > this.rtWarn )) {
// 						this.rtFlag = "w";
// 						console.log("\n## Process time passed Warning Threshold: This should be looked into!" +
// 							"\nEither fix the problem so it takes less time or ..." +
// 							"\nIncrease the timer with EventLoggerDb.setRoundTripErrorMsTim +e( MsTime ) or ..." +
// 							"\nTell this not to care about time EventLoggerDb. with setRoundTripAlert( false )" +
// 							"\nWarning: ", JSON.stringify( this, null, '\t' ) );
// 					} else {
// 						this.rtFlag = " ";
// 					}					
// 				},
// 				setDirection:function( DirectionString ) {		// Options inbound, outbound
// 					this.direction = DirectionString;
// 				},
// 				setTransactionId:function( TransactionId ) {		// Options inbound, outbound
// 					this.tid = TransactionId;
// 				},
// 				setStartDate:function( StartDate ) {		// Options inbound, outbound
// 					this.startDate = ( !!StartDate ) ? StartDate : new Date();
// 				},

// 				setReturnValueString:function( ReturnValue ) {		// Options inbound, outbound
// 					this.returnValShort = ReturnValue;
// 				},
// 				setReturnValue:function( ReturnValue ) {		// Options inbound, outbound
// 					this.returnVal = ReturnValue;
// 				},
// 				setArgs:function( NewArgs ) {		// Options inbound, outbound
// 					this.arguments = NewArgs;
// 				},
// 				setArgsString:function( ArgsString ) {		// Options inbound, outbound
// 					this.argsString = ArgsString;
// 				},
// 				setRoundTripAlert:function( TrueFalse ) {
// 					this.roundTripAlert = TrueFalse;
// 				}

// 			};
// 			return data;
// 		},

// 		createAndLogEvent:function( CallingModShortName, TypeStr, FunctionNameStr, Args, FormatType ) {
// 			var logEvent = this.createLogEvent( CallingModShortName, TypeStr, FunctionNameStr, Args, FormatType );
// 			this.push(logEvent);
// 			return logEvent;
// 		},

// 		wRtcLogger:function( Event ) {
// 			var dTime = new Date();
// 			var evtObj = {
// 				type: "wRtc",
// 				date: dTime,
// 				evt: Event 
// 			};
// 			this.push(evtObj);
// 		},


// 		//=========================================================================
// 		// PUBLIC: queueLogger(...) 
// 		//=========================================================================
// 		// Log Queue details 
// 		// 
// 		// @param	Name:  String - Name of the queue
// 		// @param	Queue: Object - The queue or {} 
// 		//-------------------------------------------------------------------------
// 		queueLogger:function( Name, Queue ) {
// 			var evtObj = {
// 				type: Name,
// 				date: new Date(),
// 				queString: this.json_stringify(Queue), 
// 				que: JSON.parse(this.json_stringify(Queue)) // A Copy Object Function ... 
// 			};
// 			this.push(evtObj);		// Put in the logging Array (DB like) 
// 		},

// 		stringLogger:function( LogLevel, LogString ) {
// 			var evtObj = {
// 				type: "LStr",
// 				date: new Date(),
// 				logLevel: LogLevel, 
// 				logString: LogString // A Copy Object Function ... 
// 			};
// 			this.push(evtObj);		// Put in the logging Array (DB like) 
// 		},

// 		objectLogger:function( LogLevel, LogString, LogObject ) {
// 			var evtObj = {
// 				type: "LObj",
// 				date: new Date(),
// 				logLevel: LogLevel, 
// 				logObject: LogObject,
// 				logString: LogString // A Copy Object Function ... 
// 			};
// 			this.push(evtObj);		// Put in the logging Array (DB like) 
// 		},

// 		getJsonLogData:function( ) {
// 			return this.json_stringify( this._logDb );
// 		},

// 		toString( Data ) {
	
// 			// if ((!!Data) && ( typeof(Data) === 'object' )) {
// 			if (!!Data)  {
// 				if ( Data.toString() === "[object Object]" ) {
// 					return JSON.stringify( Data );
// 				} else if ( Data.toString() === "[object MediaStream]" ) {
// 					return "MediaStream: { active: " + Data.active + ", id: " + Data.id + " }"; 
// 				} else if ( Data.toString() === "[object RTCIceCandidateEvent]" ) {
// 					return "RTCIceCandidateEvent: { " +
// 						"iceConnectionState: " + Data.currentTarget.iceConnectionState +
// 						", iceGatheringState: " + Data.currentTarget.iceGatheringState +
// 						", signalingState: " + Data.currentTarget.signalingState +
// 						" }"; 
// 				} else {
// 					return JSON.stringify( Data );
// 				}
// 			} else {
// 				return "";
// 			}
// 		}, 

// 		mainFormater:function( logObj, loopNumber, extraFirstLine ) {
// 		    var logData =  
// 		    	this.pad("0000", loopNumber, true) + ") " +
// 		    	logObj.rtFlag +

// 		    	(( !!logObj.errorVal ) ? " ERR" : "    " ) +
// 		    	(( !!logObj.hasReturned ) ? " y" : " N") +

// 		    	this.pad("         ", logObj.roundTrip, true) + "  " +
// 		    	this.dateToTime( logObj.startDate )  +

// 		    	" | "  +
// 		    	((logObj.callingModShortName !== null) ? logObj.callingModShortName.substring(0,6) + " ": "       " )  +
// 		    	logObj.type  +
// 		    	" | "  +
// 		    	(( !!logObj.direction && (logObj.direction  == "inbound" )) ? "<- " : ((logObj.direction == "outbound") ? "-> " : "   ") ) +

// 		    	logObj.functionName  +
// 		    	(( !!extraFirstLine ) ? extraFirstLine : "") +

// 		    	"\n\t\t\t  Args: ( " + this.argsFormater(logObj.arguments, 100) + " )" +
// 		    	"\n\t\t\t  RetVal: ";

// 		    	var tmpVal;

// 		    	if ( logObj.errorVal ) {
// 		    		tmpVal = "ERROR: " + this.toString(logObj.errorVal);
// 		    		logData = logData + ((tmpVal.length > 130) ? tmpVal.substring(0,100) + " ..." : tmpVal );
// 		    	} else {
// 		    		tmpVal = this.argsFormater(logObj.returnValShort, 60) + " " + this.toString(logObj.returnVal);
// 		    		logData = logData + ((tmpVal.length > 130) ? tmpVal.substring(0,100) + " ..." : tmpVal );

// 		    	}
// 			 return logData;
// 		},

// 		//=========================================================================
// 		// PUBLIC: showSimpleLogs(...) 
// 		//=========================================================================
// 		// When NetComposer initates a request, this JS Object is created as a wrapper
// 		//     for logging and other things.
// 		// 
// 		// @param	consoleLogTF: Boolean - If true then things get sent to the console.log
// 		// @param	showEventTF: Boolean - If consoleLogTF = true AND showEventTF = true
// 		//					then also print the Event Ojbects on the console.log so they
// 		//					can be viewed in detail.
// 		// @return 	String with logging details.  It is the same thing that would get
// 		// 					printed on console.log with showSimpleLogs( true, false )
// 		//-------------------------------------------------------------------------

// 		showSimpleLogs:function(  consoleLogTF, showEventTF  ) {
// 			var arrayLength = this._logDb.length;
// 			var retData = 
// 			"Evt#) T Err Dn RndTrip  StartTime      Module Type   NC Function\n" +
// 			"----- - --- -- -------  ------------ | ------ ---- | -- -----------------";


// 			 // "Version: " + this.CODE_REV + "  Host: " + self.host +
// 				// "  Port: " + self.port + "\n" +
// 				// "LoginObj: " + this.json_stringify(LoginObj) + "\n--------------------";


// 			for (var i = 0; i < arrayLength; i++) {

// 				var logObj = this._logDb[i];
// 				var logAck = "no";
// 				var logData = ""; 
// 				var iFormat = this.pad("0000", i, true) + ") ";
// 				var extraFirstLine;
// 				var objKeys;

// 				if ( logObj.type ) {

// 					// ========= Client Based Events ==================
// 					if ( logObj.type === "SendObj") {

// 						console.log("i = " + i + ") skip for SendObj");

// 						if ( logObj.ackDate > 0 ) {
// 							logAck = "" + (logObj.ackDate - logObj.sentDate);
// 						}

// 						extraFirstLine = " tid: " + logObj.tid +
// 					    	" Sts: " + logObj.status +
// 					    	" Ack: " + logAck;

// 						logData = this.mainFormater( logObj.evtLogObj, i, extraFirstLine );
// 						logData = logData + "\n";
						 
// 					} else if ( logObj.type === "RecvObj" ) {

// 						if ( logObj.ackDate > 0 ) {
// 							logAck = "" + (logObj.ackDate - logObj.arriveDate);
// 						}

// 					    logData =  
// 					    	iFormat  +
// 					    	this.dateToTime( logObj.arriveDate )  +
// 					    	" | RECV | "  +
// 					    	logObj.wsRecvData.class + "/" + logObj.wsRecvData.cmd  +
// 					    	" tid: " + logObj.tid  +
// 					    	" Sts: " + logObj.status  +
// 					    	"  rt: " + logObj.roundTrip  +
// 					    	" Ack: " + logAck  +
// 					    	"\n\t\t Recv: " + this.json_stringify(logObj.wsRecvData.data) +
// 					    	"\n\t\t Send: " + this.json_stringify(logObj.wsResponseData.data);


// 					} else if ( logObj.type === "wsConn" ) {
// 						var header = ""; 
// 						if ( (!!logObj.evt) && (!!logObj.evt.header) ) {
// 							header = logObj.evt.header;
// 						} 

// 					    logData =  
// 					    	iFormat + 
// 					    	this.dateToTime( logObj.date ) + 
// 					    	" | WSkt | State: " + logObj.state + " connectTime: " + logObj.roundTrip + header;

// 					} else if ( logObj.type === "sentQueue" ) {
// 					    logData =  
// 					    	// iFormat + this.pad("                  ", "", true) 
// 					    	iFormat + this.pad("= WS Closed =     ", "", true) +
// 					    	this.dateToTime( logObj.date ) +
// 					    	" | Queue  Sent | Waiting for NC response \n\t\t\t  Sent Queue: ";
// 					    	// + logObj.queString;

// 					    	objKeys = Object.keys(logObj.que);

// 					    	if ( objKeys.length > 0 ) {
// 					    		objKeys.forEach( function ( q ) {

// 					    			var jsonQ = JSON.stringify( logObj.que[q].wsSendData );
//     					    		logData = logData +
//     					    			"\n\t\t\t\t  " +
//     					    			"tid: " + logObj.que[q].tid  +
//     					    			" " + ((jsonQ.length > 130) ? jsonQ.substring(0,100) + " ..." : jsonQ );
// 					    		});
// 					    	} else {
// 					    		logData = logData + "{}";
// 					    	}


// 					} else if ( logObj.type === "recvQueue" ) {
// 					    logData =  
// 					    	iFormat + this.pad("= WS Closed =     ", "", true) +
// 					    	this.dateToTime( logObj.date ) +
// 					    	" | Queue  Recv | Waiting for Client Response \n\t\t\t  Recv Queue: ";
// 					    	 // + logObj.queString;

// 					    	objKeys = Object.keys(logObj.que);

// 					    	if ( objKeys.length > 0 ) {
// 					    		objKeys.forEach( function ( q ) {

// 					    			var jsonQ = JSON.stringify( logObj.que[q].wsRecvData );
//     					    		logData = logData  +
//     					    			"\n\t\t\t\t  " +
//     					    			"tid: " + logObj.que[q].tid  +
//     					    			" " + ((jsonQ.length > 130) ? jsonQ.substring(0,100) + " ..." : jsonQ );
// 					    		});
// 					    	} else {
// 					    		logData = logData + "{}";
// 					    	}

// 					} else if ( logObj.type === "toSendQueue" ) {
// 					    logData =  
// 					    	iFormat + this.pad("= WS Closed =     ", "", true)  +
// 					    	this.dateToTime( logObj.date ) +
// 					    	" | Queue  Prep | Not Yet Sent \n\t\t\t  Prep Queue: ";

// 					    	if ( logObj.que.length > 0 ) {
// 					    		logData.que.forEach( function ( q ) {
// 					    			var jsonQ = JSON.stringify( q );
//     					    		logData = logData +
//     					    		"\n\t\t\t\t  " +
// 									((jsonQ.length > 130) ? jsonQ.substring(0,100) + " ..." : jsonQ );
// 					    		});
// 					    	} else {
// 					    		logData = logData + "{}";
// 					    	}

// 					} else if ( logObj.type === "LStr" ) {
// 					    logData =  
// 					    	iFormat + this.pad("                  ", "", true)  +
// 					    	this.dateToTime( logObj.date ) +
// 					    	" | Object Logs | LogLevel: " + logObj.logLevel + "\n\t\t  Log: " + logObj.logString;

// 					} else if ( logObj.type === "LObj" ) {
// 					    logData =  
// 					    	iFormat + this.pad("                  ", "", true)  +
// 					    	this.dateToTime( logObj.date ) +
// 					    	" | Object Logs | LogLevel: " + logObj.logLevel + "\n\t\t  Log: " + logObj.logString +
// 					    	"\n\t\t  " + this.json_stringify(logObj.logObject);

// 					} else if ( logObj.type === "ping" ) {
// 					    logData =  
// 					    	iFormat + this.pad("                  ", "", true)  +
// 					    	this.dateToTime( logObj.date ) +
// 					    	" | WsMngr ping | tid: " + logObj.evt.tid;

// 					} else if (( logObj.formatType === "generic") ||
// 							(logObj.formatType === "wRtcCore" ) ||
// 							(logObj.formatType === "wRtcEvent" ) ||
// 							(logObj.formatType === "wRtcPromiseGroup" )
// 							) {

// 						logData = this.mainFormater( logObj, i );

// 					} else if ( logObj.formatType === "wsSend") {

// 						extraFirstLine = " tid: " + logObj.tid  +
// 					    	" Sts: " + logObj.status  +
// 					    	" Ack: " + ((( !!logObj.ackDate ) && (logObj.ackDate > 0 )) ? (logObj.ackDate - logObj.startDate) : "no" );

// 						logData = this.mainFormater( logObj, i, extraFirstLine );

// 					} else if ( logObj.formatType === "wsRecv") {

// 						extraFirstLine = " tid: " + logObj.tid  +
// 					    	" Sts: " + logObj.status  +
// 					    	" Ack: " + ((( !!logObj.ackDate ) && (logObj.ackDate > 0 )) ? (logObj.ackDate - logObj.startDate) : "no" );

// 						logData = this.mainFormater( logObj, i, extraFirstLine );

// 					} else if ( logObj.formatType === "wsConn") {

// 						logData = iFormat +
// 				    	this.pad("-WSckt-", "", true) +
// 		    			this.pad("         ", logObj.roundTrip, true) + "  " +
// 				    	this.dateToTime( logObj.startDate )  +

// 				    	" | "  +
// 				    	((logObj.callingModShortName !== null) ? logObj.callingModShortName.substring(0,6) + " ": "       " )  +
// 				    	logObj.type  +
// 				    	" | "  +
// 				    	logObj.functionName  +
// 				    	"\n\t\t\t  ( " + this.argsFormater(logObj.arguments,80) + " )";

// 					} else {
// 						console.log( "\n\n### Non documented event ", JSON.stringify( logObj, null, '\t') );

// 							logData = this.mainFormater( logObj, i, "### Non documented event ");

// 					}

// 					// Log to console 
// 					if ( !! consoleLogTF ) {
// 					 	if ( !! showEventTF ) { 
// 					 		console.log( logData, logObj );
// 					 	} else {
// 					 		console.log( logData );
// 					 	}
// 					 }


// 				} else if ( logObj.cmd === "ping" ) { 

// 				} else if ( logObj.wsConn ) { 

// 				}

// 				retData = retData + "\n" + logData;

// 			}

// 			return retData;
// 		}
	
// 	};
	
// 	var EventLoggerDb = new EventLoggerDbClass();
// 	return EventLoggerDb;
// });
