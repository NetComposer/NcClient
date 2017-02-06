'use strict';


const SfuMngr_Version = `RoomMngr 1.0.0`;

/**
 * Constructs a new RoomMngr instance
 * 
 * @extends {MediaMngr}
 * 
 * @param  {object}		SettingsObject	[Optional] Object with name/value pairs of parameters to be set.  You can use this to set an value (including those not in the class).
 * 			It is a convience method for setting multple things at once and/or passing them from other sub classes or parents.
 *
 * @param {string} SettingsObject.roomId (Optional) Name of the room.  If not provided, one will be created.
 * @param {string} SettingsObject.roomId (Optional) Name of the room.  If not provided, one will be created.
 * 
 * @return {RoomMngr} RoomMngr
 * 
 * @see RtcMedia
 * @see MediaMngr
 * @see NkMedia
 *
 * @class
 * @requires {@link RtcMedia}
 * @requires {@link NkMedia}
 * @requires {@link MediaMngr}
 * @requires {@link WsMngr}
 * @requires {@link DebugData}
 * @requires {@link PromiseData}
 * @requires {@link RemoteLogMngr}
 * @requires {@link EventLoggerDb}
 * @requires {@link EventMngr}
 * @requires {@link adapter}
 * @requires {@link getScreenId}
 */
class RoomMngr extends EventMngr {

	/**
	 * Constructs a new instance 
	 */
    constructor( Name, ConfName ) {
    	super();

		var dbg = new DebugData( RoomMngr.className, this, "constructor", Name, ConfName ).dbgEnter( true );

    	this._roomId = null;
    	this._confName = ( typeof ConfName === 'string' ) ? ConfName : null;				// Used for conference name if provided
    	this._name = ( typeof Name === 'string' ) ? Name : RoomMngr.createNewName(); 		// Instance Name - NOT used for conference name
    	this._joinMethod = null;
    	this._publisher = null;
    	this._automaticallyDisplayPublisher = RoomMngr.defaultValues.automaticallyDisplayPublisher;
    	this._listenMediaDb = {};
    	this._listenerDiv = null;

    	RoomMngr.dbAdd( this );

		dbg.dbgExit( );
    }


	toJSON() {
		return {
			name: this._name,
			roomId: this._roomId,
			confName: this._confName,
			joinMethod: this._joinMethod,
			publisher: this._publisher,
			automaticallyDisplayPublisher: this._automaticallyDisplayPublisher,
	    	listenMediaDb: this._listenMediaDb,

		};
	}



	//--------------------------------------------------------
	//  version(s), className, toString & Versions
	//--------------------------------------------------------
	get className() { return RoomMngr.className; }
	toString() { return '[object RoomMngr]'; }

    static get className() { return "RoomMngr"; }
	static toString() { return `[object RoomMngr]`; }

	get version() { return RoomMngr.version; }
	get versions() { return RoomMngr.versions; }
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
			automaticallyDisplayPublisher: true,
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
	//  publisher
	//--------------------------------------------------------

	set automaticallyDisplayPublisher( TrueFalse ) {
		var dbg = new DebugData( RoomMngr.className, this, "set automaticallyDisplayPublisher", TrueFalse ).dbgDo( );

    	if ( TrueFalse === this._sendAudio ) {
    		// Do nothing here so we don't waste time and resources 
    	} else {		// They are different so check and process

    		if ( typeof TrueFalse === 'boolean' ) {
    			this._automaticallyDisplayPublisher = TrueFalse;
				dbg.logMessage( "Set to ", TrueFalse );
    		} else {
				dbg.warnMessage( "Value must be true or false. " +
					`You gave ${TrueFalse}.  Setting to default value of '${RoomMngr.defaultValues.automaticallyDisplayPublisher}'` );
				this._automaticallyDisplayPublisher = RoomMngr.defaultValues.automaticallyDisplayPublisher;
    		}
    	}

	}


	get automaticallyDisplayPublisher() {
		return this._automaticallyDisplayPublisher;
	}


	//--------------------------------------------------------
	//  listenerDiv
	//--------------------------------------------------------

    set listenerDiv( ListenerDiv ) {

		var dbg = new DebugData( RoomMngr.className, this, "set listenerDiv", ListenerDiv ).dbgDo( );

		this._listenerDiv = ListenerDiv;
    	
    }
    
    get listenerDiv() {
    	return this._listenerDiv;
    }



	//--------------------------------------------------------
	//  publisher
	//--------------------------------------------------------

    set publisher( PublishMediaInstance ) {

		var dbg = new DebugData( RoomMngr.className, this, "set publisher", PublishMediaInstance ).dbgDo( );

		if ( PublishMediaInstance instanceof PublishMedia ) {
			this._publisher = PublishMediaInstance;

			// Set the RoomMngr reference back to this roomMngr
			PublishMediaInstance.roomMngr = this;
		} else {
			var throwVal = "RoomMngr: set publisher: value instanceof PublishMedia.  You gave " + PublishMediaInstance ;
			dbg.errorMessage( throwVal );
			throw( throwVal );
		}
    	
    }
    
    get publisher() {
    	return this._publisher;
    }



    callPublish( ) {
		var dbg = new DebugData( RoomMngr.className, this, "callPublish" ).dbgDo( );

		if ( this.publisher === null ) {
			var throwVal = "RoomMngr: callPublish: A publisher has not been set.  Please set a publisher before calling this function!";
			dbg.errorMessage( throwVal );
			throw( throwVal );
		} 

    	return this.publisher.callPublish();

    }

    joinAsPublisher( PublishMediaInstance ) {
		new DebugData( RoomMngr.className, this, "joinAsPublisher" ).dbgDo( );

		this.publisher = PublishMediaInstance;

    	return this.publisher.callPublish();

    }


    joinAsListener( ) {
		new DebugData( RoomMngr.className, this, "joinAsPublisher" ).dbgDo( );

    	return this.publisher.callPublish();

    }

 

    addListener( ListenMediaInstance ) {
		var dbg = new DebugData( RoomMngr.className, this, "addListener", ListenMediaInstance ).dbgDo( true );

		if ( ListenMediaInstance instanceof ListenMedia ) {
			var throwVal = "RoomMngr: addListener: A listener has not been added.  You did not provide a valid ListenMedia object!";
			dbg.errorMessage( throwVal );
			throw( throwVal );
		} 

		this._listenMediaDb[ ListenMediaInstance.name ] = ListenMediaInstance;

    }

    deleteListener( ListenMediaInstance ) {
		var dbg = new DebugData( RoomMngr.className, this, "deleteListener", ListenMediaInstance ).dbgDo( true );

		if ( ListenMediaInstance instanceof ListenMedia ) {
			var throwVal = "RoomMngr: addListener: A listener has not been deleted.  You did not provide a valid ListenMedia object!";
			dbg.errorMessage( throwVal );
			throw( throwVal );
		} 

		delete this._listenMediaDb[ ListenMediaInstance.name ];
    }

    getListeners() {
    	return this._listenMediaDb;
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
		var dbg = new DebugData( RoomMngr.className, this, "createRoom" ).dbgEnter( true );

		var cmdData = {
			class: 'sfu',
			backend: NkMedia.mediaServerTypes.JANUS
		};

		if ( typeof this.confName === 'string' ) {
			cmdData.room_id = this.confName;
		}

		cmdData.bitrate = ( typeof this.roomBitrate === 'number' ) ? this.roomBitrate : RoomMngr.defaultValues.confBitrate;
		cmdData.audio_codec = ( typeof this.roomAudioCodec === 'number' ) ? this.roomAudioCodec : RoomMngr.defaultValues.confAudioCodec;
		cmdData.video_codec = ( typeof this.roomVideoCodec === 'number' ) ? this.roomVideoCodec : RoomMngr.defaultValues.confVideoCodec;

		dbg.infoMessage( 'Calling NkMedia._nkMediaRoomCreate', cmdData, false);

		var self = this;

		return NkMedia._nkMediaRoomCreate( cmdData, false )
			.then( 
	        	function( Data ) {
	        		self._roomId = Data.data.room_id;
	        		self._joinMethod = RoomMngr.joinMethods.create;

    		    	RoomMngr.dbUpdate( self );

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
		var dbg = new DebugData( RoomMngr.className, this, "joinRoom" ).dbgEnter( true );
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
	        		self._joinMethod = RoomMngr.joinMethods.join;
    		    	RoomMngr.dbUpdate( self );

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
		var dbg = new DebugData( RoomMngr.className, this, "destroyRoom" ).dbgEnter( true );
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
    		    	RoomMngr.dbDelete( self );
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
		var dbg = new DebugData( RoomMngr.className, this, "roomInfo" ).dbgEnter( true );
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
		var dbg = new DebugData( RoomMngr.className, this, "sendMessage" ).dbgEnter( true );
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
		return RoomMngr.listRooms();
	}

	static listRooms() {
		var dbg = new DebugData( RoomMngr.className, this, "listRooms" ).dbgEnter( true );

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
		if ( typeof RoomMngr._counter !== 'number') {
			RoomMngr._counter = 1;
		} else {
			RoomMngr._counter = RoomMngr._counter + 1;
		}
		return RoomMngr._counter;
	}


	static createNewName() { 
		var retVal = "SfuMngr_Instance_" + RoomMngr.counter;
		return retVal;
	}


	//--------------------------------------------------------
	//  Database 
	//--------------------------------------------------------

	static dbAdd( SfuMngrInstance ) {
		RoomMngr._dbCreate();

		if ( typeof SfuMngrInstance.name === 'string' ) {
			RoomMngr._db.name[ SfuMngrInstance.name ] = SfuMngrInstance;
		}

		if ( typeof SfuMngrInstance.confName === 'string' ) {
			RoomMngr._db.confName[ SfuMngrInstance.confName ] = SfuMngrInstance;
		}

		if ( typeof SfuMngrInstance.roomId === 'string' ) {
			RoomMngr._db.roomId[ SfuMngrInstance.roomId ] = SfuMngrInstance;
		}		
	}

	static dbUpdate( SfuMngrInstance ) {
		RoomMngr.dbAdd( SfuMngrInstance );
	}

	static dbDelete( SfuMngrInstance ) {
		RoomMngr._dbCreate();
		
		if ( typeof SfuMngrInstance.name === 'string' ) {
			delete RoomMngr._db.name[ SfuMngrInstance.name ];
		}

		if ( typeof SfuMngrInstance.confName === 'string' ) {
			delete RoomMngr._db.confName[ SfuMngrInstance.confName ];
		}

		if ( typeof SfuMngrInstance.roomId === 'string' ) {
			delete RoomMngr._db.roomId[ SfuMngrInstance.roomId ];
		}				
	}

	static _dbCreate() {
		if ( typeof RoomMngr._db !== 'object' ) {
			RoomMngr._db = {
				name: {},
				confName: {},
				roomId: {}
			};
		}
	}

	static dbList() {
		RoomMngr._dbCreate();
		return RoomMngr._db;
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

    	if ( typeof RoomMngr.roomId === 'string' ) {
    		data.room_id = RoomMngr.roomId;
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
	static handle_Media_Session_Room( WsEventObj ) {

		var roomBody = WsEventObj.data.body;

		console.log( "SFU", "RoomMngr: handle_Media_Session_Room:\n", JSON.stringify( WsEventObj, null, "\t" ));

		if ( roomBody.room !== this.room_id ) {
			return; 
		}



		WsMngr.respondAck( WsEventObj );

		WsMngr.respondOk( WsEventObj, { thanks: "for that roomBody!"} );

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
				EventMngr.dispatch( "onStartedPublisher", roomBody );
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
				EventMngr.dispatch( "onStoppedPublisher", roomBody );
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
				EventMngr.dispatch( "onStartedListener", roomBody );
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
				EventMngr.dispatch( "onStoppedListener", roomBody );
		        break;

		    default:
				console.error( "SFU","RoomMngr: handle_Media_Session_Room: Un-handled Event.  Need to implement functionality for this.\n", JSON.stringify( WsEventObj, null, "\t" ));
		}						

	}




	nkMediaSessionStart_Publisher() {
    	
       	var cmdData = {
       		type: "publish",
       		offer: {
       			sdp: this.sdpOffer
       		}
       	};

    	console.debug( "SFU", `RoomMngr: nkMediaSessionStart_Publisher -> NkMedia._chn_nk_MediaSessionStart( ${cmdData} ) -> Promise( NkMediaData ) ` );
       	return NkMedia._chn_nk_MediaSessionStart( cmdData );	// Returns NkMedia Data 
	}


    callSfuAsPublisher() {

    	console.debug( "SFU", `RoomMngr: START callSfuAsPublisher()`);

    	var self = this;

        this.peerConn_AddLocalStream_CreateOffer_SetLocalDescription_WaitForIce( this.localStream, 0, 1000 ).then(
			function() {
		    	console.debug( "SFU", `RoomMngr: callSfuAsPublisher: SDP = `, self.sdpOffer );

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
	        	console.log( "SFU", "RoomMngr: callSfuAsPublisher:  RESOLVE  2  *** ", Data.response.data.answer.sdp, Data.response.data.session_id );
	        	var sdp = Data.response.data.answer.sdp;
	        	var ncSessionId = Data.response.data.session_id;

	        	self.ncSessionId = ncSessionId;

        		return self.peerConn_setRemoteSdpAnswer( sdp );	// Sets self.remoteStream -- Returns () 
        	}
    	).then(
        	function( ) {
	        	console.log( "SFU", "RoomMngr: callSfuAsPublisher:   RESOLVE  3  *** " );
	        	if ( !! self.remoteVideoElement ) {
		        	self.remoteVideoElement.srcObject = self.remoteStream;
	        	}
        	}
    	).catch(
			function(error) {
	        	console.error( "SFU", "RoomMngr: callSfuAsPublisher: error: ", JSON.stringify( error, null, "\t"), error, error.stack);
			}
    	);

    	console.debug( "SFU", `RoomMngr: END callSfuAsPublisher()`);

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


