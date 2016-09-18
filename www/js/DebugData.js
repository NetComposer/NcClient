'use strict';

/**
 * Object for Debug Print Data
 * @param  {string}	FunctionModulelName 	Should be something like -- RtcMedia.className, NkMedia.className, etc.
 * @param  {class}	CallingClassInstance 	A class instance like -- an instance of RtcMedia, NkMedia, MediaMngr, EchoMedia, RoomMngr, etc.
 * @param  {string}	FunctionName 	The name of the function
 * @param  {anything}	ArgsArray 	This includes any other data provided.  It can be many different arguments.
 */
class DebugData {

    constructor( FunctionModulelName, CallingClassInstance, FunctionName, ...ArgsArray ) {
    	this._functionName = FunctionName;
    	this._functionModuleName = FunctionModulelName;
    	this._callingClassInstance = CallingClassInstance;
    	this._modClassName = ( typeof CallingClassInstance === 'object') ? CallingClassInstance.className : CallingClassInstance;
    	this._processDebug = RemoteLogMngr.isDebugOn();
    	this._moduleName = this._getModuleName();
    	this._actionsDb = [];
    	this._state = DebugData.states.UNSET;
    	this._argsArrayString = DebugData.argToString( ArgsArray, DebugData.suppressArgsWarn );
    	this._argsArray = ArgsArray;

    	this.delayEnd = 0;
    	this.delayReloveRject = 0;

    	this._fullDebugData = false;
    	this._printSetupData = DebugData.debugSetupData;

    	this._pStack = RemoteLogMngr.getStackTraceString( ( new Error() ), "\n\tPromise Enter Stack ->  at " );
    	this._printStack = false;
    	this._printArgDetails = false;
    	this._suppressArgsWarn = false;

    	this._initDates();
    }

    static argToString( ArgsArray, SuppressArgsWarn ) {
    	if ( typeof ArgsArray === 'undefined' || ArgsArray.length === 0 ) { return ''; }

    	var argsString = '';

    	ArgsArray.forEach( function(arggg ) {
    		if ( typeof arggg === 'undefined' ) {
    			var err = new Error();

    			if ( !!SuppressArgsWarn ) {
    				// Do Nothing
    			} else {
	    			console.warn("DebugData: Passed an argument of 'undefined' ... this should be checked! ", err.stack );
    			}
            } else if ( arggg === null ) {
                argsString = argsString + 'null';
    		} else if ( arggg.toString() === '[object Object]' ) {
	    		argsString = argsString + JSON.stringify( arggg ).substring( 0, 30 ) + ', ';
    		} else if ( typeof arggg === 'object') {
    			if ( Array.isArray(arggg) ) {
		    		argsString = argsString + `[${arggg}]` + ', ';
    			} else {
		    		argsString = argsString + arggg.toString().substring( 0, 30 ) + ', ';
       			}
    		} else {
	    		argsString = argsString + arggg.toString() + ', ';
    		}
    	});

    	return argsString.substring(0, argsString.length - 2 );
    }

    static suppressArgsWarn( TrueFalse ) {
    	DebugData._suppressArgsWarn_old = DebugData._suppressArgsWarn;
    	DebugData._suppressArgsWarn = TrueFalse;
    }

    static suppressArgsWarnRevert() {
    	DebugData._suppressArgsWarn = DebugData._suppressArgsWarn_old;
    }

    /**
     * Determine if full details about the CallingClassInstance should be printed along with normal details.
     * <P> This only sets the value for this DebugData object/instance.  {@link DebugData.fullDebugData} sets the value for the class (every DebugData object/instance)
     * <BR> True means print full details of the CallingClassInstance as JSON.stringify(...)
     * <BR> False means do not print full details.
     * @see  DebugData.fullDebugData
     */
    set fullDebugData( TrueFalse ) {
		if ( typeof TrueFalse === 'boolean' ) {
			this._fullDebugData = TrueFalse;
		} else {
			console.warn( "DebugData: set fullDebugData: value must be true or false. " +
				`You gave ${TrueFalse}.  Setting to default value of 'false'` );
			this._fullDebugData = false;
		}    	
    }

    get fullDebugData() {
    	return ( typeof this._fullDebugData !== 'undefined' ) ? this._fullDebugData : false;
    }

    /**
     * Determine if full details about the CallingClassInstance should be printed along with normal details.
     * <P> This sets the value for the class (every DebugData object/instance).  {@link DebugData#fullDebugData} only sets the value for one DebugData object/instance.
     * <BR> True means print full details of the CallingClassInstance as JSON.stringify(...)
     * <BR> False means do not print full details.
     * @see  DebugData#fullDebugData
     */
    static set fullDebugData( TrueFalse ) {
		if ( typeof TrueFalse === 'boolean' ) {
			DebugData._fullDebugData = TrueFalse;
		} else {
			console.warn( "DebugData: set fullDebugData: value must be true or false. " +
				`You gave ${TrueFalse}.  Setting to default value of 'false'` );
			DebugData._fullDebugData = false;
		}    	
    }

    static get fullDebugData() {
    	return ( typeof DebugData._fullDebugData !== 'undefined' ) ? DebugData._fullDebugData : false;
    }

    static get debugSetupData() {
		return {logLevel: RemoteLogMngr.DEBUG, stackShiftAmount: 3, forceSendRemote: false, allowedToSendRemote: true };
    }

    static get infoSetupData() {
		return {logLevel: RemoteLogMngr.INFO, stackShiftAmount: 3, forceSendRemote: false, allowedToSendRemote: true };
    }

    static get logSetupData() {
		return {logLevel: RemoteLogMngr.LOG, stackShiftAmount: 3, forceSendRemote: false, allowedToSendRemote: true };
    }

    static get warnSetupData() {
		return {logLevel: RemoteLogMngr.WARN, stackShiftAmount: 3, forceSendRemote: false, allowedToSendRemote: true };
    }

    static get errorSetupData() {
		return {logLevel: RemoteLogMngr.ERROR, stackShiftAmount: 3, forceSendRemote: false, allowedToSendRemote: true };
    }

    static get alertSetupData() {
		return {logLevel: RemoteLogMngr.ALERT, stackShiftAmount: 3, forceSendRemote: false, allowedToSendRemote: true };
    }

    static get states() {
    	return {
    		UNSET: 'UNSET_STATE ',
    		ENTER: 'ENTER ',
    		EXIT: 'EXIT ',
    		RESOLVE: 'RESOLVE ',
    		REJECT: 'REJECT ',
    		DO: 'Doing -> ',
    		EVENT: 'EVENT ',
    		ERROR: 'ERROR ',
    		ALERT: 'ALERT ',
    		DETAILS: ' '
    	};
    }

    _initDates() {
    	var startDate = new Date();
    	this._dateEnter = startDate;
    	this._dateExit = startDate;
    	this._dateResolve = startDate;
    	this._dateReject = startDate;
    	this.delayEnd = 0;
    	this.delayReloveRject = 0;
    }

    setPrintStack( TrueFalse ) {
		this._printStack = TrueFalse;
		return this;
    }

    /**
     * Should be called when entering a function 
     * @param  {string} Message 	Any string or left empty
	 * @param  {anything}	RestOfThings 	This includes any other data provided.  It can be many different arguments.
     * @return {this} This DebugData instance
     */
	dbgEnter( PrintDetailedArgsTF ) {
		if ( this._processDebug === false ) { return this; }

		// Push into DB and set StartDate 
		this._printSetupData = DebugData.debugSetupData;
		this._initDates();
		this._printArgDetails = ( typeof PrintDetailedArgsTF === 'boolean') ? PrintDetailedArgsTF : false;
    	this._printStack = false;
		this._state = DebugData.states.ENTER;
		var PrintData = [''];
		this._debugSend.apply( this, PrintData );
		return this;
	}


    /**
     * Should be called when entering a function that gets and returns PromiseData
     *  
     * @param  {string} Message 	Any string or left empty
	 * @param  {anything}	RestOfThings 	This includes any other data provided.  It can be many different arguments.
     * @return {this} This DebugData instance
     */
	dbgEnterPd( PrintDetailedArgsTF ) {
		if ( this._processDebug === false ) { return this; }

		// Push into DB and set StartDate 
		this._printSetupData = DebugData.debugSetupData;
		this._initDates();
		this._printArgDetails = ( typeof PrintDetailedArgsTF === 'boolean') ? PrintDetailedArgsTF : false;
    	this._printStack = false;
		this._state = DebugData.states.ENTER;
		var PrintData = ['mySelfPromiseData'];
		this._debugSend.apply( this, PrintData );
		return this;
	}



    /**
     * Should be called as the only thing!  This is simply a notice of a function that initiates other things 
     * @param  {string} Message 	Any string or left empty
	 * @param  {anything}	RestOfThings 	This includes any other data provided.  It can be many different arguments.
     * @return {this} This DebugData instance
     * @see  DebugData#dbgDoPd
     */
	dbgDo( PrintDetailedArgsTF ) {
		if ( this._processDebug === false ) { return this; }
		this._printSetupData = DebugData.debugSetupData;
    	this._printStack = false;
		this._printArgDetails = ( typeof PrintDetailedArgsTF === 'boolean') ? PrintDetailedArgsTF : false;
		this._state = DebugData.states.DO;
		var PrintData = [''];
		this._debugSend.apply( this, PrintData );
		return this;
	}


    /**
     * Should be called as the only thing!  This is simply a notice of a function that initiates other things 
     * 	<P> The difference between this and {DebugData#dbgDo} is that this provides the 'mySelfPromiseData' as an argument 
     * @return {this} This DebugData instance
     * @see  DebugData#dbgDo
     */
	dbgDoPd( PrintDetailedArgsTF ) {
		if ( this._processDebug === false ) { return this; }
		this._printSetupData = DebugData.debugSetupData;
    	this._printStack = false;
		this._printArgDetails = ( typeof PrintDetailedArgsTF === 'boolean') ? PrintDetailedArgsTF : false;
		this._state = DebugData.states.DO;
		var PrintData = [ "mySelfPromiseData" ];
		this._debugSend.apply( this, PrintData );
		return this;
	}


    /**
     * Should be called when exiting a function 
     * @param  {string} Message 	Any string or left empty
	 * @param  {anything}	RestOfThings 	This includes any other data provided.  It can be many different arguments.
     * @return {this} This DebugData instance
     */
	dbgExit( Message, ...RestOfThings ) {
		if ( this._processDebug === false ) { return this; }
		this._printSetupData = DebugData.debugSetupData;
    	this._printStack = false;
		this._printArgDetails = false;
		this._dateExit = new Date();
		this.delayEnd = ( this._dateExit - this._dateEnter );
		this._state = DebugData.states.EXIT;
		var PrintData = [ (( typeof Message !== 'undefined' ) ? Message : '' ) ].concat( RestOfThings );
		this._debugSend.apply( this, PrintData );
		return this;
	}

    /**
     * Should be called when exiting a function 
     * @param  {string} Message 	Any string or left empty
	 * @param  {anything}	RestOfThings 	This includes any other data provided.  It can be many different arguments.
     * @return {this} This DebugData instance
     */
	dbgExitPd( ) {
		if ( this._processDebug === false ) { return this; }
		this._printSetupData = DebugData.debugSetupData;
    	this._printStack = false;
		this._printArgDetails = false;
		this._dateExit = new Date();
		this.delayEnd = ( this._dateExit - this._dateEnter );
		this._state = DebugData.states.EXIT;
		var PrintData = [ 'return Promise->Resolve(mySelfPromiseData)' ];
		this._debugSend.apply( this, PrintData );
		return this;
	}

    /**
     * Should be called in the middle of a function 
     * @param  {string} Message 	Any string or left empty
	 * @param  {anything}	RestOfThings 	This includes any other data provided.  It can be many different arguments.
     * @return {this} This DebugData instance
     */
	dbgMessage( Message, ...RestOfThings ) {
		if ( this._processDebug === false ) { return this; }
		this._printSetupData = DebugData.debugSetupData;
    	this._printStack = false;
		this._printArgDetails = false;
		this._state = DebugData.states.DETAILS;
		var PrintData = [ (( typeof Message !== 'undefined' ) ? Message : '' ) ].concat( RestOfThings );
		this._debugSend.apply( this, PrintData );
		return this;
	}

    /**
     * Should be called in the middle of a function 
     * @param  {string} Message 	Any string or left empty
	 * @param  {anything}	RestOfThings 	This includes any other data provided.  It can be many different arguments.
     * @return {this} This DebugData instance
     */
	logMessage( Message, ...RestOfThings ) {
		this._state = DebugData.states.DETAILS;
    	this._printStack = false;
		this._printArgDetails = false;
		this._printSetupData = DebugData.logSetupData;
		var PrintData = [ (( typeof Message !== 'undefined' ) ? Message : '' ) ].concat( RestOfThings );
		this._debugSend.apply( this, PrintData );
		return this;
	}

    /**
     * Should be called in the middle of a function 
     * @param  {string} Message 	Any string or left empty
	 * @param  {anything}	RestOfThings 	This includes any other data provided.  It can be many different arguments.
     * @return {this} This DebugData instance
     */
	infoMessage( Message, ...RestOfThings ) {
		this._state = DebugData.states.DETAILS;
		this._printSetupData = DebugData.infoSetupData;
    	this._printStack = false;
		this._printArgDetails = false;
		var PrintData = [ (( typeof Message !== 'undefined' ) ? Message : '' ) ].concat( RestOfThings );
		this._debugSend.apply( this, PrintData );
		return this;
	}

    /**
     * Should be called in the middle of a function 
     * @param  {string} Message 	Any string or left empty
	 * @param  {anything}	RestOfThings 	This includes any other data provided.  It can be many different arguments.
     * @return {this} This DebugData instance
     */
	warnMessage( Message, ...RestOfThings ) {
		this._state = DebugData.states.DETAILS;
		this._printSetupData = DebugData.warnSetupData;
    	this._printStack = false;
		this._printArgDetails = false;
		var PrintData = [ (( typeof Message !== 'undefined' ) ? Message : '' ) ].concat( RestOfThings );
		this._debugSend.apply( this, PrintData );
		return this;
	}

    /**
     * Should be called in the middle of a function 
     * @param  {string} Message 	Any string or left empty
	 * @param  {anything}	RestOfThings 	This includes any other data provided.  It can be many different arguments.
     * @return {this} This DebugData instance
     */
	errorMessage( Message, ...RestOfThings ) {
		this._state = DebugData.states.ERROR;
		this._printSetupData = DebugData.errorSetupData;
    	this._printStack = false;
		this._printArgDetails = false;
		var PrintData = [ (( typeof Message !== 'undefined' ) ? Message : '' ) ].concat( RestOfThings );
		this._debugSend.apply( this, PrintData );
		return this;
	}

    /**
     * Should be called in the middle of a function 
     * @param  {string} Message 	Any string or left empty
	 * @param  {anything}	RestOfThings 	This includes any other data provided.  It can be many different arguments.
     * @return {this} This DebugData instance
     */
	alertMessage( Message, ...RestOfThings ) {
		this._state = DebugData.states.ALERT;
		this._printSetupData = DebugData.alertSetupData;
    	this._printStack = false;
		this._printArgDetails = false;
		var PrintData = [ (( typeof Message !== 'undefined' ) ? Message : '' ) ].concat( RestOfThings );
		this._debugSend.apply( this, PrintData );
		return this;
	}


    /**
     * Should be called when resolving a function 
     * @param  {anything} Data 	Any string or left empty
	 * @param  {boolean}	FullDebugDataTF 	If true, this overrides a false for this.fullDebugDataTF and prints full data.
     * @return {this} This DebugData instance
     */
	dbgResolve( Data, FullDebugDataTF ) {
		if ( this._processDebug === false ) { return this; }
		this._printSetupData = DebugData.debugSetupData;
    	this._printStack = true;
		this._printArgDetails = false;
		this._dateResolve = new Date();
		this.delayReloveRject = ( this._dateResolve - this._dateEnter );
		this._state = DebugData.states.RESOLVE;
		var PrintData = [ `returns -> ${DebugData.JsonTab(Data)}` ];

		if ( ( typeof FullDebugDataTF === 'undefined' ) || (FullDebugDataTF === false ) || ( this._fullDebugData ) || ( DebugData._fullDebugData ) ) {
			// No special handling --- it will print fully as is
			this._debugSend.apply( this, PrintData );
		} else {
			this.fullDebugData = true;
			this._debugSend.apply( this, PrintData );
			this.fullDebugData = false;
		}

		return this;
	}

    /**
     * Should be called when rejecting a function 
     * @param  {anything} Data 	Any string or left empty
	 * @param  {boolean}	FullDebugDataTF 	If true, this overrides a false for this.fullDebugDataTF and prints full data.
     * @return {this} This DebugData instance
     */
	dbgReject( Data, FullDebugDataTF ) {
		if ( this._processDebug === false ) { return this; }
		this._printSetupData = DebugData.warnSetupData;
    	this._printStack = true;
		this._printArgDetails = false;
		this._dateReject = new Date();
		this.delayReloveRject = ( this._dateReject - this._dateEnter );
		this._state = DebugData.states.REJECT;
		var PrintData = [ "Reject", DebugData._getObjectCopyForPrint(Data) ];

		if ( ( typeof FullDebugDataTF === 'undefined' ) || (FullDebugDataTF === false ) || ( this._fullDebugData ) || ( DebugData._fullDebugData ) ) {
			// No special handling --- it will print fully as is
			this._debugSend.apply( this, PrintData );
		} else {
			this.fullDebugData = true;
			this._debugSend.apply( this, PrintData );
			this.fullDebugData = false;
		}

		return this;
	}

    /**
     * Should be called when sending an event in function 
     * @param  {event} Event 	The Event being sent.  This will be printed as JSON.stringify( ... ) 
	 * @param  {boolean}	FullDebugDataTF 	If true, this overrides a false for this.fullDebugDataTF and prints full data.
     * @return {this} This DebugData instance
     */
	dbgEvent( Event, FullDebugDataTF ) {
		if ( this._processDebug === false ) { return this; }
		this._printSetupData = DebugData.debugSetupData;
    	this._printStack = false;
		this._printArgDetails = false;
		this._state = DebugData.states.EVENT;
		var PrintData = [ (( typeof Event !== 'undefined' ) ? JSON.stringify( Event, null, '\t' ) : '' ) ];

		if ( ( typeof FullDebugDataTF === 'undefined' ) || (FullDebugDataTF === false ) || ( this._fullDebugData ) || ( DebugData._fullDebugData ) ) {
			// No special handling --- it will print fully as is
			this._debugSend.apply( this, PrintData );
		} else {
			this.fullDebugData = true;
			this._debugSend.apply( this, PrintData );
			this.fullDebugData = false;
		}

		return this;
	}

	_debugSend( Message, ...RestOfThings ) {
		var headerMessage = `${this._modClassName}->${this._functionModuleName}: ${this._state}${this._functionName}: ${Message}
		${this._functionName}( ${this._argsArrayString} ) [${this.delayEnd},${this.delayReloveRject}]`;

		var PrintData = [ this._printSetupData, this._moduleName, headerMessage ];

		if ( !!this._printStack ) { PrintData.push( this._pStack ); }

		var argsCount = 1;

		if ( !!this._printArgDetails ) { 
			var fullArgs = "\nFull Argument Detials:";
			argsCount = 1;

			this._argsArray.forEach( function( arrg ) { 
					fullArgs = fullArgs + `\n\tArg ${argsCount}) ` + JSON.stringify(DebugData._getObjectCopyForPrint( arrg ), null, '\t');
					argsCount = argsCount + 1;
				}) ;
			PrintData.push( fullArgs );
		}

		PrintData = PrintData.concat( DebugData.JsonTab( RestOfThings ) );

		// if ( ( this._fullDebugData ) || ( DebugData._fullDebugData ) || ( this._printSetupData.logLevel <= RemoteLogMngr.WARN ) ) {
		if ( ( this._fullDebugData ) || ( DebugData._fullDebugData ) ) {
			PrintData = PrintData.concat( `\n${this._modClassName} Data: ${JSON.stringify( this._callingClassInstance, null, '\t' )}` );
		}

		RemoteLogMngr.logIt.apply( this, PrintData );
	}

	_getModuleName( ) {
		var ModuleKey = "";

		//  Old -- this._modClassName
		switch( this._functionModuleName ) {
		    case 'RtcMedia' :
    			ModuleKey = "RTC";
		        break;
		    case 'NkMedia' :
    			ModuleKey = "NKMD";
		        break;
            case 'PublishMedia' :
                ModuleKey = "PUBM";
                break;
            case 'ListenMedia' :
                ModuleKey = "LSTN";
                break;
            case 'EchoMedia' :
                ModuleKey = "ECHO";
                break;
            case 'html' :
            case 'HTML' :
                ModuleKey = "HTML";
                break;
		    default:
    			ModuleKey = "MEDIA";
		}				
		return ModuleKey;
	}


	static JsonTab( Data ) {

		if ( Array.isArray( Data) ) {
			var theArray = [];

			Data.forEach( function( theData ) {
				theArray.push( DebugData.JsonTab( theData) + '\n' );
			});
			return theArray;

		} else {

			return JSON.stringify( DebugData._getObjectCopyForPrint( Data ), null, '\t');
		}
	}

	static _getObjectCopyForPrint( TheObject ) {

		if ( typeof TheObject === 'undefined' ) { return ''; }

		if ( typeof TheObject === 'function' ) { return TheObject.toString().substring(0,40) + "..."; }

		if ( typeof TheObject !== 'object' ) { return TheObject; }
		
		if ( typeof TheObject.toJSON !== 'undefined' ) { return TheObject; }  
		
		if ( TheObject instanceof Error ) { 
			return RemoteLogMngr.getStackTraceString( TheObject, `\n\tERROR ${TheObject} ->  at ` );
		}

		var theStringVal = TheObject.toString();
		var retVal = "";

		switch( theStringVal ) {
		    case '[object MediaStream]' :
    			retVal = DebugData.objectCopy_MediaStream( TheObject );
		        break;
		    case '[object MediaStreamTrack]' :
    			retVal = DebugData.objectCopy_MediaStreamTrack( TheObject );
		        break;
		    case '[object MediaStreamEvent]' :
    			retVal = DebugData.objectCopy_MediaStreamEvent( TheObject );
		        break;
		    case '[object RTCPeerConnection]' :
    			retVal = DebugData.objectCopy_RTCPeerConnection( TheObject );
		        break;
		    case '[object RTCSessionDescription]' :
    			retVal = DebugData.objectCopy_RTCSessionDescription( TheObject );
		        break;
		    case '[object RTCIceCandidateEvent]' :
		    	if ( TheObject.candidate === null ) {
		    		retVal = "--End of Ice Candidates--";
		    	} else {
		    		retVal = {
	    				RTCIceCandidateEvent: {
	    					candidate: TheObject.candidate,
	    					sdpMLineIndex: TheObject.sdpMLineIndex,
	    					sdpMid: TheObject.sdpMid
	    				}
	    			};
		    	}
			        break;
		    case '[object Event]' :
    			retVal = DebugData._getEventTypes( TheObject );
		        break;
		    default:
    			retVal = TheObject;  // Can't do anything else with it
		}				
		return retVal;
	}


	static _getEventTypes( TheEvent ) {
		if ( typeof TheEvent !== 'object' ) { return TheEvent; }
		if ( typeof TheEvent.toJSON !== 'undefined' ) { return TheEvent; }  

		var theType = TheEvent.type;
		var retVal = "";

		switch( theType ) {

		    case 'iceconnectionstatechange' :
    			retVal = {
    				iceconnectionstatechange: {
    					iceConnectionState: TheEvent.target.iceConnectionState,
    					iceGatheringState: TheEvent.target.iceGatheringState,
    					signalingState: TheEvent.target.signalingState,
    					isTrusted: TheEvent.isTrusted,
    					timeStamp: TheEvent.timeStamp
    				}
    			};
		        break;
		    case 'negotiationneeded' :
    			retVal = {
    				negotiationneeded: {
    					iceConnectionState: TheEvent.target.iceConnectionState,
    					iceGatheringState: TheEvent.target.iceGatheringState,
    					signalingState: TheEvent.target.signalingState,
    					isTrusted: TheEvent.isTrusted,
    					timeStamp: TheEvent.timeStamp
    				}
    			};
		        break;
		    case 'signalingstatechange' :
    			retVal = {
    				signalingstatechange: {
    					iceConnectionState: TheEvent.target.iceConnectionState,
    					iceGatheringState: TheEvent.target.iceGatheringState,
    					signalingState: TheEvent.target.signalingState,
    					isTrusted: TheEvent.isTrusted,
    					timeStamp: TheEvent.timeStamp
    				}
    			};
		        break;
		    case 'icecandidate' :
    			retVal = {
    				icecandidate: {
    					candidate: TheEvent.candidate.candidate,
    					sdpMLineIndex: TheEvent.candidate.sdpMLineIndex,
    					sdpMid: TheEvent.candidate.sdpMid,
    					timeStamp: TheEvent.timeStamp
    				}
    			};
		        break;
		    case 'track' :
    			retVal = {
    				track: {
    					track: DebugData.objectCopy_MediaStreamTrack( TheEvent.track ),
    					timeStamp: TheEvent.timeStamp
    				}
    			};
		        break;
		    case 'foobar' :
    			retVal = { foobar: { a: "a" }};
		        break;
		    default:
    			retVal = TheEvent;  // Can't do anything else with it
		}				
		return retVal;

	}




	//--------------------------------------------------------
	//  objectCopy_MediaStream
	//--------------------------------------------------------

	/**
	 * Returns a JSON object representing a MediaStream. MediaStream without this returns nothing of interest.
	 * 
	 * @param  {MediaStream} Stream  Stream to return an object for toJSON function.
	 * @return {object} Copy and format for toJSON.
	 */
	static objectCopy_MediaStream( TheMediaStream ) {

		if ( typeof TheMediaStream === 'undefined' || TheMediaStream === null ) { return null; }

		if ( Array.isArray( TheMediaStream) ) {
			return DebugData.objectCopy_MediaStreams( TheMediaStream );
		} 

		var tracks = [];

		TheMediaStream.getTracks().forEach( function( track ) {
			tracks.push( DebugData.objectCopy_MediaStreamTrack( track ) );
		});

		var stream = {
			MediaStream: {
			id: TheMediaStream.id,
			active: TheMediaStream.active,
			tracks: tracks,
		}};

		return stream;
	}



	//--------------------------------------------------------
	//  objectCopy_MediaStreams
	//--------------------------------------------------------

	/**
	 * Returns a JSON object representing a MediaStream. MediaStream without this returns nothing of interest.
	 * 
	 * @param  {MediaStream} Stream  Stream to return an object for toJSON function.
	 * @return {object} Copy and format for toJSON.
	 */
	static objectCopy_MediaStreams( TheMediaStreamArray ) {

		if ( typeof TheMediaStreamArray === 'undefined' || TheMediaStreamArray === null ) { return null; }

		if ( !Array.isArray( TheMediaStreamArray) ) { return null; }

		var streams = [];

		TheMediaStreamArray.forEach( function( mediaStream ) {
			streams.push( DebugData.objectCopy_MediaStreamTrack( mediaStream ) );
		});

		return streams;
	}


	//--------------------------------------------------------
	//  objectCopy_MediaStreamTrack
	//--------------------------------------------------------

	/**
	 * Returns a JSON object representing a MediaStream. MediaStream without this returns nothing of interest.
	 * 
	 * @param  {MediaStream} Stream  Stream to return an object for toJSON function.
	 * @return {object} Copy and format for toJSON.
	 */
	static objectCopy_MediaStreamTrack( TheMediaStreamTrack ) {

		if ( typeof TheMediaStreamTrack === 'undefined' || TheMediaStreamTrack === null ) { return {}; }

		return {
			MediaStreamTrack: {
				kind: TheMediaStreamTrack.kind,
				label: TheMediaStreamTrack.label,
				id: TheMediaStreamTrack.id,
				enabled: TheMediaStreamTrack.enabled,
				muted: TheMediaStreamTrack.muted,
				readyState: TheMediaStreamTrack.readyState,
				remote: TheMediaStreamTrack.remote
			}};
	}



	//--------------------------------------------------------
	//  objectCopy_MediaStreamTrack
	//--------------------------------------------------------

	/**
	 * Returns a JSON object representing a MediaStream. MediaStream without this returns nothing of interest.
	 * 
	 * @param  {MediaStream} Stream  Stream to return an object for toJSON function.
	 * @return {object} Copy and format for toJSON.
	 */
	static objectCopy_MediaStreamEvent( TheMediaStreamEvent ) {

		if ( typeof TheMediaStreamEvent === 'undefined' || TheMediaStreamEvent === null ) { return {}; }

		return {
			MediaStreamEvent: {
				type: TheMediaStreamEvent.type,
				stream: DebugData.objectCopy_MediaStream( TheMediaStreamEvent.stream ),
				target: DebugData.objectCopy_RTCPeerConnection( TheMediaStreamEvent.target ),

				bubbles: TheMediaStreamEvent.bubbles,
				cancelBubble: TheMediaStreamEvent.cancelBubble,
				cancelable: TheMediaStreamEvent.cancelable,
				eventPhase: TheMediaStreamEvent.eventPhase,
				timeStamp: TheMediaStreamEvent.timeStamp,
				returnValue: TheMediaStreamEvent.returnValue
			}};
	}



	//--------------------------------------------------------
	//  objectCopy_RTCPeerConnection
	//--------------------------------------------------------

	/**
	 * Returns a JSON object representing a MediaStream. MediaStream without this returns nothing of interest.
	 * 
	 * @param  {MediaStream} Stream  Stream to return an object for toJSON function.
	 * @return {object} Copy and format for toJSON.
	 */
	static objectCopy_RTCPeerConnection( ThePeerConn ) {

		if ( typeof ThePeerConn === 'undefined' || ThePeerConn === null ) { return {}; }

		return {
			RTCPeerConnection: {
				localDescription: ThePeerConn.localDescription,
				remoteDescription: ThePeerConn.remoteDescription,
				localStreams: DebugData.objectCopy_MediaStream( ThePeerConn.getLocalStreams() ),
				remoteStreams: DebugData.objectCopy_MediaStream( ThePeerConn.getRemoteStreams() ),
				signalingState: ThePeerConn.signalingState,
				iceGatheringState: ThePeerConn.iceGatheringState,
				iceConnectionState: ThePeerConn.iceConnectionState
			}};
	}

	//--------------------------------------------------------
	//  objectCopy_RTCSessionDescription
	//--------------------------------------------------------

	/**
	 * Returns a JSON object representing a RTCSessionDescription. RTCSessionDescription without this returns nothing of interest.
	 * 
	 * @param  {RTCSessionDescription} TheRTCSessionDescription  TheRTCSessionDescription to return an object for toJSON function.
	 * @return {object} Copy and format for toJSON.
	 */
	static objectCopy_RTCSessionDescription( TheRTCSessionDescription ) {

		if ( typeof TheRTCSessionDescription === 'undefined' || TheRTCSessionDescription === null ) { return {}; }

		return {
			RTCSessionDescription: {
				type: TheRTCSessionDescription.type,
				sdp: TheRTCSessionDescription.sdp
			}};
	}



}

