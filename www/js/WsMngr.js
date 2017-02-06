'use strict';

const WsMngr_Version = "WsMngr 1.0.0";

//############# B I G   N O T I C E  ##################################
// 
// YOU MUST NOT use any console.log, console.error, console.warn
//		console.info, console.debug functions!!!  
//
//  THEY WILL CAUSE A RECURSIVE ERROR
//
//  EVERY BAD THING!!!
//
//############# B I G   N O T I C E  ##################################




//
// 1) Create a new WsConnection - providing variables
//   > jedWsc = new WsConnection("localhost", 1456, "vvc_RtcBridgeWebApi", extIdInput.value, nameInput.value);
// 2) Connect the WS to the Server
//   > jedWsc.connect();

// var Foo1 = require("foo");
// var Foo2 = require("foo");


// TODO *** Make Host, Port an array of things AND allow NC to update them. 

//=========================================================================
// PUBLIC: WsMngr Constructor 
//=========================================================================
// @param Host: String - Really a URL or IP Address
// @param Port: Number - The port number to connect to
// @param LoginObj: Object - An object that has the login data
// 		{
// 			"user": "james@vovidco.com",   	-- Mandatory 
// 			"pass": "anything",   			-- Mandatory
// 			"meta": {						-- meta is Mandatory but the data in it is NOT
// 				"client_id": "rtc_james_03",
// 				"device_data": {
// 					"make": "Chrome",
// 					"push_id": "my_client_push_id",
// 					"type": "browser",
// 					"version": "51.0"
// 				}
// 			}
// 		}
// @usage wscObj = new WsMngr("localhost", 9010, loginData );
// @return Either a WsMngr instance or null

/**
 * WebSocket Manager
 * @class  WsMngr
 * 
 */

class WsMngr {


    static get className() { return "WsMngr"; }
	static toString() { return `[object WsMngr]`; }
    
    static get version() { return WsMngr_Version; }
    static get versions() { return `${WsMngr_Version} --> Ojbect`; }

	static toJSON() {
		var jsonData = {
			listeners: this.listeners
		};

		return jsonData;
	}


	static init() {

		if ( !! WsMngr._isInited ) {
			return;
		}

		WsMngr._isInited				= true;

		// Getters Only
		WsMngr._classManagers 			= {};
		WsMngr._remoteLogDb				= [];	// Store things sequentually 
		WsMngr._logDb 					= [];	// Store things sequentually 
		WsMngr._toSend 					= [];	// Things to send 
		WsMngr._sentQueue					= {}; 	// A Map of requests initiated from the client.  They get responses from NC
		WsMngr._recvQueue					= {}; 	// A Map of requests from NC.  Client MUST responde in 3 seconds of WS gets closed by NC
		WsMngr._evt_cnt 					= 1001;
		WsMngr._webSocket 				= null;
		WsMngr._wsConnStartDate			= new Date();
		WsMngr._webSocketSessionId 		= "not set";
		WsMngr._uuid						= WsMngr.createUuid();
		WsMngr._connectionId			= WsMngr.createUuid();   // NOTE: This one gets changed for each connection.

		WsMngr._userAgent 				= navigator.userAgent;
		WsMngr._userName 					= "not set";
		WsMngr._deviceId 					= "not set";

		WsMngr._isWebSocketLoggedIn		= false; 

		WsMngr._host 						= null;  // TODO: Later this should be an array of optios
		WsMngr._port 						= null;  // TODO: Same as Host - but combine them
		WsMngr._loginObj					= null;		// Make sure we have Host, Port, LoginObj 
		




		// Moved these to socketStates
		// ----------------------------
		// WsMngr.WS_STATE_CONNECTING = 0;   // Converted to static get socketStates
		// WsMngr.WS_STATE_OPEN = 1;
		// WsMngr.WS_STATE_CLOSING = 2;
		// WsMngr.WS_STATE_CLOSED = 3;



		// Setters & Getters
		WsMngr._logPings					= false;	// True | False 
		WsMngr._debug						= true;

	}


	//##########################################################################
	// C L A S S   VARIABLES
	//##########################################################################
	
	//========================================================
	// GETTERS ONLY -- No Setters
	//========================================================
	

	static get classManagers() { return WsMngr._classManagers; }

	static get socketStates() {
		return {
			WS_STATE_CONNECTING: 0,
			WS_STATE_OPEN: 1,
			WS_STATE_CLOSING: 2,
			WS_STATE_CLOSED: 3,
		};
	}


	/**
	 * Returns a list of Event Names for this class and parents.
	 * 
	 * @return {object} Returns a list of Event Names for this class and parents
	 */
	get eventNames() {
		return RtcMedia.eventNames;
	}

	/**
	 * Returns events for this class PLUS events for parent classes if available.
	 *
	 * Events for this class are:
	 * * onWsOpen
	 * * onWsClose
	 * * onWsError
	 * * onWsSessionIdChanged
	 * * onWsLoginSuccess
	 * * onWsLoginError
	 * * onRemoteLoggerInfo
	 * * onRemoteLoggerError
	 *
	 * @return {object} Returns a list of Event Names for this class and parents
	 * 
	 */
	//=======
	// Document these much better!! 

	static get eventNames() {
		// allEvent
		var allEvents = {

			WsMngr_EventNames_Start_Here: "WsMngr_EventNames_Start_Here",

			/**
		     * Sent when the WebSocket is open.
		     *
		     * @event onWsOpen
		     * @type {Event}
		     *
		     */
			onWsOpen: "WsMngr_onWsOpen",

			/**
		     * Sent when the WebSocket is closed.
		     *
		     * @event onWsClose
		     * @type {Event}
		     *
		     */
			onWsClose: "WsMngr_onWsClose",

			/**
		     * Sent when the WebSocket has an error.
		     *
		     * @event onWsError
		     * @type {Event}
		     *
		     */
			onWsError: "WsMngr_onWsError",

			/**
		     * Sent when a login to NetComposer via the WebSocket is succesful.
		     *
		     * @event onWsLoginSuccess
		     * @type {Event}
		     *
		     */
			onWsLoginSuccess: "WsMngr_onWsLoginSuccess",

			/**
		     * Sent when a login to NetComposer via the WebSocket has an error.
		     *
		     * @event onWsLoginError
		     * @type {Event}
		     *
		     */
			onWsLoginError: "WsMngr_onWsLoginError",

			/**
		     * Sent when the WebSocket session changes.
		     *
		     * @event onWsSessionIdChanged
		     * @type {Event}
		     *
		     */
			onWsSessionIdChanged: "WsMngr_onWsSessionIdChanged",

			/**
		     * Used to send INFO Messages to the Remote Log.  We CANNOT just do console.log, because 
		     *   it is recursive with RemoteLogMngr and WsMngr!
		     *
		     * @event onRemoteLoggerInfo
		     * @type {Event}
		     *
		     */
			onRemoteLoggerInfo: "WsMngr_onRemoteLoggerInfo",

			/**
		     * Used to send ERROR Messages to the Remote Log.  We CANNOT just do console.log, because 
		     *   it is recursive with RemoteLogMngr and WsMngr!
		     *
		     * @event onRemoteLoggerError
		     * @type {Event}
		     *
		     */
			onRemoteLoggerError: "WsMngr_onRemoteLoggerError",

		};


		return allEvents;
	}


	static get remoteLogDb() { return WsMngr._remoteLogDb; }

	static get logDb() { return WsMngr._logDb; }

	static get toSend() { return WsMngr._toSend; }

	static get sentQueue() { return WsMngr._sentQueue; }

	static get recvQueue() { return WsMngr._recvQueue; }

	static get evt_cnt() { return WsMngr._evt_cnt; }

	static get webSocket() { return WsMngr._webSocket; }

	static get wsConnStartDate() { return WsMngr._wsConnStartDate; }

	static get webSocketSessionId() { return WsMngr._webSocketSessionId; }

	static get userAgent() { return WsMngr._userAgent; }

	static get uuid() { return WsMngr._uuid; }

	static get userName() { return WsMngr._userName; }

	static get deviceId() { return WsMngr._deviceId; }
	
	static get isWebSocketLoggedIn() { return WsMngr._isWebSocketLoggedIn; }

	static get host() { return WsMngr._host; }

	static get port() { return WsMngr._port; }

	static get loginObj() { return WsMngr._loginObj; }




	//--------------------------------------------------------
	//  logPings
	//--------------------------------------------------------

	static set logPings( TrueFalse ) {
		if ( typeof TrueFalse !== 'boolean' ) {
			throw( `logPings value MUST be true or false.  You gave ${TrueFalse}` );
		}
		WsMngr._logPings = TrueFalse;
	}

	static get logPings() {
		return WsMngr._logPings;
	}

	//--------------------------------------------------------
	//  debug
	//--------------------------------------------------------

	static set debug( TrueFalse ) {
		if ( typeof TrueFalse !== 'boolean' ) {
			throw( `debug value MUST be true or false.  You gave ${TrueFalse}` );
		}
		WsMngr._debug = TrueFalse;
	}

	static get debug() {
		return WsMngr._debug;
	}


	//##########################################################################
	// C L A S S   FUNCTIONS
	//##########################################################################

	static createUuid() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	    	var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
	    	return v.toString(16);
			});
	}


	static setConnectData( HostString, PortNumber, UserNameString, UserPasswordString, DeviceIdString, MetaDataObject ) {

		WsMngr.init();

		if ( typeof(HostString) !== 'string' ) { throw("WsMngr: setConnectData: HostString must be an String"); }
		if ( typeof(PortNumber) !== 'number' ) { throw("WsMngr: setConnectData: PortNumber must be an Number"); }
		if ( typeof(UserNameString) !== 'string' ) { throw("WsMngr: setConnectData: UserNameString must be an String"); }
		if ( typeof(UserPasswordString) !== 'string' ) { throw("WsMngr: setConnectData: UserPasswordString must be an String"); }

		WsMngr._host 						= HostString;  // TODO: Later this should be an array of optios
		WsMngr._port 						= PortNumber;  // TODO: Same as Host - but combine them
		WsMngr._loginObj = {
			user: UserNameString,
			pass: UserPasswordString
		};

		if ( typeof(DeviceIdString) !== 'undefined' ) {
			if ( typeof(DeviceIdString) === 'string' ) { 
				WsMngr._loginObj.session_id = DeviceIdString;
				WsMngr._deviceId = DeviceIdString;
			} else {
				WsMngr._deviceId = "not set";
			}
		} else {
			WsMngr._deviceId = "not set";				
		}

		if ( typeof(MetaDataObject) !== 'undefined' ) {
			if ( typeof(MetaDataObject) === 'object' ) { 
				WsMngr._loginObj.meta = MetaDataObject;
			} else {
				throw("WsMngr: setConnectData: MetaDataObject was provided but it was not an object.  It must be an object if provided!");
			}
		}

		WsMngr._connectionId = WsMngr.createUuid();

		WsMngr._webSocketSessionId = DeviceIdString;
		WsMngr._userName = UserNameString;
	}



	//=========================================================================
	// PRIVATE: _login()
	//=========================================================================
	// login is called automatically and internally in _onWsOpen()
	//   If the websocket is not connected and logged in when a sendData(...) 
	//   is invoked by any function, it will do those steps before using the
	//   sendData(...) function.
	// @see sendData(...)
	// @see connect() 
	// @see _onWsOpen() - NOTE: this is a callback for websocket open.  This is
	//                       when the login needs to happen.
	//-------------------------------------------------------------------------

	static _login( ) {
		var loginAcc = WsMngr.createSendObj( "core", "user", "login", WsMngr._loginObj, 
			WsMngr._loginSuccessCB, WsMngr._loginErrorCB );
		WsMngr.sendAction(loginAcc, true );		// true 2nd arg puts it at the front of queue
	}

	static _loginSuccessCB( evt ) {
		WsMngr._isWebSocketLoggedIn = true;	// Keep at the top!!

		console.localInfoOnly("WSKT", "WsMngr: _loginSuccessCB: Auto Login Success");
		// EventMngr.dispatchEvent( WsMngr.eventNames.onRemoteLoggerInfo, ["WSKT", "WsMngr: _loginSuccessCB", JSON.stringify( evt, null, '\t' ) ]);

		WsMngr._webSocketSessionId = evt.wsSendData.data.session_id;
		EventMngr.dispatchEvent( WsMngr.eventNames.onWsLoginSuccess, evt.wsSendData );
		EventMngr.dispatchEvent( WsMngr.eventNames.onWsSessionIdChanged, evt.wsSendData.data.session_id);

	}

	static _loginErrorCB( evt ) {
		WsMngr._isWebSocketLoggedIn = false;

		console.localErrorOnly("WSKT", "WsMngr: _loginErrorCB: Auto Login ERROR");
		EventMngr.dispatchEvent( WsMngr.eventNames.onRemoteLoggerError, ["WSKT", "WsMngr: _loginErrorCB", JSON.stringify( evt, null, '\t' ) ]);

		var msg = evt.wsResponseData.result + "_" + evt.wsResponseData.data.code + "_" + evt.wsResponseData.data.error;
		WsMngr._webSocketSessionId = msg;
		EventMngr.dispatchEvent( WsMngr.eventNames.onWsSessionIdChanged, msg );

		EventMngr.dispatchEvent( WsMngr.eventNames.onWsLoginError, evt);
	}



	//=========================================================================
	// PUBLIC: addEventListener & removeEventListener
	//=========================================================================
	// Many things can subscribe to get events from EventListeners.
	// When an event arrives it is for notification, but there are NO functions
	//   related to WsMngr that can or should be called because of events
	//   sent via this mechanism.  
	// On the other hand, Callbacks are used when a response back to WsMngr
	//   are needed/required.  Only one function is set as a callback and that
	//   is set when the initating funciton is calls.
	//-------------------------------------------------------------------------
	// Below are a list of Events to subscribe to via addEventListener
	//
	// @param Type: String - Type of event (un)subscribe to
	// @param Callback: Function - The callback function that will be called
	//			when this event arrives. 
	// @param Scope: 
	// 
	// Type -- These are the Types that you can subscribe to ------
	// 
	// "onWsOpen" - 
	// "onWsClose" - 
	// "onWsError" - 
	// "onWsLoginSuccess" - 
	// "onWsLoginError" - 
	// "onWsSessionIdChanged" - 
	// "onRemoteLoggerInfo"
	// "onRemoteLoggerError"
	//-------------------------------------------------------------------------

	static addEventListener(Type, Callback, Scope) {
		EventMngr.addEventListener( Type, Callback, Scope );
	}

	static removeEventListener(Type, Callback, Scope) {
		EventMngr.removeEventListener( Type, Callback, Scope );
	}



	static isWebSocketOpen() {
		if ( ( !! WsMngr._webSocket ) &&
			 ( typeof WsMngr._webSocket === 'object' ) &&
			 ( WsMngr._webSocket.readyState === WsMngr.socketStates.WS_STATE_OPEN ) ) {
			return true;
		} else {
			return false;
		}
	}

	static isWebSocketReady() {
		if ( ( !! WsMngr._webSocket ) &&
			 ( typeof WsMngr._webSocket === 'object' )  &&
			 ( WsMngr._webSocket.readyState === WsMngr.socketStates.WS_STATE_OPEN ) &&
			 ( WsMngr._isWebSocketLoggedIn === true ) ) {
			return true;
		} else {
			return false;
		}
	}



	//=========================================================================
	// PUBLIC (really PRIVATE): updateLoginObj(...) 
	//=========================================================================
	// This is really only to be used for testing purposes!!!!!
	// A client should not change login data without doing a real logout first.
	// @param LoginObj: Object - A Login Object - see the Constructor for format.
	// @see Constructor for on LoginObj format
	//-------------------------------------------------------------------------
	static updateLoginObj( HostString, PortNumber, UserNameString, UserPasswordString, DeviceIdString, MetaDataObject ) {

		EventLoggerDb.wsConnLogger("--> Updating Login Data - Close / reConnect ", { }, WsMngr._wsConnStartDate );

		WsMngr.close();

		WsMngr.setConnectData( HostString, PortNumber, UserNameString, UserPasswordString, DeviceIdString, MetaDataObject );

		WsMngr.connect();
	}




	//=========================================================================
	// PRIVATE: Reset Variables after WS Close or Error  
	//=========================================================================


	static _resetAfterWsCloseOrError() {
		WsMngr._toSend = [];
		WsMngr._sentQueue	= {};
		WsMngr._recvQueue	= {};
	}


	//=========================================================================
	// PRIVATE: WebSocket Callback functions 
	//=========================================================================
	// These are the WebSocket Callbacks 
	// @see _onWsOpen - Used when WebSocket is connected - this also does the 
	// 						login functon.
	// @see _onWsClose - Used when WebSocket is closed
	// @see _onWsError - Used when there is a error on WebSocket
	// @see _onWsMessage - Used on any message sent/recieved. 
	//-------------------------------------------------------------------------

	//---- Do NOT overwrite this PRIVATE function -------------
	static _onWsOpen( Event ) {
		// Do private stuff here, then call public function.
		// console.localInfoOnly("WSKT", "WsMngr: _onWsOpen ", Event );
		EventMngr.dispatchEvent( WsMngr.eventNames.onRemoteLoggerInfo, ["WSKT", "WsMngr: _onWsOpen", JSON.stringify( Event, null, '\t' ) ]);

		EventLoggerDb.wsConnLogger("<-- onWsOpen", WsMngr._wsConnStartDate );

		WsMngr._login();
		WsMngr.sendData( null );

		// Send event to other now ...
		EventMngr.dispatchEvent( WsMngr.eventNames.onWsOpen, Event);

	}


	//---- Do NOT overwrite this PRIVATE function -------------
	static _onWsClose(Event) {
		// Do private stuff here, then call public function.
		WsMngr._isWebSocketLoggedIn = false;

		// console.localInfoOnly("WSKT", "WsMngr: _onWsClose ", Event );
		EventMngr.dispatchEvent( WsMngr.eventNames.onRemoteLoggerInfo, ["WSKT", "WsMngr: _onWsClose", JSON.stringify( Event, null, '\t' ) ]);

		EventLoggerDb.wsConnLogger("<-- onWsClose", Event, WsMngr._wsConnStartDate );
		EventLoggerDb.queueLogger( "toSendQueue", WsMngr._toSend );
		EventLoggerDb.queueLogger( "sentQueue", WsMngr._sentQueue );
		EventLoggerDb.queueLogger( "recvQueue", WsMngr._recvQueue );

		WsMngr._webSocketSessionId = "_onWsClose";
		EventMngr.dispatchEvent( WsMngr.eventNames.onWsSessionIdChanged, "_onWsClose");

		WsMngr._resetAfterWsCloseOrError();

		// Send event to other now ...
		EventMngr.dispatchEvent( WsMngr.eventNames.onWsClose, Event);

	}

	//---- Do NOT overwrite this PRIVATE function -------------
	static _onWsError(Event) {
		// Do private stuff here, then call public function.
		WsMngr._isWebSocketLoggedIn = false;

		// console.localErrorOnly("WSKT", "WsMngr: _onWsError ", Event );
		EventMngr.dispatchEvent( WsMngr.eventNames.onRemoteLoggerError, ["WSKT", "WsMngr: _onWsClose", JSON.stringify( Event, null, '\t' ) ]);
		
		EventLoggerDb.wsConnLogger("<-- onWsError", Event, WsMngr._wsConnStartDate );
		EventLoggerDb.queueLogger( "toSendQueue", WsMngr._toSend );
		EventLoggerDb.queueLogger( "sentQueue", WsMngr._sentQueue );
		EventLoggerDb.queueLogger( "recvQueue", WsMngr._recvQueue );

		WsMngr._webSocketSessionId = "_onWsError";
		EventMngr.dispatchEvent( WsMngr.eventNames.onWsSessionIdChanged, "_onWsError");

		WsMngr._resetAfterWsCloseOrError();

		// Send event to other now ...
		EventMngr.dispatchEvent( WsMngr.eventNames.onWsError, Event);

	}


	static resultPrinter( ResultStuff ) {
		var sentData = WsMngr._sentQueue[ ResultStuff.tid ];

		var retVal = "RESULT for " +
			sentData.wsSendData.class + " / " + 
			sentData.wsSendData.subclass + " / " + 
			sentData.wsSendData.cmd;

		if (( !! sentData.data ) && ( sentData.data.session_id )) { retVal = retVal + "session_id = " + sentData.data.session_id; }

		return retVal;
	}

	static cmdPrinter( CommandStuff ) {

		var retVal = "COMMAND Class: " +
			CommandStuff.class + "  Subclass: " + 
			CommandStuff.subclass + "  Cmd: " + 
			CommandStuff.cmd + "\n\t\tData: ";

		return retVal;
	}



	//---- Do NOT overwrite this PRIVATE function -------------
	static _onWsMessage( Event ) {
		var msgDate = new Date();
		var JsonData = JSON.parse( Event.data);
		
		// if( LogP_Debug && !JsonData.ping) {
		// 	console.localLogOnly("WSKT", "WsMngr: _onWsMessage ", Event );
		// }

		// console.localDebugOnly("WSKT", "WsMngr: _onWsMessage ", Event );

		if ( typeof JsonData === 'object' ) {

			// =========== PING ============
			if ( JsonData.class === "core" && JsonData.cmd === "ping" ) { 

				// console.localDebugOnly("WSKT", "WsMngr: _onWsMessage: Got Ping -> Sending Pong" );
				WsMngr.sendData( { result: "ok", tid: JsonData.tid, ping: true } );

				if ( !! WsMngr._logPings ) {
					EventLoggerDb.pingLogger( JsonData );
				}

			// =========== ACK ============
			} else if ( JsonData.ack ) {  
				// WsMngr._sentQueue[ JsonData.ack ]["ackDate"] = msgDate;
				WsMngr._sentQueue[ JsonData.ack ].setAck( msgDate );
				// TODO: Need to set timer and act if no callback in time.... 

			// =========== RESULT ============
			} else if ( JsonData.result ) {   // A result type 

				// console.localLogOnly("WSKT", "WsMngr: _onWsMessage: " + ( WsMngr.resultPrinter(JsonData) ), JSON.stringify(JsonData, null, "\t") );

				if ( !! WsMngr._sentQueue[ JsonData.tid ] ) {
					var callingObj = WsMngr._sentQueue[ JsonData.tid ];
					delete WsMngr._sentQueue[ JsonData.tid ];

					if ( JsonData.result === "ok" ) {
						callingObj._successCB( JsonData, msgDate );
					} else {  		// MUST NOT BE OK ... Then it is an error 
						callingObj._errorCB( JsonData, msgDate );
					}

				} else {
					console.localErrorOnly( "WsMngr: _onWsMessage: Got result for something not in queue .. ", JSON.stringify(JsonData, null, "\t") );
				}

			// =========== CLASS ============


			} else if ( ( JsonData.class === "core" ) && 
						( JsonData.cmd === "event" ) && 
						( !! JsonData.data ) ) {   

				var recvObj = WsMngr._createRecvObj( JsonData );   // Create a new RecvObj - this also inserts it into the 

				// console.localLogOnly("WSKT", "WsMngr: _onWsMessage: CORE : EVENT ", JsonData, recvObj );
				
				WsMngr.handleEvent( recvObj );

			} else if ( JsonData.class ) {   
				WsMngr._createRecvObj( JsonData );   // Create a new RecvObj - this also inserts it into the 

				console.localDebugOnly("WSKT", "WsMngr: _onWsMessage: *** I got a CLASS of " + ( WsMngr.cmdPrinter(JsonData) ), JsonData );

				if ( JsonData.class === "core" ) {
					console.localLogOnly("WSKT", "WsMngr: _onWsMessage:  *** I got an CORE CLASS ", JSON.stringify(JsonData, null, "\t") );

					// Handle core classes here in WsConnection ...

				} else {

					console.localLogOnly("WSKT", "WsMngr: _onWsMessage: *** I got an OTHER CLASS ", JSON.stringify(JsonData, null, "\t") );

					if ( WsMngr.handle( JsonData ) ) {
						// For now .. do nothing except allow the handler to function ... 

					} else {		// This means that there was NOT a handler .. so send back an error 
						console.localErrorOnly("WSKT", "WsMngr: _onWsMessage: *** I got an OTHER CLASS ", JSON.stringify(JsonData, null, "\t") );
						WsMngr.respondError( JsonData, 333, "No Handler available for this Class:Cmd" );
					}


					// These classes we check to see if there is a handler for the class type 
					// A Handler registers to handle a class of events .... 
					// Only 1 handler per event class ... These events MUST report back quickly to NC or else NC closes the the socket


				}

			} else {
				console.localErrorOnly("WsMngr: Object is not a callback or event ", JSON.stringify(JsonData, null, "\t") );
			}
		} else {
			console.localErrorOnly("WsMngr: Error was returned", Event);
		}

	}





	//=========================================================================
	// PUBLIC (really Private): Send data via the WebSocket.
	//=========================================================================
	// This is the ONLY function that should send data to NetComposer!!!
	// Everything else should send data to this function to send to NetComposer
	// This does some checks and makes sure the websocket is connected and login
	//
	// @param Data: Object - The data to send to NetComposer
	// @param PutFirst: Boolean - If true then insert this at the front of the queue
	//
	// @note: This function is called recursively -- PLEASE BE AWARE OF THAT!!!
	//-------------------------------------------------------------------------

	static sendData( StoreData, PutFirst ) {

		if (( typeof(StoreData) === 'object' ) &&  (StoreData !== null ) ) {		// Just push StoreData into 
			if ( ( !!PutFirst ) && ( PutFirst === true ) ) {
				WsMngr._toSend.unshift( StoreData ); 	// Put at the FRONT of the queue
			} else {
				WsMngr._toSend.push( StoreData ); 	// Put at the END of the queue
			}

			if ( !StoreData.ping ) {
				EventMngr.dispatchEvent( WsMngr.eventNames.onRemoteLoggerInfo, ["WSKT", "WsMngr: sendData", JSON.stringify(StoreData) ]);
			}

			WsMngr.sendData( null );		// Process the queue

		} else if ( StoreData === null ) {	// Process things in the queue

			if ( WsMngr._toSend.length > 0 ) {
				var myDate = new Date();

				if ( !!WsMngr._webSocket ) {
					if ( WsMngr._webSocket.readyState === WsMngr.socketStates.WS_STATE_OPEN ) {

						var Data = WsMngr._toSend.shift();							// Gets the first thing from queue
						var JsonData = JSON.stringify(Data, null, '\t');

						// if ( !Data.ping ) {
						// 	EventMngr.dispatchEvent( WsMngr.eventNames.onRemoteLoggerInfo, ["WSKT", "WsMngr: sendData", JsonData ]);
						// }

						WsMngr._webSocket.send(JsonData);

						// Reset Send time for things that tried to send before WS Connected
						if (!! WsMngr._sentQueue[Data.tid]) {
							WsMngr._sentQueue[Data.tid].setStartDate( myDate );
						}


					} else if ( WsMngr._webSocket.readyState === WsMngr.socketStates.WS_STATE_CLOSED ) {
						console.localLogOnly("WSKT",  "WsMngr: sendData: WS_STATE_CLOSED -- Trying to Connect " );
						WsMngr.connect();
					} else if ( WsMngr._webSocket.readyState === WsMngr.socketStates.WS_STATE_CONNECTING ) {
						console.localLogOnly("WSKT",  "WsMngr: sendData: WS_STATE_CONNECTING -- We will wait here " );
						// setTimeout( WsMngr.sendData, myDate, Data, myDate + 100 );

					} else if ( WsMngr._webSocket.readyState === WsMngr.socketStates.WS_STATE_CLOSING ) {
						console.localLogOnly("WSKT",  "WsMngr: sendData: WS_STATE_CLOSING -- We will wait here " );
						// setTimeout( WsMngr.sendData, myDate, Data, myDate + 100 );
					}
				} else { 	// WebSocket must be null
					console.localLogOnly("WSKT",  "WsMngr: sendData: webSocket.readyState FALSE -- Trying to Connect " );
					WsMngr.connect();
				}

			} else {

				// The Queue is empty here ... do nothing 
			}
	
		} else {
			console.localErrorOnly("\n*** sendData hit the else condition - this should not happen! \n", JSON.stringify(StoreData, null, "\t") , WsMngr._toSend.length );
		}

	}

	//=========================================================================
	// PUBLIC: sendAction(...) 
	//=========================================================================
	// This is really only to be used by other Class:Cmd managers, not HTML/JS
	// 
	// @param Action: Object - A valid Object that is understood by NetComposer.
	//			These really should NOT be used/sent by HTML/JS but rather by
	//  		other managers than have deep understanding of NetComposer
	//  		messages.
	// @param PutFirst: Boolean (Optional) - If true then insert this at the front of the queue
	// @see sendData
	//-------------------------------------------------------------------------

	static sendAction( Action, PutFirst ) {

		// var JsonAction = JSON.stringify(Action.wsSendData);
		// console.localInfoOnly("WSKT", "WsMngr: sendAction: " + Action.wsSendData.cmd, Action.wsSendData.data, JSON.stringify(JsonAction, null, "\t")  );
		WsMngr._logDb.push(Action);		// Put in the logging Array (DB like) 
		// EventLoggerDb.push(Action);

		WsMngr._sentQueue[Action.tid] = Action; 	
		// Action.sentDate = new Date();    	// Do this in the real sendData section 
		WsMngr.sendData( Action.wsSendData, PutFirst );
		// WsMngr.webSocket.send(JsonAction);
	}

	//=========================================================================
	// PUBLIC: respondAck(...) 
	//=========================================================================
	// This is really only to be used by other Class:Cmd managers, not HTML/JS
	// 
	// @param JsonData: Object - A valid Object that is understood by NetComposer.
	//			These really should NOT be used/sent by HTML/JS but rather by
	//  		other managers than have deep understanding of NetComposer
	//  		messages.
	// 
	// @see sendData
	//-------------------------------------------------------------------------
	static respondAck( JsonData ) {
		var respObj = WsMngr._recvQueue[JsonData.tid];

		var ackObj = {
			ack: JsonData.tid
			};

		respObj.setAck( new Date() );

		// respObj.ackDate = respDate;
		// respObj.status = "ack";

		WsMngr.sendData( ackObj, false );
	}

	//=========================================================================
	// PUBLIC: respondOk(...) 
	//=========================================================================
	// This is really only to be used by other Class:Cmd managers, not HTML/JS
	// 
	// @param	JsonData: Object - is the data the is sent to the Class Manager (function) and needs to be returned
	// @param	RespData: Object - is a JS Object or {} that is sent back to the NC
	// @see sendData
	//-------------------------------------------------------------------------
	static respondOk( JsonData, RespData ) {
		// var respDate = new Date();
		var respObj = WsMngr._recvQueue[JsonData.tid];
		delete WsMngr._recvQueue[ JsonData.tid ];	// Delete from queue since we responded !!

		var okObj = {
			result: "ok",
			tid: JsonData.tid,
			data: RespData
		};

		respObj.setResponse( okObj );

		// respObj.responseDate = respDate;
		// respObj.roundTrip = respDate - respObj.arriveDate;
		// respObj.status = "ok";
		// respObj.wsResponseData = okObj;

		WsMngr.sendData( okObj, false );

	}

	//=========================================================================
	// PUBLIC: respondError(...) 
	//=========================================================================
	// This is really only to be used by other Class:Cmd managers, not HTML/JS
	// 
	// @param	JsonData: Object - is the data the is sent to the Class Manager (function) and needs to be returned
	// @param	errorCode: Number - Numeric Error Code sent to NetComposer
	// @param	errorText: String - Text (String) message sent to NetCompser
	// @see sendData
	//-------------------------------------------------------------------------
	static respondError( JsonData, errorCode, errorText ) {
		var respDate = new Date();
		var respObj = WsMngr._recvQueue[JsonData.tid];
		delete WsMngr._recvQueue[ JsonData.tid ];

		var errorObj = {
			result: "error",
			tid: JsonData.tid,
			data: {
				code: errorCode,
				error: errorText
			}
		};

		respObj.responseDate = respDate;
		respObj.roundTrip = respDate - respObj.arriveDate;
		respObj.status = "error";
		respObj.wsResponseData = errorObj;

		WsMngr.sendData( errorObj, false );

	}














	//=========================================================================
	// PUBLIC: remoteLog(...) 
	//=========================================================================
	// This is really only to be used by other Class:Cmd managers, not HTML/JS
	// 
	// @param	Source {String}
	// @param	Level {number}
	// @param	Message {String}
	// @param	MetaData {String || Object}
	// @return true | false
	//		true = sent
	//		false = not sent.  Most likely because of WS connection is not open
	//-------------------------------------------------------------------------

	static remoteLog( Level, Message, MetaData ) {
		
		var tmpMetaData = null;
		var fullLogData = {};

		if ( typeof(Level) !== 'number' ) {
			throw( "WsMngr: remoteLog: Level MUST be a number!");
		}

		if ( typeof(Message) !== 'string' ) {
			throw( "WsMngr: remoteLog: Message MUST be a string!");
		}

		if ( typeof(MetaData) === 'string' ) {
			tmpMetaData = JSON.parse( MetaData );
		} else if ( typeof(MetaData) === 'object' ) {
			tmpMetaData = MetaData;
		} else {
			throw( "WsMngr: remoteLog: MetaData MUST be either a JSON formatted string or an object!");
		}

		var logObj = {
			tid: WsMngr._evt_cnt++,
			createDate: new Date(),
			callbackDate: 0,   // new Date when callback
			roundTrip: 0,
			status: "not set",
			wsSendData: fullLogData, 
			wsResponseData: {},
			_successCB: function( Data, MsgDate ) {	
				this.callbackDate = MsgDate;
				this.roundTrip = this.callbackDate - this.sentDate;
				this.status = Data.result;
				this.wsResponseData = Data;

				// console.localDebugOnly("WSKT", "WsMngr: Callback: " + logObj.wsSendData.cmd + "._successCB(" + this.tid + "): " +
				//  	Data.result, Data );
			},
			_errorCB: function( Data, MsgDate ) {
				this.callbackDate = MsgDate;
				this.roundTrip = this.callbackDate - this.sentDate;
				this.status = Data.result;
				this.wsResponseData = Data;

				console.localErrorOnly("WSKT", "WsMngr: Callback: " + logObj.wsSendData.cmd + "._errorCB(" + this.tid + "): " +
				 	Data.result, Data );
			}

		};

		fullLogData = {
			class: "core",
			subclass: "session",
			cmd: "log",
			tid: logObj.tid,
			data: {
				source: 'jsClient',
				level: Level,
				message: Message,
				meta: tmpMetaData
			}
		};

		logObj.wsSendData = JSON.parse( JSON.stringify( fullLogData ));	// Makes a copy of the data in the object

		WsMngr._remoteLogDb.push( logObj );

		// WsMngr._sentQueue[logObj.tid] = logObj; 	
		// WsMngr._webSocket.send( JSON.stringify( fullLogData ));
		
		return WsMngr.sendRemoteLogs();

	}

	static sendRemoteLogs( ) {

		if ( WsMngr.isWebSocketReady() === false ) {
			return false;
		} else {
			
			WsMngr._remoteLogDb.forEach( 
				function( tmpLogObj ) {
					var thisDate = new Date();

					WsMngr._sentQueue[tmpLogObj.tid] = tmpLogObj;
					tmpLogObj.wsSendData.data.meta.jsClient_wsStableSessionId = WsMngr._webSocketSessionId;
					tmpLogObj.wsSendData.data.meta.jsClient_userId = WsMngr._userName;
					tmpLogObj.wsSendData.data.meta.jsClient_deviceId = WsMngr._deviceId;
					tmpLogObj.wsSendData.data.meta.jsClient_userAgent = WsMngr._userAgent;
					tmpLogObj.wsSendData.data.meta.jsClient_wsSendTimeStamp = thisDate.getTime();
					tmpLogObj.wsSendData.data.meta.jsClient_wsSessionIdAtSend = WsMngr._connectionId;

					WsMngr._webSocket.send( JSON.stringify( tmpLogObj.wsSendData ));
				} 
			);

			WsMngr._remoteLogDb = [];
			return true;
		}

	}
































	//=========================================================================
	// PUBLIC: connect() -  Connect, Setup Callbacks and register
	//=========================================================================
	// This can be called by HTML/JS to force a connect when a message is not
	//    being sent.  For example, if the client got a "wakeup" PUSH, then 
	//    this should be used to connect to NetComposer so NC can send requests
	// This is also called internally if a message is sent but the websocket is 
	//    not already connected.
	// If the websocket is already connected and in a good state, nothing is 
	//    done.  It does not hurt to call this if the websocket is already connected.
	//-------------------------------------------------------------------------
	static connect( ) {

		if ( WsMngr._host === null ) {
			throw( "WsMngr: connect: Login Crednetials are not yet set. It MUST be set with WsMngr.setConnectData before trying to connect!");
		}
		// TODO ... 
		//  Make this handle cases of not connected, bad state, 
		// If already connected ... just return 
		// Try different URLs if they are available. 
		
		if ( WsMngr.isWebSocketOpen() === false ) {
			var wsUri = 'wss://' + WsMngr._host + '/';  // ':' + WsMngr._port + '/';
			wsUri = 'wss://c1.netc.io/nkapi/ws';
			WsMngr._wsConnStartDate	 = new Date();		// Set time to start trying 
			WsMngr._webSocket           = new WebSocket(wsUri);
			WsMngr._webSocket.onopen    = WsMngr._onWsOpen;		// this calls _login()
			WsMngr._webSocket.onclose   = WsMngr._onWsClose;
			WsMngr._webSocket.onmessage = WsMngr._onWsMessage;
			WsMngr._webSocket.onerror   = WsMngr._onWsError;

			var headerData = { 
				codeRev: WsMngr._versions, 
				url: "  wss://:" + WsMngr._host + ":" + WsMngr._port + "/",
				LoginObj: WsMngr._loginObj
			};

			EventMngr.dispatchEvent( WsMngr.eventNames.onRemoteLoggerInfo, ["WSKT", "WsMngr: connect: Connecting", JSON.stringify( headerData, null, '\t' ) ]);
			
			EventLoggerDb.wsConnLogger("--> Connecting", headerData, WsMngr._wsConnStartDate );

			return "connecting";
		} else {
			return "Already Connected - did nothing!";
		}
	}


	//=========================================================================
	// PUBLIC: close() -- Close WS on client side
	//=========================================================================
	// Close the websocket.  The HTML/JS developer may want to do this to save
	//    battery on mobile devices.  
	// REMEMBER: If the websocket is closed, then no requests initiated by
	//    NetComposer can arrive. 
	//-------------------------------------------------------------------------
	static close() {
		if ( ( !! WsMngr._webSocket ) &&
			 ( typeof WsMngr._webSocket === 'object' ) && 
			 ( WsMngr._webSocket.readyState !== WsMngr.socketStates.WS_STATE_CLOSED ) ) {
			// console.localInfoOnly("WSKT", 'WsMngr: close: Closing WS now');
			EventMngr.dispatchEvent( WsMngr.eventNames.onRemoteLoggerInfo, ["WSKT", "WsMngr: close: Closing WS now" ]);

			EventLoggerDb.wsConnLogger("--> closing", {}, WsMngr._wsConnStartDate );

			WsMngr._webSocket.close();

		} else  {
			console.localInfoOnly("WSKT", 'WsMngr: close: Nothing to close!');
		}
	}


	static sendDataViaPromise( Class, SubClassName, Command, Data ) {
		return new Promise( function(resolve, reject) {
			var testData = WsMngr.createSendObj( Class, SubClassName, Command, Data, resolve, reject);	
			WsMngr.sendAction( testData );
		});
	}


	static responseToString( Response ) {

		var retString;

		if ( WsMngr._debug ) {
			retString = "( Tid: " + Response.tid +
				" Status: " + Response.status +
				" RoundTrip: " + Response.roundTrip +
				") \nResponse: " + JSON.stringify( Response.wsResponseData, null, '\t' ) +
				" \nSent: " + JSON.stringify( Response.wsSendData, null, '\t' ) +
				" \nCallback Stack: " + JSON.stringify( Response.cbStack, null, '\t' );

		} else {
			retString = "( Tid: " + Response.tid +
				" Status: " + Response.status +
				" RoundTrip: " + Response.roundTrip +
				") \nResponse: " + JSON.stringify( Response.wsResponseData, null, '\t' );
		}

		return retString;
	}


    static getStackTrace( TheStack, StackShiftAmount ) {
    	
	  // 	var stack = e.stack.replace(/^[^\(]+?[\n$]/gm, '')
			// .replace(/^\s+at\s+/gm, '')
			// .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
			// .split(/\r\n|\n/);

	  	var stack = TheStack.stack.replace(/^\s+at\s+/gm, '')
			.replace(/\@/gm, ' ')
			.replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
			.split(/\r\n|\n/);

		var shiftNum = (( !!StackShiftAmount) && ( typeof(StackShiftAmount) === "number")) ? StackShiftAmount : 1;

		if ( stack[0] === "Error") { stack.shift(); }	// Handle differences in Chrome vs Safari and Firefox
		if ( stack[ stack.length - 1 ] === "") { stack.pop(); }	// Handle differences in Chrome vs Safari and Firefox

		for (var i = shiftNum; i >= 0; i--) {
	    	stack.shift();
		}

	    return stack;
    }


	//=========================================================================
	// PUBLIC: createSendObj(...) 
	//=========================================================================
	// This is really only to be used by other Class:Cmd managers, not HTML/JS
	// 
	// @param	ClassName: String - Valid NetComposer Class name 
	// @param	CommandName: String - Valide NetComposer Cmd associated with the Class 
	// @param	CommandData: Object - The data part of the JSON message for the Class:Cmd
	// @param	SuccessCB: Function - The Callback function for Success responses from NetComposer
	// @param	ErrorCB: Function -  The Callback function for Error responses from NetComposer
	//-------------------------------------------------------------------------
	static createSendObj( ClassName, SubClassName, CommandName, CommandData, SuccessCB, ErrorCB ) {

		// SubClassName_Optional is Optional
		if ( typeof ( ClassName ) !== 'string' ) { throw("WsMngr: createSendObj: Error: ClassName is not a string"); }
		if ( typeof ( SubClassName ) !== 'string' ) { throw("WsMngr: createSendObj: Error: SubClassName is not a string"); }
		if ( typeof ( CommandName ) !== 'string' ) { throw("WsMngr: createSendObj: Error: CommandName is not a string"); }
		if ( typeof ( CommandData ) !== 'object' ) { throw("WsMngr: createSendObj: Error: CommandData is not an Object"); }
		if ( typeof ( SuccessCB ) !== 'function' ) { throw("WsMngr: createSendObj: Error: SuccessCB is not a function"); }
		if ( typeof ( ErrorCB ) !== 'function' ) { throw("WsMngr: createSendObj: Error: ErrorCB is not a function"); }

		var evt_no = WsMngr._evt_cnt++;
    	
    	var cbStack = WsMngr.getStackTrace( (new Error()) );

		var evtLogObject = EventLoggerDb.createAndLogEvent( "WsMngr" , "SEND", ( ClassName + " " + CommandName ),  CommandData, "wsSend");
		evtLogObject.setDirection("outbound");
		evtLogObject.setTransactionId(evt_no);

		var FullCmdData =
			{
				class: ClassName,
				subclass: SubClassName,
				cmd: CommandName,
				data: CommandData,
				tid: evt_no
			};

		var sendObj = {
			type: "SendObj",
			tid: evt_no,
			cbStack: cbStack,
			evtLogObj: evtLogObject,
			createDate: new Date(),
			sentDate: 0,   // new Date() when sent
			callbackDate: 0,   // new Date when callback
			ackDate: 0,   // new Date when callback
			roundTrip: 0,
			status: "not set",
			wsSendData: FullCmdData,    //  TODO .. Change this to sendData
			wsResponseData: {},
			_successCB: function( Data, MsgDate ) {	
				this.evtLogObj.setSuccess( Data );
				this.evtLogObj.status = Data.result;

				this.callbackDate = MsgDate;
				this.evtLogObj.callbackDate = MsgDate;
				this.roundTrip = this.callbackDate - this.sentDate;
				this.status = Data.result;
				this.wsResponseData = Data;

				var printMsg = "WsMngr: Callback: " + 
					sendObj.wsSendData.cmd + "._successCB(" + this.tid + ") = " +
				 	Data.result;

				// var responseMsg = "\nResponse: " + JSON.stringify( Data, null, '\t');
				// var sendMsg = "\nFor Message: " + JSON.stringify( this.wsSendData, null, '\t');
				// var cbTrace = "\nCallback Stack: " + JSON.stringify( this.cbStack, null, '\t');

				console.info("WSKT", printMsg, WsMngr.responseToString( this ) );
				
				if ( typeof ( SuccessCB ) === 'function' ) { 
					// SuccessCB( Data ); 
					SuccessCB( this ); 
				}
			},
			_errorCB: function( Data, MsgDate ) {
				this.evtLogObj.setError( Data );
				this.evtLogObj.status = Data.result;

				this.callbackDate = MsgDate;
				this.evtLogObj.callbackDate = MsgDate;
				this.roundTrip = this.callbackDate - this.sentDate;
				this.status = Data.result;
				this.wsResponseData = Data;

				var printMsg = "WsMngr: Callback: " + 
					sendObj.wsSendData.cmd + "._errorCB(" + this.tid + ") = " +
				 	Data.result + " " + Data.data.code + " " + Data.data.error;

			 // 	var responseMsg = "\nResponse: " + JSON.stringify( Data, null, '\t');
				// var sendMsg = "\nFor Message: " + JSON.stringify( this.wsSendData, null, '\t');
				// var cbTrace = "\nCallback Stack: " + JSON.stringify( this.cbStack, null, '\t');

				console.warn("WSKT", printMsg, WsMngr.responseToString( this ) );
				
				if ( typeof ( ErrorCB ) === 'function' ) { 
					ErrorCB( this ); 
				}
			},
			setAck: function( AckDate ) {
				this.ackDate = AckDate;
				this.status = "ack";
				this.evtLogObj.ackDate = AckDate;
				this.evtLogObj.status = "ack";
			},
			setStartDate: function( StartDate ) {
				this.sentDate = StartDate;
				this.evtLogObj.sentDate = StartDate;
				this.evtLogObj.startDate = StartDate;
			}
		};

		return sendObj;
	}



	//=========================================================================
	// PRIVATE: _createRecvObj(...) 
	//=========================================================================
	// When NetComposer initates a request, this JS Object is created as a wrapper
	//     for logging and other things.
	// 
	// @param	JsonData: Object - The data from NetComposer 
	//-------------------------------------------------------------------------
	static _createRecvObj( JsonData ) {

		if ( typeof ( JsonData ) !== 'object' ) { throw("Error: JsonData is not an Object"); }

		var evtLogObject = EventLoggerDb.createAndLogEvent( "WsMngr" , "RECV", ( JsonData.class + " " + JsonData.cmd ),  JsonData, "wsRecv");
		evtLogObject.setDirection("inbound");
		evtLogObject.setTransactionId(JsonData.tid);


		var recvObj = {
			type: "RecvObj",
			tid: JsonData.tid,
			evtLogObj: evtLogObject,
			arriveDate: new Date(),
			ackDate: 0,   // new Date when callback
			responseDate: 0,   // new Date when callback
			roundTrip: 0,
			status: "not set",
			wsRecvData: JsonData,   
			wsResponseData: {},
			setResponse: function( ResponseObj ) {
				this.evtLogObj.setSuccess( ResponseObj );
				this.evtLogObj.status = "ok";

				this.responseDate = new Date();
				this.roundTrip = this.responseDate - this.arriveDate;
				this.status = "ok";
				this.wsResponseData = ResponseObj;
			},
			setAck: function( AckDate ) {
				this.ackDate = AckDate;
				this.status = "ack";

				this.evtLogObj.ackDate = AckDate;
				this.evtLogObj.status = "ack";
			}

		};

		// Insert this Object into the recvQueue ... 
		WsMngr._recvQueue[JsonData.tid] = recvObj;
		WsMngr._logDb.push(recvObj);		// Put in the logging Array (DB like) 
		// EventLoggerDb.push(recvObj);

		return recvObj;
	}





		//==========================================================================
		// Overview     
		//==========================================================================
		// The purpose of these functions is to register/delete handlers for 
		//   events arriving at WsMngr from NetComposer.  There can be hundreds
		//   of different event combinations, and this provides a mechanism to handle
		//   them.
		//
		// It allows fro three (3) specifid to generic types of handlers.
		// 1) Class:Subclass:Cmd - is the most specific.  
		// 2) Class:Subclass:_ - is the slightly less specific but more so than just 'Class::'
		// 3) Class:_:_ - this is a generic handler, used for fallback if no other more 
		//       specific handler is available. 
		// 
		// An application can register multiple handlers - but only one per handler name group
		// Ex: media:session:room will be handled by event managers in this order:
		//      1) media:session:room 		- if there is one registered 
		//		2) media:session:_   		- if media:session:room is not registered but this is, use it
		//      3) media:_:_				- if media:session:room or media:session:_ are not registered, use this one
		//==========================================================================


		//==========================================================================
		// Helper Functions - Main ones to use by general / 3rd party programers     
		//==========================================================================

		//--------------------------------------------------------
		// Add Managers 
		// - addClassManager - Is a fallback handler if other more specific handlers are not available
		// - addClassSubclassManager - Is a fallback handler if other more specific handlers are not available
		// - addClassSubclassTypeManager - Is a specific handler that must match Class:Subclass:Type 
		//--------------------------------------------------------

		static addClassManager( ClassName, ClassManagerFunction ) {
			if ( typeof ( ClassName ) !== 'string' ) { throw("Error: addClassManager: ClassName is not a string.  It must be a string like 'nkmedia', etc."); }
			if ( typeof ( ClassManagerFunction ) !== 'function' ) { throw("Error: addClassManager: ClassManagerFunction is not an function. Must be a function."); }

			var comboName = ClassName + ":_:_";

			WsMngr.addManager( comboName, ClassManagerFunction );
		}

		static removeClassManager( ClassName ) {
			var comboName = ClassName + ":_:_";
			WsMngr.removeManager( comboName );
		}

		static addClassSubclassManager( ClassName, SubclassName, ClassManagerFunction ) {
			if ( typeof ( ClassName ) !== 'string' ) { throw("Error: addClassManager: ClassName is not a string.  It must be a string like 'nkmedia', etc."); }
			if ( typeof ( SubclassName ) !== 'string' ) { throw("Error: addClassManager: SubclassName is not a string.  It must be a string like 'nkmedia', etc."); }

			var comboName = ClassName + ":" + SubclassName + ":_";
			
			WsMngr.addManager( comboName, ClassManagerFunction );

		}

		static removeClassSubclassManager( ClassName, SubclassName ) {
			var comboName = ClassName + ":" + SubclassName + ":_";
			WsMngr.removeManager( comboName );
		}

		static addClassSubclassTypeManager( ClassName, SubclassName, CmdName, ClassManagerFunction ) {
			if ( typeof ( ClassName ) !== 'string' ) { throw("Error: addClassManager: ClassName is not a string.  It must be a string like 'nkmedia', etc."); }
			if ( typeof ( SubclassName ) !== 'string' ) { throw("Error: addClassManager: SubclassName is not a string.  It must be a string like 'nkmedia', etc."); }
			if ( typeof ( CmdName ) !== 'string' ) { throw("Error: addClassManager: CmdName is not a string.  It must be a string like 'login', etc."); }

			var comboName = ClassName + ":" + SubclassName + ":" + CmdName;
			
			WsMngr.addManager( comboName, ClassManagerFunction );

		}

		static removeClassSubclassTypeManager( ClassName, SubclassName, CmdName ) {
			var comboName = ClassName + ":" + SubclassName + ":" + CmdName;
			WsMngr.removeManager( comboName );
		}



		//==========================================================================
		// Core Functions      
		//==========================================================================

		//--------------------------------------------------------
		//  addManager - Generic funciton used by other add...Managers 
		//--------------------------------------------------------
		static addManager( ManagerComboName, ClassManagerFunction ) {
			if ( typeof ( ManagerComboName ) !== 'string' ) { throw("Error: addManager: ManagerComboName is not a string.  It must be a string like 'nkmedia', etc."); }
			if ( typeof ( ClassManagerFunction ) !== 'function' ) { throw("Error: addManager: ClassManagerFunction is not an function. Must be a function."); }

			if ( !! WsMngr._classManagers[ManagerComboName] ) { 
				throw("Error: addManager: classManagers[" + ManagerComboName + "] already has a manager. " +
					"You may only have one manager per class of this type.  You may delete the other managers of this type and " +
					"then add this one. " );
			} else {
				WsMngr._classManagers[ManagerComboName] = ClassManagerFunction;
			}
		}

		//--------------------------------------------------------
		//  removeManager - Generic funciton used by other remove...Managers 
		//--------------------------------------------------------
		static removeManager( ManagerComboName ) {
			if ( !! WsMngr._classManagers[ManagerComboName] ) { 
				delete WsMngr._classManagers[ ManagerComboName ];
			}
		}

		//--------------------------------------------------------
		//  listClassManagers - Lists all Managers  
		//--------------------------------------------------------
		static listClassManagers() {
			var listOfKeys = "";
			for ( var keys in WsMngr._classManagers ) {
				listOfKeys = listOfKeys + keys + " | ";
			}
			return listOfKeys;
		}



		//--------------------------------------------------------
		//  handleEvent - Parses an object from WsMngr and sends it to 
		//     registered handlers.
		//--------------------------------------------------------
		static handleEvent( WsEventObj ) {

			if ( ( WsEventObj.wsRecvData.class === "core" ) && ( WsEventObj.wsRecvData.cmd === "event") && ( !!WsEventObj.wsRecvData.data ) ) {		// This seems to be an Event from NetComposer

				var comboName1 = "";
				var comboName2 = "";
				var comboName3 = "";

				if ( !!WsEventObj.wsRecvData.data.class ) { 
					comboName1 = WsEventObj.wsRecvData.data.class;
					comboName2 = WsEventObj.wsRecvData.data.class;
					comboName3 = WsEventObj.wsRecvData.data.class + ":_:_";
				} else { 		// Data.class is not given - ERROR 
					throw( "WsMngr: handleEvent: Error: No Data.class field in this event: ", WsEventObj.wsRecvData );
				}

				if ( !!WsEventObj.wsRecvData.data.subclass ) { 
					comboName1 = comboName1 + ":" + WsEventObj.wsRecvData.data.subclass;
					comboName2 = comboName2 + ":" + WsEventObj.wsRecvData.data.subclass + ":_";
				} else { 		// Data.subclass is not given - ERROR 
					throw( "WsMngr: handleEvent: Error: No Data.class field in this event: ", WsEventObj.wsRecvData );
				}

				if ( !!WsEventObj.wsRecvData.data.type ) { 
					comboName1 = comboName1 + ":" + WsEventObj.wsRecvData.data.type;
				} else { 		// Data.type is not given - ERROR 
					throw( "WsMngr: handleEvent: Error: No Data.class field in this event: ", WsEventObj.wsRecvData );
				}

				if ( !! WsMngr._classManagers[ comboName1 ] ) {
					console.localDebugOnly("WSKT", "WsMngr: handleEvent: handleEvent: Using comboName1 - " + comboName1 );
					WsMngr._classManagers[ comboName1 ]( WsEventObj.wsRecvData );
					return true;
				} else if ( !! WsMngr._classManagers[ comboName2 ] ) {
					console.localDebugOnly("WSKT", "WsMngr: handleEvent: handleEvent: Using comboName2 - " + comboName2 );
					WsMngr._classManagers[ comboName2 ]( WsEventObj.wsRecvData );
					return true;
				} else if ( !! WsMngr._classManagers[ comboName3 ] ) {
					console.localDebugOnly("WSKT", "WsMngr: handleEvent: handleEvent: Using comboName3 - " + comboName3 );
					WsMngr._classManagers[ comboName3 ]( WsEventObj.wsRecvData );
					return true;
				} else {
					// console.localErrorOnly("WSKT", "WsMngr: handleEvent: Error: No Handler for this event: " + JSON.stringify( WsEventObj.wsRecvData, null, '\t' ) );
					EventMngr.dispatchEvent( WsMngr.eventNames.onRemoteLoggerError, ["WSKT", 
						"WsMngr: handleEvent: Error: No Handler for this event.\n" +
						"This will cause the web socket to die!!\n" + 
						"Automatically sending an error back so the Web Socket does not die.\n" + 
						"This MUST be fixed!", 
						JSON.stringify( WsEventObj.wsRecvData, null, '\t' ) ]);

					WsMngr.respondError( WsEventObj, 333, "WsMngr: handleEvent: No Handler available for this Event" + JSON.stringify( WsEventObj, null, '\t') );

				}

			} else {		// This does NOT seem to be an Event from NetComposer
				throw( "WsMngr: handleEvent: Error: This event is not valid: ", WsEventObj.wsRecvData );
			}
		}


}



