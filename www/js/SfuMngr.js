'use strict';


const SfuMngr_Version = `SfuMngr 1.0.0`;

/**
 * Constructs a new SfuMngr instance
 * 
 * @extends {MediaMngr}
 * 
 * @param  {object}		SettingsObject	[Optional] Object with name/value pairs of parameters to be set.  You can use this to set an value (including those not in the class).
 * 			It is a convience method for setting multple things at once and/or passing them from other sub classes or parents.
 *
 * @param {string} SettingsObject.roomId (Optional) Name of the room.  If not provided, one will be created.
 * @param {string} SettingsObject.roomId (Optional) Name of the room.  If not provided, one will be created.
 * 
 * @return {SfuMngr} SfuMngr
 * 
 * @see RtcMedia
 * @see MediaMngr
 * @see NkMedia
 *
 * @class
 * @requires {@link RtcMedia}
 * @requires {@link NkMedia}
 * @requires {@link MediaMngr}
 * @requires {@link WebSocketManager}
 * @requires {@link DebugData}
 * @requires {@link PromiseData}
 * @requires {@link RemoteLogger}
 * @requires {@link EventLoggerDb}
 * @requires {@link EventBus}
 * @requires {@link WsLib}
 * @requires {@link adapter}
 * @requires {@link getScreenId}
 */
class SfuMngr extends EventMngr {

	/**
	 * Constructs a new instance 
	 */
    constructor( Name, ConfName ) {
    	super();

		var dbg = new DebugData( SfuMngr.className, this, "constructor", Name, ConfName ).dbgEnter( true );

    	this._roomId = null;
    	this._confName = ( typeof ConfName === 'string' ) ? ConfName : null;				// Used for conference name if provided
    	this._name = ( typeof Name === 'string' ) ? Name : SfuMngr.createNewName(); 		// Instance Name - NOT used for conference name
    	this._joinMethod = null;

    	SfuMngr.dbAdd( this );

		dbg.dbgExit( );
    }


	toJSON() {
		return {
			name: this._name,
			roomId: this._roomId,
			confName: this._confName,
			joinMethod: this._joinMethod,
		};
	}


	//--------------------------------------------------------
	//  version(s), className, toString & Versions
	//--------------------------------------------------------
	get className() { return SfuMngr.className; }
	toString() { return '[object SfuMngr]'; }

    static get className() { return "SfuMngr"; }
	static toString() { return `[object SfuMngr]`; }

	get version() { return SfuMngr.version; }
	get versions() { return SfuMngr.versions; }
    static get version() { return SfuMngr_Version; }
    static get versions() { return `${SfuMngr_Version} --> ${super.versions}`; }  // there is no super for this.


	//==========================================================================
	// Class  Functions   
	//==========================================================================

	static get defaultValues() {
		return {
			confBitrate: 0,
			confAudioCodec: 'opus',
			confVideoCodec: 'vp8',
		};
	}

	static get joinMethods() {
		return {
			join: 'join',
			create: 'create'
		};
	}



	// No Setter, because it should not be changed 
	
    get name() { 
    	if ( typeof this._name !== 'string' ) {
    		this._name = RtcMedia.createNewName();
    	}

    	return this._name; 
    }




	//--------------------------------------------------------
	//  confName
	//--------------------------------------------------------

    set confName( ConfName ) {
    	this._confName = ConfName;
    }
    
    get confName() {
    	return this._confName;
    }

	//--------------------------------------------------------
	//  roomId
	//--------------------------------------------------------

	// No Setter for roomId 
	    
    get roomId() {
    	return this._roomId;
    }

	//--------------------------------------------------------
	//  roomBitrate
	//--------------------------------------------------------

    set roomBitrate( BitrateNum ) {
    	this._roomBitrate = BitrateNum;
    }

    get roomBitrate( ) {
    	return this._roomBitrate;
    }

	//--------------------------------------------------------
	//  roomAudioCodec
	//--------------------------------------------------------

    set roomAudioCodec( AudioCodec ) {
    	this._roomAudioCodec = AudioCodec;
    }

    get roomAudioCodec( ) {
    	return this._roomAudioCodec;
    }

	//--------------------------------------------------------
	//  roomVideoCodec
	//--------------------------------------------------------

    set roomVideoCodec( VideoCodec ) {
    	this._roomVideoCodec = VideoCodec;
    }

    get roomVideoCodec( ) {
    	return this._roomVideoCodec;
    }



	//--------------------------------------------------------
	//  createRoom
	//--------------------------------------------------------



	createRoom() {
		var dbg = new DebugData( SfuMngr.className, this, "createRoom" ).dbgEnter( true );

		var cmdData = {
			class: 'sfu',
			backend: NkMedia.mediaServerTypes.JANUS
		};

		if ( typeof this.confName === 'string' ) {
			cmdData.room_id = this.confName;
		}

		cmdData.bitrate = ( typeof this.roomBitrate === 'number' ) ? this.roomBitrate : SfuMngr.defaultValues.confBitrate;
		cmdData.audio_codec = ( typeof this.roomAudioCodec === 'number' ) ? this.roomAudioCodec : SfuMngr.defaultValues.confAudioCodec;
		cmdData.video_codec = ( typeof this.roomVideoCodec === 'number' ) ? this.roomVideoCodec : SfuMngr.defaultValues.confVideoCodec;

		dbg.infoMessage( 'Calling NkMedia._nkMediaRoomCreate', cmdData, false);

		var self = this;

		return NkMedia._nkMediaRoomCreate( cmdData, false )
			.then( 
	        	function( Data ) {
	        		self._roomId = Data.data.room_id;
	        		self._joinMethod = SfuMngr.joinMethods.create;

    		    	SfuMngr.dbUpdate( self );

	        		dbg.dbgExit( Data );
	        		return Data;
	        	}    		
			)
			.catch( 
	        	function( Data ) {
	        		dbg.dbgExit( Data );
	        		return Data;
	        	}    		
			);
	}


	joinRoom() {
		var dbg = new DebugData( SfuMngr.className, this, "joinRoom" ).dbgEnter( true );
		var cmdData = {
			room_id: this.confName
		};

    	var myError;

    	// room_id 
    	if ( ( typeof( this.confName ) !== 'string' ) ) {
			myError = new Error('this.confName was not set, which should mean there is NO conference to list!');
    		dbg.warnMessage( myError.stack );
    		return Promise.reject( myError );
    	} 

		var self = this;

    	return NkMedia._nkMediaRoomInfo( cmdData )
			.then( 
	        	function( Data ) {
	        		self._roomId = Data.data.room_id;
	        		self._joinMethod = SfuMngr.joinMethods.join;
    		    	SfuMngr.dbUpdate( self );

	        		dbg.dbgExit( Data );
	        		return Data;
	        	}    		
			)
			.catch( 
	        	function( Data ) {
	        		dbg.dbgExit( Data );
	        		return Data;
	        	}    		
			);
	}



	destroyRoom() {
		var dbg = new DebugData( SfuMngr.className, this, "destroyRoom" ).dbgEnter( true );
		var cmdData = {
			room_id: this.roomId
		};

    	var myError;

    	// room_id 
    	if ( ( typeof( this.roomId ) !== 'string' ) ) {
			myError = new Error('this.roomId was not set, which should mean there is NO conference to destoy!');
    		dbg.warnMessage( myError.stack );
    		return Promise.reject( myError );
    	} 

    	var self = this;

    	return NkMedia._nkMediaRoomDestroy( cmdData )
			.then( 
	        	function( Data ) {
	        		self._roomId = null;
    		    	SfuMngr.dbDelete( self );
	        		dbg.dbgExit( Data );
	        		return Data;
	        	}    		
			)
			.catch( 
	        	function( Data ) {
	        		dbg.dbgExit( Data );
	        		return Data;
	        	}    		
			);
	}


	roomInfo() {
		var dbg = new DebugData( SfuMngr.className, this, "roomInfo" ).dbgEnter( true );
		var cmdData = {
			room_id: this.roomId
		};

    	var myError;

    	// room_id 
    	if ( ( typeof( this.roomId ) !== 'string' ) ) {
			myError = new Error('this.roomId was not set, which should mean there is NO conference to list!');
    		dbg.warnMessage( myError.stack );
    		return Promise.reject( myError );
    	} 

    	return NkMedia._nkMediaRoomInfo( cmdData )
			.then( 
	        	function( Data ) {
	        		dbg.dbgExit( Data );
	        		return Data;
	        	}    		
			)
			.catch( 
	        	function( Data ) {
	        		dbg.dbgExit( false, Data );
	        		return Data;
	        	}    		
			);
	}


	sendMessage( MsgObject ) {
		var dbg = new DebugData( SfuMngr.className, this, "sendMessage" ).dbgEnter( true );
		var cmdData = {
			room_id: this.roomId,
			msg: MsgObject
		};

    	var myError;

    	// room_id 
    	if ( ( typeof( this.roomId ) !== 'string' ) ) {
			myError = new Error('this.roomId was not set, which should mean there is NO conference to list!');
    		dbg.warnMessage( myError.stack );
    		return Promise.reject( myError );
    	} 

    	// room_id 
    	if ( ( typeof( MsgObject ) !== 'object' ) ) {
			myError = new Error('MsgObject was not provided or not an object. Please provide a valid MsgObject!');
    		dbg.warnMessage( myError.stack );
    		return Promise.reject( myError );
    	} 

    	return NkMedia._nkMediaRoomMsgLogSend( cmdData )
			.then( 
	        	function( Data ) {
	        		dbg.dbgExit( Data );
	        		return Data;
	        	}    		
			)
			.catch( 
	        	function( Data ) {
	        		dbg.dbgExit( false, Data );
	        		return Data;
	        	}    		
			);
	}


	getPastMessages() {
		
	}


	listRooms() {
		return SfuMngr.listRooms();
	}

	static listRooms() {
		var dbg = new DebugData( SfuMngr.className, this, "listRooms" ).dbgEnter( true );

    	return NkMedia._nkMediaRoomList( )
			.then( 
	        	function( Data ) {
	        		dbg.dbgExit( Data );
	        		return Data;
	        	}    		
			)
			.catch( 
	        	function( Data ) {
	        		dbg.dbgExit( false, Data );
	        		return Data;
	        	}    		
			);
		
	}











	static get counter() {
		if ( typeof SfuMngr._counter !== 'number') {
			SfuMngr._counter = 1;
		} else {
			SfuMngr._counter = SfuMngr._counter + 1;
		}
		return SfuMngr._counter;
	}


	static createNewName() { 
		var retVal = "SfuMngr_Instance_" + SfuMngr.counter;
		return retVal;
	}


	//--------------------------------------------------------
	//  Database 
	//--------------------------------------------------------

	static dbAdd( SfuMngrInstance ) {
		SfuMngr._dbCreate();

		if ( typeof SfuMngrInstance.name === 'string' ) {
			SfuMngr._db.name[ SfuMngrInstance.name ] = SfuMngrInstance;
		}

		if ( typeof SfuMngrInstance.confName === 'string' ) {
			SfuMngr._db.confName[ SfuMngrInstance.confName ] = SfuMngrInstance;
		}

		if ( typeof SfuMngrInstance.roomId === 'string' ) {
			SfuMngr._db.roomId[ SfuMngrInstance.roomId ] = SfuMngrInstance;
		}		
	}

	static dbUpdate( SfuMngrInstance ) {
		SfuMngr.dbAdd( SfuMngrInstance );
	}

	static dbDelete( SfuMngrInstance ) {
		SfuMngr._dbCreate();
		
		if ( typeof SfuMngrInstance.name === 'string' ) {
			delete SfuMngr._db.name[ SfuMngrInstance.name ];
		}

		if ( typeof SfuMngrInstance.confName === 'string' ) {
			delete SfuMngr._db.confName[ SfuMngrInstance.confName ];
		}

		if ( typeof SfuMngrInstance.roomId === 'string' ) {
			delete SfuMngr._db.roomId[ SfuMngrInstance.roomId ];
		}				
	}

	static _dbCreate() {
		if ( typeof SfuMngr._db !== 'object' ) {
			SfuMngr._db = {
				name: {},
				confName: {},
				roomId: {}
			};
		}
	}

	static dbList() {
		SfuMngr._dbCreate();
		return SfuMngr._db;
	}


	//====================================================================================
	// S F U    Helpers
	//====================================================================================
	// sfuRoomCreate
	// sfuRoomInfo
	// sfuRoomDestroy
	// sfuRoomSendMessage
	// sfuRoomGetMessages
	//
	// sfuJoinAsAdmin -- Admin is a publisher with extra rights
	// sfuJoinAsPublisher 
	// sfuJoinAsListener 
	//====================================================================================



	//--------------------------------------------------------
	//  sfuRoomCreate
	//--------------------------------------------------------
	// Create SFU Room
	//
	// @param DataObject - (O) {object} - Other optional parameters for conference creation
	// 
	// @return Data
	// @see NkMedia._nkMediaRoomCreate
	//--------------------------------------------------------
    static sfuRoomCreate( DataObject ) {

    	var data = {
    		class: 'sfu',
    		backend: 'nkmedia_janus'
    	};

    	if ( typeof SfuMngr.roomId === 'string' ) {
    		data.room_id = SfuMngr.roomId;
    	} 

    	if ( typeof( DataObject ) === 'object' ) {
    		data = Object.assign( {}, DataObject, data );
    	} 

    	return NkMedia._nkMediaRoomCreate( data );
    }


	//--------------------------------------------------------
	//  sfuRoomInfo
	//--------------------------------------------------------
	// Get Info about a room
	//
	// @param RoomName - (M) {string} - Should be a valid room
	// 
	// @return Promise from NkMedia._nkMediaRoomInfo
	// @see NkMedia._nkMediaRoomInfo
	//--------------------------------------------------------
    static sfuRoomInfo( RoomName ) {
    	var data = {
		    room_id: RoomName,
    	};

    	return NkMedia._nkMediaRoomInfo( data );
	}

	//--------------------------------------------------------
	//  sfuRoomDestroy
	//--------------------------------------------------------
	// Get Info about a room
	//
	// @param RoomName - (M) {string} - Should be a valid room
	// 
	// @return Promise from NkMedia._nkMediaRoomDestroy
	// @see NkMedia._nkMediaRoomDestroy
	//--------------------------------------------------------
    static sfuRoomDestroy( RoomName ) {
    	var data = {
		    room_id: RoomName,
    	};

    	return NkMedia._nkMediaRoomDestroy( data );
	}

	//--------------------------------------------------------
	//  sfuRoomSendMessage
	//--------------------------------------------------------
	// Get Info about a room
	//
	// @param RoomName - (M) {string} - Should be a valid room
	// @param TextMessage - (M) {string} - Text message to send
	// 
	// @return Promise from NkMedia._nkMediaRoomMsgLogSend
	// @see NkMedia._nkMediaRoomMsgLogSend
	//--------------------------------------------------------
    static sfuRoomSendMessage( RoomName, TextMessage ) {

    	var data = {
		    room_id: RoomName,
		    msg: {
		    	textMessage: TextMessage
		    }
    	};

    	return NkMedia._nkMediaRoomMsgLogSend( data );
	}

	//--------------------------------------------------------
	//  sfuRoomGetMessages
	//--------------------------------------------------------
	// Get Info about a room
	//
	// @param RoomName - (M) {string} - Should be a valid room
	// 
	// @return Promise from NkMedia._nkMediaRoomMsgLogGet
	// @see NkMedia._nkMediaRoomMsgLogGet
	//--------------------------------------------------------
    static sfuRoomGetMessages( RoomName ) {
    	var data = {
		    room_id: RoomName,
    	};

    	return NkMedia._nkMediaRoomMsgLogGet( data );
	}


	//--------------------------------------------------------
	//  sfuRoomGetMessages
	//--------------------------------------------------------
	handle_Media_Session_Room( WsEventObj ) {

		var roomBody = WsEventObj.data.body;

		console.log( "SFU", "SfuMngr: handle_Media_Session_Room:\n", JSON.stringify( WsEventObj, null, "\t" ));

		if ( roomBody.room !== this.room_id ) {
			return; 
		}



		WebSocketManager.respondAck( WsEventObj );

		WebSocketManager.respondOk( WsEventObj, { thanks: "for that roomBody!"} );

		switch( roomBody.type ) {
		    
		    case "started_publisher" :
					// 	"class": "core",
					// 	"cmd": "event",
					// 	"data": {
					// 		"body": {
					// 			"publisher": "b2a51764-38cc-5fad-715b-0401a4bb3501",
					// 			"room": "cool_room@sipstorm.net",
					// 			"type": "started_publisher"
					// 		},
					// 		"class": "media",
					// 		"obj_id": "2582f7b5-38cc-5ec5-000b-0401a4bb3501",
					// 		"subclass": "session",
					// 		"type": "room"
					// 	},
					// 	"tid": 2
					// }

					// Keep list of publishers and listeners current 
					// Notify App of new Publisher ... they should connect if they want to
				EventBus.dispatch( "onStartedPublisher", roomBody );
		        break;
		    
		    case "stopped_publisher" :

					// {
					// 	"class": "core",
					// 	"cmd": "event",
					// 	"data": {
					// 		"body": {
					// 			"publisher": "b2a51764-38cc-5fad-715b-0401a4bb3501",
					// 			"room": "cool_room@sipstorm.net",
					// 			"type": "stopped_publisher"
					// 		},
					// 		"class": "media",
					// 		"obj_id": "2582f7b5-38cc-5ec5-000b-0401a4bb3501",
					// 		"subclass": "session",
					// 		"type": "room"
					// 	},
					// 	"tid": 9
					// }
				EventBus.dispatch( "onStoppedPublisher", roomBody );
		        break;
		    
		    case "started_listener" :
					// {
					// 	"class": "core",
					// 	"cmd": "event",
					// 	"data": {
					// 		"body": {
					// 			"listener": "e4a2e341-38cc-7c81-75bb-0401a4bb3501",
					// 			"publisher": "ff73b50a-38cc-79d2-aec7-0401a4bb3501",
					// 			"room": "cool_room@sipstorm.net",
					// 			"type": "started_listener"
					// 		},
					// 		"class": "media",
					// 		"obj_id": "2582f7b5-38cc-5ec5-000b-0401a4bb3501",
					// 		"subclass": "session",
					// 		"type": "room"
					// 	},
					// 	"tid": 13
					// }
				EventBus.dispatch( "onStartedListener", roomBody );
		        break;
		    
		    case "stopped_listener" :
					// {
					// 	"class": "core",
					// 	"cmd": "event",
					// 	"data": {
					// 		"body": {
					// 			"listener": "e4a2e341-38cc-7c81-75bb-0401a4bb3501",
					// 			"room": "cool_room@sipstorm.net",
					// 			"type": "stopped_listener"
					// 		},
					// 		"class": "media",
					// 		"obj_id": "2582f7b5-38cc-5ec5-000b-0401a4bb3501",
					// 		"subclass": "session",
					// 		"type": "room"
					// 	},
					// 	"tid": 17
					// }
				EventBus.dispatch( "onStoppedListener", roomBody );
		        break;

		    default:
				console.error( "SFU","SfuMngr: handle_Media_Session_Room: Un-handled Event.  Need to implement functionality for this.\n", JSON.stringify( WsEventObj, null, "\t" ));
		}						

	}






	//--------------------------------------------------------
	//  sfuRoomGetMessages
	//--------------------------------------------------------
	static handle_Media_Session_Room( WsEventObj ) {

		var roomBody = WsEventObj.data.body;

		console.log( "SFU", "SfuMngr: handle_Media_Session_Room:\n", JSON.stringify( WsEventObj, null, "\t" ));

		if ( roomBody.room !== this.room_id ) {
			return; 
		}



		WebSocketManager.respondAck( WsEventObj );

		WebSocketManager.respondOk( WsEventObj, { thanks: "for that roomBody!"} );

		switch( roomBody.type ) {
		    
		    case "started_publisher" :
					// 	"class": "core",
					// 	"cmd": "event",
					// 	"data": {
					// 		"body": {
					// 			"publisher": "b2a51764-38cc-5fad-715b-0401a4bb3501",
					// 			"room": "cool_room@sipstorm.net",
					// 			"type": "started_publisher"
					// 		},
					// 		"class": "media",
					// 		"obj_id": "2582f7b5-38cc-5ec5-000b-0401a4bb3501",
					// 		"subclass": "session",
					// 		"type": "room"
					// 	},
					// 	"tid": 2
					// }

					// Keep list of publishers and listeners current 
					// Notify App of new Publisher ... they should connect if they want to
				EventBus.dispatch( "onStartedPublisher", roomBody );
		        break;
		    
		    case "stopped_publisher" :

					// {
					// 	"class": "core",
					// 	"cmd": "event",
					// 	"data": {
					// 		"body": {
					// 			"publisher": "b2a51764-38cc-5fad-715b-0401a4bb3501",
					// 			"room": "cool_room@sipstorm.net",
					// 			"type": "stopped_publisher"
					// 		},
					// 		"class": "media",
					// 		"obj_id": "2582f7b5-38cc-5ec5-000b-0401a4bb3501",
					// 		"subclass": "session",
					// 		"type": "room"
					// 	},
					// 	"tid": 9
					// }
				EventBus.dispatch( "onStoppedPublisher", roomBody );
		        break;
		    
		    case "started_listener" :
					// {
					// 	"class": "core",
					// 	"cmd": "event",
					// 	"data": {
					// 		"body": {
					// 			"listener": "e4a2e341-38cc-7c81-75bb-0401a4bb3501",
					// 			"publisher": "ff73b50a-38cc-79d2-aec7-0401a4bb3501",
					// 			"room": "cool_room@sipstorm.net",
					// 			"type": "started_listener"
					// 		},
					// 		"class": "media",
					// 		"obj_id": "2582f7b5-38cc-5ec5-000b-0401a4bb3501",
					// 		"subclass": "session",
					// 		"type": "room"
					// 	},
					// 	"tid": 13
					// }
				EventBus.dispatch( "onStartedListener", roomBody );
		        break;
		    
		    case "stopped_listener" :
					// {
					// 	"class": "core",
					// 	"cmd": "event",
					// 	"data": {
					// 		"body": {
					// 			"listener": "e4a2e341-38cc-7c81-75bb-0401a4bb3501",
					// 			"room": "cool_room@sipstorm.net",
					// 			"type": "stopped_listener"
					// 		},
					// 		"class": "media",
					// 		"obj_id": "2582f7b5-38cc-5ec5-000b-0401a4bb3501",
					// 		"subclass": "session",
					// 		"type": "room"
					// 	},
					// 	"tid": 17
					// }
				EventBus.dispatch( "onStoppedListener", roomBody );
		        break;

		    default:
				console.error( "SFU","SfuMngr: handle_Media_Session_Room: Un-handled Event.  Need to implement functionality for this.\n", JSON.stringify( WsEventObj, null, "\t" ));
		}						

	}




	nkMediaSessionStart_Publisher() {
    	
       	var cmdData = {
       		type: "publish",
       		offer: {
       			sdp: this.sdpOffer
       		}
       	};

    	console.debug( "SFU", `SfuMngr: nkMediaSessionStart_Publisher -> NkMedia._chn_nk_MediaSessionStart( ${cmdData} ) -> Promise( NkMediaData ) ` );
       	return NkMedia._chn_nk_MediaSessionStart( cmdData );	// Returns NkMedia Data 
	}


    callSfuAsPublisher() {

    	console.debug( "SFU", `SfuMngr: START callSfuAsPublisher()`);

    	var self = this;

        this.peerConn_AddLocalStream_CreateOffer_SetLocalDescription_WaitForIce( this.localStream, 0, 1000 ).then(
			function() {
		    	console.debug( "SFU", `SfuMngr: callSfuAsPublisher: SDP = `, self.sdpOffer );

		       	var cmdData = {
		       		type: "publish",
		       		offer: {
		       			sdp: self.sdpOffer
		       		}
		       	};

		       	//=========
		       	// NOTE --- REPLACE WITH nkMediaSessionStart_Publisher
		       	//===========
		       	return NkMedia._chn_nk_MediaSessionStart( cmdData );	// Returns NkMedia Data 
	        }        	
        ).then(

        	function( Data ) {
	        	console.log( "SFU", "SfuMngr: callSfuAsPublisher:  RESOLVE  2  *** ", Data.response.data.answer.sdp, Data.response.data.session_id );
	        	var sdp = Data.response.data.answer.sdp;
	        	var ncSessionId = Data.response.data.session_id;

	        	self.ncSessionId = ncSessionId;

        		return self.peerConn_setRemoteSdpAnswer( sdp );	// Sets self.remoteStream -- Returns () 
        	}
    	).then(
        	function( ) {
	        	console.log( "SFU", "SfuMngr: callSfuAsPublisher:   RESOLVE  3  *** " );
	        	if ( !! self.remoteVideoElement ) {
		        	self.remoteVideoElement.srcObject = self.remoteStream;
	        	}
        	}
    	).catch(
			function(error) {
	        	console.error( "SFU", "SfuMngr: callSfuAsPublisher: error: ", JSON.stringify( error, null, "\t"), error, error.stack);
			}
    	);

    	console.debug( "SFU", `SfuMngr: END callSfuAsPublisher()`);

    }






    callSfuAsAdmin() {

    }


    callSfuAsListener() {

    }

    close() {
    	// Really need to close everything in the db - all channels
		this.closePeerConn();

    }

}


