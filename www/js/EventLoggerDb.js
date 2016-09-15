
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
 * Event Logger Database 
 * @class  EventLoggerDb
 * 
 */
var console = window.console;

(function (root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("EventLoggerDb", [], factory);
	else if(typeof exports === 'object')
		exports.EventLoggerDb = factory();
	else
		root.EventLoggerDb = factory();
})(this, function() {

	var EventLoggerDbClass = {};
	EventLoggerDbClass = function() {
		// Map of Class Managers.  
		// Only 1 manager per Class - like nkmedia, etc.  Core class handled at WsConnection
		this.logDb = [];
		this.headerStr = "";
		this.counter = 0;
	};

	EventLoggerDbClass.prototype = {

		getShortId: function( ThreeCharNamePrefix ) {
			this.counter = this.counter + 1;
			return ThreeCharNamePrefix.substring(0,3) + this.pad("000", this.counter, true);
		},
		getEvent:function( EventNumber ) {
			return this.logDb[ EventNumber ];
		},

		push:function( EventObject ) {
			this.logDb.push(EventObject);		// Put in the logging Array (DB like) 
		},
		header:function( HeaderString ) {
			this.headerStr = HeaderString;
		},
		pad:function(pad, str, padLeft) {
			if (typeof str === 'undefined') 
				return pad;
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
		argsFormater:function( args, maxIndividualLength ) {
			var bigLength = 180;
			var smallLength = (( !!maxIndividualLength) && (maxIndividualLength >= bigLength )) ? maxIndividualLength : bigLength;
			var retVal = args;

			if ( args === "" ) return args;

			var cloneOjb = WsLib.cloneObj4Log( args, smallLength );
			retVal = JSON.stringify( cloneOjb );

			return ( retVal.length <= bigLength ) ? retVal : retVal.substring(1, bigLength) + "...";

		},

		json_stringify:function( Data ) {
			if ( !! Data ) {
				return JSON.stringify(Data);
			} else {
				return "";
			}
		},



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
		wsConnLogger:function( State, ThisEvent, StartDate ) {
			// var dTime = new Date();

			var wsEvt = this.createAndLogEvent( "WebSkt", "CORE", State, ThisEvent, "wsConn" );
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
		},

		pingLogger:function( evt ) {
			var evtObj = {
				type: "ping",
				evt: evt, 
				date: new Date()
			};
			this.push(evtObj);		// Put in the logging Array (DB like) 
		},



		createLogEvent: function( CallingModShortName, TypeStr, FunctionNameStr, Args, FormatType )
		{
			var data = {
				formatType: (( !!FormatType ) ? FormatType : "generic"),
				type: TypeStr, 
				createDate: new Date(),
				startDate: new Date(),
				endDate: null,
				ackDate: 0,   // new Date when callback
				direction: 'NA',		// Options inbound, outbound, NA
				roundTrip: -1,
				rtWarn: 1500,			// 1500
				rtError: 2000,			// 2000
				roundTripAlert: true,
				rtFlag: " ",
				status: "",				// String status used in some things.
				tid: 0,					// Transaction Id - used for somethings 
				callingModShortName: CallingModShortName,
				functionName: FunctionNameStr,
				arguments: Args,
				argsString: "",
				returnValShort: "",
				returnVal: "not set",
				errorVal: false,
				hasReturned: false,
				setRoundTripWarnMsTime: function( MsTime ) { 
					this.rtWarn = MsTime; 
				},
				setRoundTripErrorMsTime: function( MsTime ) { 
					this.rtError = MsTime; 
				},				
				setSuccess: function( RetVal, OptionalShortRetVal ){
					this.endDate = new Date();
					this.roundTrip = ( this.endDate - this.startDate );
					if (!!OptionalShortRetVal) { this.returnValShort = OptionalShortRetVal; }
					this.returnVal = RetVal;
					this.hasReturned = true;
					this.setRtFlags();
				},
				setError: function( Error, OptionalShortRetVal ) { 
					this.endDate = new Date();
					this.roundTrip = ( this.endDate - this.startDate );
					this.errorVal = Error;
					if (!!OptionalShortRetVal) { this.returnValShort = OptionalShortRetVal; }
					this.hasReturned = true;
					this.setRtFlags();
				},
				setRtFlags: function() {
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
				},
				setDirection: function( DirectionString ) {		// Options inbound, outbound
					this.direction = DirectionString;
				},
				setTransactionId: function( TransactionId ) {		// Options inbound, outbound
					this.tid = TransactionId;
				},
				setStartDate: function( StartDate ) {		// Options inbound, outbound
					this.startDate = ( !!StartDate ) ? StartDate : new Date();
				},

				setReturnValueString: function( ReturnValue ) {		// Options inbound, outbound
					this.returnValShort = ReturnValue;
				},
				setReturnValue: function( ReturnValue ) {		// Options inbound, outbound
					this.returnVal = ReturnValue;
				},
				setArgs: function( NewArgs ) {		// Options inbound, outbound
					this.arguments = NewArgs;
				},
				setArgsString: function( ArgsString ) {		// Options inbound, outbound
					this.argsString = ArgsString;
				},
				setRoundTripAlert: function( TrueFalse ) {
					this.roundTripAlert = TrueFalse;
				}

			};
			return data;
		},

		createAndLogEvent:function( CallingModShortName, TypeStr, FunctionNameStr, Args, FormatType ) {
			var logEvent = this.createLogEvent( CallingModShortName, TypeStr, FunctionNameStr, Args, FormatType );
			this.push(logEvent);
			return logEvent;
		},

		wRtcLogger:function( Event ) {
			var dTime = new Date();
			var evtObj = {
				type: "wRtc",
				date: dTime,
				evt: Event 
			};
			this.push(evtObj);
		},


		//=========================================================================
		// PUBLIC: queueLogger(...) 
		//=========================================================================
		// Log Queue details 
		// 
		// @param	Name:  String - Name of the queue
		// @param	Queue: Object - The queue or {} 
		//-------------------------------------------------------------------------
		queueLogger:function( Name, Queue ) {
			var evtObj = {
				type: Name,
				date: new Date(),
				queString: this.json_stringify(Queue), 
				que: JSON.parse(this.json_stringify(Queue)) // A Copy Object Function ... 
			};
			this.push(evtObj);		// Put in the logging Array (DB like) 
		},

		stringLogger:function( LogLevel, LogString ) {
			var evtObj = {
				type: "LStr",
				date: new Date(),
				logLevel: LogLevel, 
				logString: LogString // A Copy Object Function ... 
			};
			this.push(evtObj);		// Put in the logging Array (DB like) 
		},

		objectLogger:function( LogLevel, LogString, LogObject ) {
			var evtObj = {
				type: "LObj",
				date: new Date(),
				logLevel: LogLevel, 
				logObject: LogObject,
				logString: LogString // A Copy Object Function ... 
			};
			this.push(evtObj);		// Put in the logging Array (DB like) 
		},

		getJsonLogData:function( ) {
			return this.json_stringify( this.logDb );
		},

		toString( Data ) {
	
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
		}, 

		mainFormater: function( logObj, loopNumber, extraFirstLine ) {
		    var logData =  
		    	this.pad("0000", loopNumber, true) + ") " +
		    	logObj.rtFlag +

		    	(( !!logObj.errorVal ) ? " ERR" : "    " ) +
		    	(( !!logObj.hasReturned ) ? " y" : " N") +

		    	this.pad("         ", logObj.roundTrip, true) + "  " +
		    	this.dateToTime( logObj.startDate )  +

		    	" | "  +
		    	((logObj.callingModShortName !== null) ? logObj.callingModShortName.substring(0,6) + " ": "       " )  +
		    	logObj.type  +
		    	" | "  +
		    	(( !!logObj.direction && (logObj.direction  == "inbound" )) ? "<- " : ((logObj.direction == "outbound") ? "-> " : "   ") ) +

		    	logObj.functionName  +
		    	(( !!extraFirstLine ) ? extraFirstLine : "") +

		    	"\n\t\t\t  Args: ( " + this.argsFormater(logObj.arguments, 100) + " )" +
		    	"\n\t\t\t  RetVal: ";

		    	var tmpVal;

		    	if ( logObj.errorVal ) {
		    		tmpVal = "ERROR: " + this.toString(logObj.errorVal);
		    		logData = logData + ((tmpVal.length > 130) ? tmpVal.substring(0,100) + " ..." : tmpVal );
		    	} else {
		    		tmpVal = this.argsFormater(logObj.returnValShort, 60) + " " + this.toString(logObj.returnVal);
		    		logData = logData + ((tmpVal.length > 130) ? tmpVal.substring(0,100) + " ..." : tmpVal );

		    	}
			 return logData;
		},

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

		showSimpleLogs:function(  consoleLogTF, showEventTF  ) {
			var arrayLength = this.logDb.length;
			var retData = 
			"Evt#) T Err Dn RndTrip  StartTime      Module Type   NC Function\n" +
			"----- - --- -- -------  ------------ | ------ ---- | -- -----------------";


			 // "Version: " + this.CODE_REV + "  Host: " + self.host +
				// "  Port: " + self.port + "\n" +
				// "LoginObj: " + this.json_stringify(LoginObj) + "\n--------------------";


			for (var i = 0; i < arrayLength; i++) {

				var logObj = this.logDb[i];
				var logAck = "no";
				var logData = ""; 
				var iFormat = this.pad("0000", i, true) + ") ";
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

						logData = this.mainFormater( logObj.evtLogObj, i, extraFirstLine );
						logData = logData + "\n";
						 
					} else if ( logObj.type === "RecvObj" ) {

						if ( logObj.ackDate > 0 ) {
							logAck = "" + (logObj.ackDate - logObj.arriveDate);
						}

					    logData =  
					    	iFormat  +
					    	this.dateToTime( logObj.arriveDate )  +
					    	" | RECV | "  +
					    	logObj.wsRecvData.class + "/" + logObj.wsRecvData.cmd  +
					    	" tid: " + logObj.tid  +
					    	" Sts: " + logObj.status  +
					    	"  rt: " + logObj.roundTrip  +
					    	" Ack: " + logAck  +
					    	"\n\t\t Recv: " + this.json_stringify(logObj.wsRecvData.data) +
					    	"\n\t\t Send: " + this.json_stringify(logObj.wsResponseData.data);


					} else if ( logObj.type === "wsConn" ) {
						var header = ""; 
						if ( (!!logObj.evt) && (!!logObj.evt.header) ) {
							header = logObj.evt.header;
						} 

					    logData =  
					    	iFormat + 
					    	this.dateToTime( logObj.date ) + 
					    	" | WSkt | State: " + logObj.state + " connectTime: " + logObj.roundTrip + header;

					} else if ( logObj.type === "sentQueue" ) {
					    logData =  
					    	// iFormat + this.pad("                  ", "", true) 
					    	iFormat + this.pad("= WS Closed =     ", "", true) +
					    	this.dateToTime( logObj.date ) +
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
					    	iFormat + this.pad("= WS Closed =     ", "", true) +
					    	this.dateToTime( logObj.date ) +
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
					    	iFormat + this.pad("= WS Closed =     ", "", true)  +
					    	this.dateToTime( logObj.date ) +
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
					    	iFormat + this.pad("                  ", "", true)  +
					    	this.dateToTime( logObj.date ) +
					    	" | Object Logs | LogLevel: " + logObj.logLevel + "\n\t\t  Log: " + logObj.logString;

					} else if ( logObj.type === "LObj" ) {
					    logData =  
					    	iFormat + this.pad("                  ", "", true)  +
					    	this.dateToTime( logObj.date ) +
					    	" | Object Logs | LogLevel: " + logObj.logLevel + "\n\t\t  Log: " + logObj.logString +
					    	"\n\t\t  " + this.json_stringify(logObj.logObject);

					} else if ( logObj.type === "ping" ) {
					    logData =  
					    	iFormat + this.pad("                  ", "", true)  +
					    	this.dateToTime( logObj.date ) +
					    	" | WsMngr ping | tid: " + logObj.evt.tid;

					} else if (( logObj.formatType === "generic") ||
							(logObj.formatType === "wRtcCore" ) ||
							(logObj.formatType === "wRtcEvent" ) ||
							(logObj.formatType === "wRtcPromiseGroup" )
							) {

						logData = this.mainFormater( logObj, i );

					} else if ( logObj.formatType === "wsSend") {

						extraFirstLine = " tid: " + logObj.tid  +
					    	" Sts: " + logObj.status  +
					    	" Ack: " + ((( !!logObj.ackDate ) && (logObj.ackDate > 0 )) ? (logObj.ackDate - logObj.startDate) : "no" );

						logData = this.mainFormater( logObj, i, extraFirstLine );

					} else if ( logObj.formatType === "wsRecv") {

						extraFirstLine = " tid: " + logObj.tid  +
					    	" Sts: " + logObj.status  +
					    	" Ack: " + ((( !!logObj.ackDate ) && (logObj.ackDate > 0 )) ? (logObj.ackDate - logObj.startDate) : "no" );

						logData = this.mainFormater( logObj, i, extraFirstLine );

					} else if ( logObj.formatType === "wsConn") {

						logData = iFormat +
				    	this.pad("-WSckt-", "", true) +
		    			this.pad("         ", logObj.roundTrip, true) + "  " +
				    	this.dateToTime( logObj.startDate )  +

				    	" | "  +
				    	((logObj.callingModShortName !== null) ? logObj.callingModShortName.substring(0,6) + " ": "       " )  +
				    	logObj.type  +
				    	" | "  +
				    	logObj.functionName  +
				    	"\n\t\t\t  ( " + this.argsFormater(logObj.arguments,80) + " )";

					} else {
						console.log( "\n\n### Non documented event ", JSON.stringify( logObj, null, '\t') );

							logData = this.mainFormater( logObj, i, "### Non documented event ");

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
	
	};
	
	var EventLoggerDb = new EventLoggerDbClass();
	return EventLoggerDb;
});
