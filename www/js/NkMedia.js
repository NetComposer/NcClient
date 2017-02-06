'use strict';

const NkMedia_Version = "NkMedia 1.0.0";
// const NkMedia_EventPrefix = "NkMedia_";

/**
 * Constructs a new NkMedia
 * @class
 * @extends {RtcMedia}
 * 
 * @requires WsMngr This is information about it
 * 
 * @param  {object}		SettingsObject	Object with name/value pairs of parameters to be set.  You can use this to set an value (including those not in the class).
 * 			It is a convience method for setting multple things at once and/or passing them from other sub classes or parents.
 * @param  {boolean}	SettingsObject.confName	confName 	Name use for this instance
 *
 * @see RtcMedia
 *
 * @tutorial tut1
 * @return {NkMedia} 
 *
 */

class NkMedia extends RtcMedia {

    constructor( SettingsObject ) {
    	super( SettingsObject );

    	// this.init();    DO NOT DO INIT HERE .. it is actually called by super() 

    }





	init() {
		var dbg = new DebugData( NkMedia.className, this, "init" ).dbgEnter( );

    	delete this._nkSessionId;

    	this._mediaServerType = NkMedia.defaultValues.mediaServerType;

    	this._nkSdpOffer = '';
    	this._nkSdpAnswer = '';

    	this._nkUseAudio = NkMedia.defaultValues.useAudio;
    	this._nkUseVideo = NkMedia.defaultValues.useVideo;
    	this._nkBitrate = NkMedia.defaultValues.bitRate;
    	this._nkRecord = NkMedia.defaultValues.record; 
    	this._confCreateRejectOnAlreadyCreated = NkMedia.defaultValues.confCreateRejectOnAlreadyCreated; 

    	this._cmdData = {};
    	this._roomMngr = null;

    	this._wsResponseData = null;
    	this._wsSendData = null;

		// Do parent last because it refreshes args sent in at contruction. 
		super.init();

		dbg.dbgExit(); 
	}


	/**
	 * Default Values 
	 * @return {object} Of default values
	 */
	static get defaultValues() {
		return {
		mediaServerType: NkMedia.mediaServerTypes.JANUS,
		stopCode: 100,
		stopReason: "Unset Stop Reason",
		useAudio: true,
		useVideo: true,
		bitRate: 0,  	// Unlimited
		record: false,
		confCreateRejectOnAlreadyCreated: false,
		confAudioCodec: 'opus',
		confVideoCodec: 'vp8',
		};
	}


	/**
	 * This provides the JSON data when doing a JSON.stringify function.
	 * @return {object} Data for JSON.stringify to work on.
	 */
	toJSON() {
		var jsonData = {
			nkSessionId: ( !! this._nkSessionId ) ? this._nkSessionId : 'undefined',
			nkUseVideo: this._nkUseVideo,
			nkUseAudio: this._nkUseAudio,
			nkBitrate: this._nkBitrate,
			nkRecord: this._nkRecord,
			roomMngr: this._roomMngr,
			confCreateRejectOnAlreadyCreated: this._confCreateRejectOnAlreadyCreated,
			cmdData: this._cmdData,
			nkSdpOffer: this._nkSdpOffer,
			nkSdpAnswer: this._nkSdpAnswer,
			wsResponseData: this._wsResponseData,
			wsSendData: this._wsSendData,

		};

		return Object.assign( {}, jsonData, super.toJSON() );
	}




	//--------------------------------------------------------
	//  version(s), className, toString & Versions
	//--------------------------------------------------------
	get className() { return NkMedia.className; }
	toString() { return '[object NkMedia]'; }

    static get className() { return "NkMedia"; }
	static toString() { return '[object NkMedia]'; }

	get version() { return NkMedia.version; }
	get versions() { return NkMedia.versions; }

    static get version() { return NkMedia_Version; }
    static get versions() { return `${NkMedia_Version} --> ${super.versions}`; } 

	/**
	 * Types of Media Servers
	 *
	 * * FS: 'nkmedia_fs',
	 * * FREESWITCH: 'nkmedia_fs',
	 * * JANUS: 'nkmedia_janus',
	 * * KURENTO: 'nkmedia_kurento'
	 * 
	 * @readonly
	 * 
	 * @example <caption>Example usage of NkMedia.mediaServerTypes.</caption>
	 * NkMedia.mediaServerTypes.FREESWITCH;
	 * // returns 'nkmedia_fs'
	 * 
	 */
    static get mediaServerTypes() {
    	return {
			FS: 'nkmedia_fs',
			FREESWITCH: 'nkmedia_fs',
			JANUS: 'nkmedia_janus',
			KURENTO: 'nkmedia_kurento'
		};
    }





	//##########################################################################
	// I N S T A N C E   STUFF 
	//##########################################################################
	
	//==========================================================================
	// Instance Getters / Setters   
	//==========================================================================

	//--------------------------------------------------------
	//  nkSessionId
	//--------------------------------------------------------

	/**
	 * Get nkSessionId 
	 *
	 * @readOnly
	 */
    get nkSessionId() { return this._nkSessionId; }



	/**
	 * @readonly
	 * @enum {number}
	 * @example <caption>Example usage of RoomMngr.participantType.</caption>
	 * RoomMngr.participantType.admin;
	 * // returns 2
	 */
	static get participantType() {
		return {
			/** 'admin' - All priviledges */
			admin: 2,
			/** 'publisher' - Can publish and listen/view */
			publisher: 1,
			/** 'listener' - listen/view only */
			listener: 0
		};
	}



	//--------------------------------------------------------
	//  nkUseAudio
	//--------------------------------------------------------

	/**
	 * Set/get a flag used with muting and return values
	 * * true = Yes - Mute.
	 * * false = No - Unmute
	 * * Default Value: false
	 * 
	 * Commands that use update:
	 * * update - {@link NkMedia._chn_nk_MediaSessionUpdate}
	 */
    set nkUseAudio( TrueFalse ) {
		var dbg = new DebugData( RtcMedia.className, this, "set nkUseAudio", TrueFalse ).dbgDo( );
    	
    	if ( TrueFalse === this._nkUseAudio ) {
			dbg.dbgExit('NO changes made' );
    		// Do nothing here so we don't waste time and resources 
    	} else {		// They are different so check and process
    		
    		if ( typeof TrueFalse === 'boolean' ) {
    			this._nkUseAudio = TrueFalse;
    			dbg.infoMessage( `Set nkUseAudio = ${this._nkUseAudio}` );
    		} else {
				var myError = new Error('Set nkUseAudio: Value must be true or false.  You gave ' + TrueFalse );
	    		dbg.errorMessage( myError.stack );
	    		throw( myError );
    		}
			dbg.dbgExit('Changes made' );
    	}
    }

    get nkUseAudio() { return this._nkUseAudio; }


	//--------------------------------------------------------
	//  nkUseVideo
	//--------------------------------------------------------

	/**
	 * Set/get a flag used with muting and return values
	 * * true = Yes - Mute.
	 * * false = No - Unmute
	 * * Default Value: false
	 * 
	 * Commands that use update:
	 * * update - {@link NkMedia._chn_nk_MediaSessionUpdate}
	 */
    set nkUseVideo( TrueFalse ) {
		var dbg = new DebugData( RtcMedia.className, this, "set nkUseVideo", TrueFalse ).dbgDo( );
    	
    	if ( TrueFalse === this._nkUseVideo ) {
			dbg.dbgExit('NO changes made' );
    		// Do nothing here so we don't waste time and resources 
    	} else {		// They are different so check and process
    		
    		if ( typeof TrueFalse === 'boolean' ) {
    			this._nkUseVideo = TrueFalse;
    			dbg.infoMessage( `Set nkUseVideo = ${this._nkUseVideo}` );
    		} else {
				var myError = new Error('Set nkUseVideo: Value must be true or false.  You gave ' + TrueFalse );
	    		dbg.errorMessage( myError.stack );
	    		throw( myError );
    		}
			dbg.dbgExit('Changes made' );
    	}
    }

    get nkUseVideo() { return this._nkUseVideo; }


	//--------------------------------------------------------
	//  nkBitrate
	//--------------------------------------------------------

	/**
	 * Set the nkBitrate for use with NkMedia commands
	 * * 0 = Unlimited
	 * * 1000 = 1K
	 *
	 * Commands that use update:
	 * * update - {@link NkMedia._chn_nk_MediaSessionUpdate}
	 * 
	 */
	set nkBitrate( BitRateNumber ) {
		var dbg = new DebugData( NkMedia.className, this, "set nkBitrate", BitRateNumber ).dbgDo( );

		if ( typeof BitRateNumber === 'number' ) {
			this._nkBitrate = BitRateNumber;
			dbg.infoMessage( `Set nkUseVideo = ${this._nkBitrate}` );
		} else {
			this._nkBitrate = NkMedia.defaultValues.stopCode;
    		dbg.warnMessage( `BitRateNumber must be a number!  Setting to default value = ${this._nkBitrate}`);
		}

	}

	get nkBitrate() {
		return this._nkBitrate;
	}



	//--------------------------------------------------------
	//  nkRecord
	//--------------------------------------------------------

	/**
	 * Set the nkRecord for use with NkMedia commands
	 *
	 * Commands that use update:
	 * * update - {@link NkMedia._chn_nk_MediaSessionUpdate}
	 * 
	 */
	set nkRecord( BitRateNumber ) {
		var dbg = new DebugData( NkMedia.className, this, "set nkRecord", BitRateNumber ).dbgDo( );

		if ( typeof BitRateNumber === 'number' ) {
			this._nkRecord = BitRateNumber;
		} else {
			this._nkRecord = NkMedia.defaultValues.stopCode;
    		dbg.warnMessage( `BitRateNumber must be a number!  Setting to default value = ${this._nkRecord}`);
		}

	}

	get nkRecord() {
		return this._nkRecord;
	}





	set confCreateRejectOnAlreadyCreated( TrueFalse ) {
		var dbg = new DebugData( RtcMedia.className, this, "set confCreateRejectOnAlreadyCreated", TrueFalse ).dbgDo( );
    	
		if ( typeof TrueFalse === 'boolean' ) {
			this._confCreateRejectOnAlreadyCreated = TrueFalse;
			dbg.infoMessage( `Set nkUseVideo = ${this._confCreateRejectOnAlreadyCreated}` );
		} else {
			var myError = new Error('Set nkUseVideo: Value must be true or false.  You gave ' + TrueFalse );
    		dbg.errorMessage( myError.stack );
    		throw( myError );
		}
	}

	get confCreateRejectOnAlreadyCreated() {
		return this.this._confCreateRejectOnAlreadyCreated;
	}





	set roomMngr( RoomMngrObject ) {
		var dbg = new DebugData( RtcMedia.className, this, "set roomMngr", RoomMngrObject ).dbgDo( );
    	
		if ( RoomMngrObject instanceof RoomMngr === false ) {
			var myError = new Error( 'RoomMngrObject MUST be an instance of RoomMngr' );
    		dbg.errorMessage( myError.stack );
    		throw( myError );
		}

		this._roomMngr = RoomMngrObject;
	}

	get roomMngr() {
		return this._roomMngr;
	}



	//--------------------------------------------------------
	//  mediaServer
	//--------------------------------------------------------
	/**
	 * MediaServerType Must be one of {@link NkMedia.mediaServerTypes}
	 */
	set mediaServerType( MediaServerType ) {
		this._mediaServerType = MediaServerType;
	}

	get mediaServerType() {
		return this._mediaServerType;
	}


	/**
	 * Set / Get stop Code for stopping this Media Session
	 * * Value MUST be a Number
	 */
	set stopCode( StopCode ) {
		var dbg = new DebugData( NkMedia.className, this, "set stopCode", StopCode ).dbgDo( );

		if ( typeof StopCode === 'number' ) {
			this._stopCode = StopCode;
		} else {
			this._stopCode = NkMedia.defaultValues.stopCode;
    		dbg.warnMessage( `StopCode must be a number!  Setting to default value = ${this._stopCode}`);
		}

	}

	get stopCode() {
		return this._stopCode;
	}

	/**
	 * Set / Get stop Reason for stopping this Media Session
	 * * Value MUST be a String
	 */
	set stopReason( StopReason ){
		var dbg = new DebugData( NkMedia.className, this, "set stopReason", StopReason ).dbgDo( );

		if ( typeof StopCode === 'string' ) {
			this._stopReason = StopReason;
		} else {
			this._stopReason = NkMedia.defaultValues.stopReason;
    		dbg.warnMessage( `StopCode must be a number!  Setting to default value = ${this._stopReason}`);
		}
	}

	get stopReason() {
		return this._stopReason;
	}



	//--------------------------------------------------------
	//  muteAudioVideo - Both Local and Remote, Audio and Video
	//--------------------------------------------------------
    muteAudioVideo( AudioMutedTF, VideoMutedTF ) {
		var dbg = new DebugData( NkMedia.className, this, "muteAudioVideo", AudioMutedTF, VideoMutedTF ).dbgEnter( true );

    	if ( ( AudioMutedTF === this.audioMuted) && ( VideoMutedTF === this.videoMuted ) ) {
    		// There is no change here .. do nothing and return true

			dbg.dbgMessage( "NkMedia: END muteAudioVideo: No Changes " );
    		return true;
    	}


		//  FIX_THIS_SO_WE_UPDATE_MEDIA_SERVER

		// Send Mute details to NC

    	if ( false ) {		// This should test to see if you have an NkMedia Session

	    	var dataObject = {
	    		session_id: this._nkSessionId,
	    		update_type: "media",
	    		use_audio:  AudioMutedTF,
	    		use_video: VideoMutedTF
	    	};


	    	var oldLocalAudioMutedTF = this.localAudioMuted;
	    	var oldLocalVideoMutedTF = this.localVideoMuted;

	    	// Mute local things before muting Media Server
	    	this.localAudioMuted = AudioMutedTF;
	    	this.localVideoMuted = VideoMutedTF;


	    	NkMedia._chn_nk_MediaSessionUpdate( dataObject ).then(
		       	function( Data ) {
					dbg.infoMessage( "NkMedia: muteAudioVideo: Both Local and Server --> True ", Data );
			    	this.nkUseAudio = AudioMutedTF;
			    	this.nkUseVideo = VideoMutedTF;
					dbg.dbgExit( true );
		       		return true;
				}    		
			).catch(
		       	function( Data ) {
		       		// Change things back to the way they were on Error
			    	this.localAudioMuted = oldLocalAudioMutedTF;
			    	this.localVideoMuted = oldLocalVideoMutedTF;
					dbg.warnMessage( "NkMedia: muteAudioVideo: FALSE ", Data );
					dbg.dbgExit( false );
		       		return false;
				}    		
			);

    	} else {
	    	this.localAudioMuted = AudioMutedTF;
	    	this.nkUseAudio = AudioMutedTF;

	    	this.localVideoMuted = VideoMutedTF;
	    	this.nkUseVideo = VideoMutedTF;

			dbg.infoMessage( "NkMedia: muteAudioVideo: Local Only --> True " );
			dbg.dbgExit( true );
       		return true;
    	}

    }


	//--------------------------------------------------------
	//  audioMuted - Both Local and Remote 
	//--------------------------------------------------------
    set audioMuted( TrueFalse ) {
    	// muteAudioVideo works on BOTH RtcMedia (local) PLUS NkMedia (Server)
    	this.muteAudioVideo( TrueFalse, this.videoMuted );
    }

    get audioMuted() { return ( this.localAudioMuted && this.nkUseAudio ); }



	//--------------------------------------------------------
	//  videoMuted - Both Local and Remote 
	//--------------------------------------------------------
    set videoMuted( TrueFalse ) {
    	this.muteAudioVideo( this.audioMuted, TrueFalse );
    }

    get videoMuted() { return ( this.localVideoMuted && this.nkUseVideo ); }








	//==========================================================================
	// Instance  Functions   
	//==========================================================================


	closeAll() {
		var dbg = new DebugData( NkMedia.className, this, "closeAll" ).dbgEnter( );
		// Close everything on the local side ( RtcMedia )
		
		super.closeAll();

		// Close everthing on the remote side ( NkMedia )

		// 1) Session Stop

		// 2) Clean up Remote Stream 
		
		dbg.dbgExit(); 
	}


	closeSession() {
		var dbg = new DebugData( NkMedia.className, this, "closeSession" ).dbgEnter( );
		
		this.closeLocalStreams();
		this.closePeerConn();
		
		dbg.dbgExit(); 
	}









	//##########################################################################
	// C L A S S   STUFF 
	//##########################################################################
	
	//==========================================================================
	// Class Getters / Setters   
	//==========================================================================





	//==========================================================================
	// Class  Functions   
	//==========================================================================


	/**
	 * Types of Sessions NkMedia supports
	 *
	 * * p2p: 'p2p',
	 * * echo: 'echo',
	 * * proxy: 'proxy',
	 * * publish: 'publish',
	 * * listen: 'listen',
	 * * park: 'park',
	 * * mcu: 'mcu',
	 * * bridge: 'bridge'
	 * 
	 * @readonly
	 * 
	 * @example <caption>Example usage of NkMedia.nkMediaSessionType.</caption>
	 * NkMedia.nkMediaSessionType.p2p;
	 * // returns 'p2p'
	 * 
	 */
    static get nkMediaSessionType() {
    	return {
    		p2p: 'p2p',
    		echo: 'echo',
    		proxy: 'proxy',
    		publish: 'publish',
    		listen: 'listen',
    		park: 'park',
    		mcu: 'mcu',
    		bridge: 'bridge'
		};
    }


	//--------------------------------------------------------
	//  _isValidNkSessionId 
	//--------------------------------------------------------

	/**
	 * Test basic things about an NkSessionId and returns 'true' or 'false' 
	 * 
	 * @param  {NkSessionId}  NkSessionId The NkSessionId - usually from self.nkSessionId 
	 * 
	 * @return {Boolean}  False = No - not valid.  True = valid (or look like it may be)
	 */
    static _isValidNkSessionId( NkSessionId ) {
    	if ( ( typeof NkSessionId === 'undefined' ) || 
    		 ( typeof NkSessionId !== 'string' ) || 
    		 ( NkSessionId.length < 20 ) ||
    		 ( NkSessionId === 'closed')
    		) {
    		return false;
    	} else {
    		return true;
    	}
    }














    /**
     * Stop a Session.  All parameters should already be set before calling this function.  If there is an
     *    existing session, this should stop it.
     *    
	 * @return {Promise(PromiseData)} Promise.resolve( mySelfPromiseData ) so they can be chained together
     */
    registerForEvents() {
		new DebugData( NkMedia.className, this, "registerForEvents" ).dbgDo( );
    	return NkMedia._chn_nk_RegisterForEvents( this.mySelfPromiseData );
    }


	//--------------------------------------------------------
	//  _chn_nk_RegisterForEvents - "media", "session", "stop"
	//--------------------------------------------------------

	/**
	 * Stop a Media Session.
	 * 
	 * Parameters Used - Should be set before calling.
	 * * self.nkSessionId - MUST not be set via developer.  Only set by {@link NkMedia._chn_nk_MediaSessionStart}
	 * * self.stopCode
	 * * self.stopReason
	 *
	 * Parameters Set - Via function (or Promise)
	 * * self._nkSessionId === 'closed'
	 * 
	 * * self._wsSendData
	 * * self._wsResponseData
	 * 
	 * @param  {PromiseData} mySelfPromiseData Contains the instance to work on.  
	 * 
	 * @return {Promise(PromiseData)} Promise.resolve( mySelfPromiseData ) so they can be chained together
	 *
	 * @see  NkMedia.nkMediaSessionType
	 * @see  https://github.com/NetComposer/nkmedia/blob/master/doc/api_commands.md#stop-a-session
	 */
    static _chn_nk_RegisterForEvents( mySelfPromiseData ) {
    	var self = mySelfPromiseData.self;
    	var ncCmdStr = "media:session:stop";

    	var DataObject = {
    		session_id: self.nkSessionId,
    		code: self.stopCode,
    		reason: self.stopReason
    	}; 

		var dbg = new DebugData( NkMedia.className, self, "_chn_nk_MediaSessionStart", ncCmdStr, DataObject ).dbgEnter( true );

    	var myError;

    	if ( !NkMedia._isValidNkSessionId( self.nkSessionId ) ) {
			myError = new Error('Invalid nkSessionId of ${self.nkSessionId}');
    		dbg.errorMessage( myError.stack );
    		throw( myError );
    	}

		var promise = new Promise( function(resolve, reject) {

	    	WsMngr.sendDataViaPromise( "media", "session", "stop", DataObject ).then(
	        	function( Data ) {

	        		self._wsResponseData = Data.wsResponseData;
	        		self._wsSendData = Data.wsSendData;

		     		dbg.infoMessage( `Resolved`, Data );
		     		dbg.dbgResolve( 'mySelfPromiseData' );
		        	resolve( mySelfPromiseData );
	        	}    		
			).catch(
				function(Data) {
		     		dbg.infoMessage( `Rejected`, Data );
					dbg.dbgReject( );
					reject( NkMedia.createRejectObject( Data ) );
				}
			);
		});

		dbg.dbgExitPd( );
		return promise;
    }






















	//--------------------------------------------------------
	//  _chn_nk_MediaSessionStart - "media", "session", "start"
	//--------------------------------------------------------
	// @see https://github.com/NetComposer/nkmedia/blob/master/doc/api_commands.md#start-a-session
	//
	// @param DataObject {object}
	//		{
	//			type: (M) {string}  - 'p2p' | 'echo' | 'proxy' | 'publish' | 'listen' | 'park' | 'mcu' | 'bridge'
	//  		MANY_OTHERS_SEE_DOCS_AT https://github.com/NetComposer/nkmedia/blob/master/doc/api_commands.md#start-a-session
	//		}
	//
	// @return - promise
	// 		resolve
	//		reject
	//--------------------------------------------------------
	

	/**
	 * Start a session.  All parameters used to start the session should be set prior to
	 *    calling this function.  
	 *
	 * NOTE: Generally a developer would NOT use this method!
	 * 
	 * @return {Promise(PromiseData)} Promise.resolve( mySelfPromiseData ) so they can be chained together
	 */
    mediaSessionStart() {
		new DebugData( NkMedia.className, this, "mediaSessionStart" ).dbgDo( );
    	return NkMedia._chn_nk_MediaSessionStart( this.mySelfPromiseData );
    }




	/**
	 * Starts a Media Session.
	 *
	 * Session types are listed at {@link NkMedia.nkMediaSessionType} and include:
	 * * p2p
	 * * echo
	 * * proxy
	 * * publish
	 * * listen
	 * * park
	 * * mcu
	 * * bridge
	 * 
	 * Parameters Used - Should be set before calling.
	 * * self._cmdData
	 *
	 * Parameters Set - Via function (or Promise)
	 * * self._nkSessionId
	 * * self._jsepRtcDesc - with SDP from server
	 *   * Answer SDP or
	 *   * Offer SDP
	 * * self._wsSendData
	 * * self._wsResponseData
	 * 
	 * @param  {PromiseData} mySelfPromiseData Contains the instance to work on.  
	 * 
	 * @return {Promise(PromiseData)} Promise.resolve( mySelfPromiseData ) so they can be chained together
	 *
	 * @see  NkMedia.nkMediaSessionType
	 * @see https://github.com/NetComposer/nkmedia/blob/master/doc/api_commands.md#start-a-session
	 */

    static _chn_nk_MediaSessionStart( mySelfPromiseData ) {
    	var self = mySelfPromiseData.self;
    	var ncCmdStr = "media:session:start";
    	var DataObject = self._cmdData;
		var dbg = new DebugData( NkMedia.className, self, "_chn_nk_MediaSessionStart", ncCmdStr, DataObject ).dbgEnter( true );




    	NkMedia.init();		// Init the CLASS (not instance)


    	var errString;

    	if ( typeof( DataObject ) === 'undefined' ) {
    		errString = "NkMedia: _chn_nk_MediaSessionStart: No DataObject with options was provided.  Must provide DataObject! ";
    		dbg.dbgError( errString );
    		throw( errString );
    	}

    	// Check type 
    	if ( typeof NkMedia.nkMediaSessionType[ DataObject.type ] === 'undefined' ) {
    		errString = "NkMedia: _chn_nk_MediaSessionStart: Must specify DataObject.type as a {string} with valid value";
    		dbg.dbgError( errString );
    		throw( errString );
    	}

		var promise = new Promise( function(resolve ) {

	    	WsMngr.sendDataViaPromise( "media", "session", "create", DataObject ).then(
	        	function( Data ) {

	        		self._wsResponseData = Data.wsResponseData;
	        		self._wsSendData = Data.wsSendData;

	        		self._nkSessionId = self._wsResponseData.data.session_id;
	        		RtcMedia.dbUpdate( self );

    				if ( (typeof PublishMedia !== 'undefined') && (self instanceof PublishMedia) ) {
    					if ( self.roomMngr === null ) {
    						self.roomMngr = new RoomMngr();
    					}
    					self.roomMngr._roomId = self._wsResponseData.data.room_id;
    				} else if ( (typeof ListenMedia !== 'undefined') && (self instanceof ListenMedia) ) {
    					if ( self.roomMngr === null ) {
    						self.roomMngr = new RoomMngr();
    					}
    					self.roomMngr._roomId = self._wsResponseData.data.room_id;
    				}

        			dbg.dbgMessage( 'self._nkSessionId = ',  self._nkSessionId );

        			var rtcDescInit = {};

	        		if ( typeof self._wsResponseData.data.answer !== 'undefined' ) {
	        			self._nkSdpAnswer = self._wsResponseData.data.answer.sdp;
	        			dbg.logMessage( 'self._nkSdpAnswer = ',  self._nkSdpAnswer );

						rtcDescInit = {
					    	type: "answer", 			// "offer", "pranswer", "answer"
						    sdp: self._nkSdpAnswer
						};

						self._jsepRtcDesc = new RTCSessionDescription( rtcDescInit );
	        			dbg.logMessage( 'self._jsepRtcDesc = new RTCSessionDescription( rtcDescInit )',  self._jsepRtcDesc );

	        		} else if ( typeof self._wsResponseData.data.offer !== 'undefined' ) {
	        			dbg.logMessage( 'self._nkSdpOffer = ',  self._nkSdpOffer );
	        			self._nkSdpOffer = self._wsResponseData.data.offer.sdp;

						rtcDescInit = {
					    	type: "offer", 			// "offer", "pranswer", "answer"
						    sdp: self._nkSdpOffer
						};

						self._jsepRtcDesc = new RTCSessionDescription( rtcDescInit );
	        			dbg.logMessage( 'self._jsepRtcDesc = new RTCSessionDescription( rtcDescInit )',  self._jsepRtcDesc );

	        		} else {
	        			var errStr = `${ncCmdStr} Response from NetComposer does not contain an Offer or Answer.  Aborting`;
	            		dbg.errorMessage( errStr );
	        			throw( new Error( errStr ));
	        		}

		     		dbg.infoMessage( `Resolved`,  Data );
		     		dbg.dbgResolve( 'mySelfPromiseData' );
		        	resolve( mySelfPromiseData );
	        	}    		
			).catch(
				function(Data) {
		     		dbg.infoMessage( `Rejected` );
		     		dbg.dbgReject( Data );
					throw( new Error( 'Promise Rejected in NkMedia._chn_nk_MediaSessionStart') );
				}
			);
		});

		dbg.dbgExitPd( );
		return promise;
    }



    /**
     * Stop a Session.  All parameters should already be set before calling this function.  If there is an
     *    existing session, this should stop it.
     *    
	 * @return {Promise(PromiseData)} Promise.resolve( mySelfPromiseData ) so they can be chained together
     */
    mediaSessionStop() {
		new DebugData( NkMedia.className, this, "mediaSessionStop" ).dbgDo( );
    	return NkMedia._chn_nk_MediaSessionStop( this.mySelfPromiseData );
    }


	//--------------------------------------------------------
	//  _chn_nk_MediaSessionStop - "media", "session", "stop"
	//--------------------------------------------------------

	/**
	 * Stop a Media Session.
	 * 
	 * Parameters Used - Should be set before calling.
	 * * self.nkSessionId - MUST not be set via developer.  Only set by {@link NkMedia._chn_nk_MediaSessionStart}
	 * * self.stopCode
	 * * self.stopReason
	 *
	 * Parameters Set - Via function (or Promise)
	 * * self._nkSessionId === 'closed'
	 * 
	 * * self._wsSendData
	 * * self._wsResponseData
	 * 
	 * @param  {PromiseData} mySelfPromiseData Contains the instance to work on.  
	 * 
	 * @return {Promise(PromiseData)} Promise.resolve( mySelfPromiseData ) so they can be chained together
	 *
	 * @see  NkMedia.nkMediaSessionType
	 * @see  https://github.com/NetComposer/nkmedia/blob/master/doc/api_commands.md#stop-a-session
	 */
    static _chn_nk_MediaSessionStop( mySelfPromiseData ) {
    	var self = mySelfPromiseData.self;
    	var ncCmdStr = "media:session:stop";

    	var DataObject = {
    		session_id: self.nkSessionId,
    		code: self.stopCode,
    		reason: self.stopReason
    	}; 

		var dbg = new DebugData( NkMedia.className, self, "_chn_nk_MediaSessionStart", ncCmdStr, DataObject ).dbgEnter( true );

    	var myError;

    	if ( !NkMedia._isValidNkSessionId( self.nkSessionId ) ) {
			myError = new Error('Invalid nkSessionId of ${self.nkSessionId}');
    		dbg.errorMessage( myError.stack );
    		throw( myError );
    	}

		var promise = new Promise( function(resolve, reject) {

	    	WsMngr.sendDataViaPromise( "media", "session", "stop", DataObject ).then(
	        	function( Data ) {

	        		self._wsResponseData = Data.wsResponseData;
	        		self._wsSendData = Data.wsSendData;

		     		dbg.infoMessage( `Resolved`, Data );
		     		dbg.dbgResolve( 'mySelfPromiseData' );
		        	resolve( mySelfPromiseData );
	        	}    		
			).catch(
				function(Data) {
		     		dbg.infoMessage( `Rejected`, Data );
					dbg.dbgReject( );
					reject( NkMedia.createRejectObject( Data ) );
				}
			);
		});

		dbg.dbgExitPd( );
		return promise;
    }



	//--------------------------------------------------------
	//  _chn_nk_MediaSessionSetAnswer - "media", "session", "set_answer"
	//--------------------------------------------------------
    
	/**
	 * Set the SDP Answer for a Media Session.
	 * 
	 * Parameters Used - Should be set before calling.
	 * * self.nkSessionId - MUST not be set via developer.  Only set by {@link NkMedia._chn_nk_MediaSessionStart}
	 * * self.sdpAnswer
	 *
	 * Parameters Set - Via function (or Promise)
	 * * self._nkSessionId === 'closed'
	 * 
	 * * self._wsSendData
	 * * self._wsResponseData
	 * 
	 * @param  {PromiseData} mySelfPromiseData Contains the instance to work on.  
	 * 
	 * @return {Promise(PromiseData)} Promise.resolve( mySelfPromiseData ) so they can be chained together
	 *
	 * @see  https://github.com/NetComposer/nkmedia/blob/master/doc/api_commands.md#set-an-answer
	 * @see  https://github.com/NetComposer/nkmedia/blob/master/doc/janus.md#proxy
	 */

    static _chn_nk_MediaSessionSetAnswer( mySelfPromiseData ) {
    	var self = mySelfPromiseData.self;
    	var ncCmdStr = "media:session:set_answer";

    	var DataObject = {
    		session_id: self.nkSessionId,
    		answer: {
    			sdp: self.sdpAnswer 		// From RtcMedia (parent)
    		}
    	}; 

		var dbg = new DebugData( NkMedia.className, self, "_chn_nk_MediaSessionSetAnswer", ncCmdStr, DataObject ).dbgEnter( true );

    	var myError;

    	// session_id 
    	if ( !NkMedia._isValidNkSessionId( self.nkSessionId ) ) {
			myError = new Error('Invalid nkSessionId of ${self.nkSessionId}');
    		dbg.errorMessage( myError.stack );
    		throw( myError );
    	}

		var promise = new Promise( function(resolve, reject) {

	    	WsMngr.sendDataViaPromise( "media", "session", "set_answer", DataObject ).then(
	        	function( Data ) {
	        		self._wsResponseData = Data.wsResponseData;
	        		self._wsSendData = Data.wsSendData;

		     		dbg.infoMessage( `Resolved`, Data );
		     		dbg.dbgResolve( 'mySelfPromiseData' );
		        	resolve( mySelfPromiseData );
	        	}    		
			).catch(
				function(Data) {
		     		dbg.infoMessage( `Rejected`, Data );
					dbg.dbgReject( );
					reject( NkMedia.createRejectObject( Data ) );
				}
			);
		});

		dbg.dbgExitPd( );
		return promise;
    }



	//--------------------------------------------------------
	//  _chn_nk_MediaSessionUpdate - "media", "session", "update"
	//--------------------------------------------------------

	/**
	 * Update a Media Session.
	 *
	 * There are multiple items that can be updated, including (but not limited to) 
	 * * use_audio  Include or not the audio - Default = true
	 * * use_video  Include or not the video - Default = true
	 * * nkBitrate  Maximum nkBitrate (kbps, 0:unlimited)  - Default = 0
	 * * record  Perform recording of audio and video - Default = false

	 * 
	 * Parameters Used - Should be set before calling.
	 * * self.nkSessionId - MUST not be set via developer.  Only set by {@link NkMedia._chn_nk_MediaSessionStart}
	 * * self._cmdData
	 *   * NOTE: This function overrides DataObject.session_id: self.nkSessionId;
	 *   * NOTE: This function overrides DataObject.update_type: 'media';
	 *   * NOTE: This function overrides DataObject.use_audio: ! self.nkUseAudio;
	 *   * NOTE: This function overrides DataObject.use_video: ! self.nkUseVideo;
	 *   * NOTE: This function overrides DataObject.bitrate = self.nkBitrate;
	 *   * NOTE: This function overrides DataObject.record = self.nkRecord
	 *
	 * 
	 * Parameters Set - Via function (or Promise)
	 * * self._wsSendData
	 * * self._wsResponseData
	 * 
	 * @param  {PromiseData} mySelfPromiseData Contains the instance to work on.  
	 * 
	 * @return {Promise(PromiseData)} Promise.resolve( mySelfPromiseData ) so they can be chained together
	 *
	 * @see  https://github.com/NetComposer/nkmedia/blob/master/doc/api_commands.md#update-a-session
	 */

    static _chn_nk_MediaSessionUpdate( mySelfPromiseData ) {
    	var self = mySelfPromiseData.self;
    	var ncCmdStr = "media:session:update";
    	var DataObject = self._cmdData;

    	// Add and/or override somethings
    	DataObject.session_id = self.nkSessionId;
        DataObject.update_type = 'media';
        DataObject.use_audio = self.nkUseAudio;
        DataObject.use_video = self.nkUseVideo;
        DataObject.bitrate = self.nkBitrate;
        DataObject.record = self.nkRecord;

        // NOTE: The app can set other things in self._cmdData

		var dbg = new DebugData( NkMedia.className, self, "_chn_nk_MediaSessionStart", ncCmdStr, DataObject ).dbgEnter( true );

    	var myError;

    	// session_id 
    	if ( !NkMedia._isValidNkSessionId( self.nkSessionId ) ) {
			myError = new Error('Invalid nkSessionId of ${self.nkSessionId}');
    		dbg.errorMessage( myError.stack );
    		throw( myError );
    	}

		var promise = new Promise( function(resolve, reject) {

	    	WsMngr.sendDataViaPromise( "media", "session", "update", DataObject ).then(
	        	function( Data ) {
	        		self._wsResponseData = Data.wsResponseData;
	        		self._wsSendData = Data.wsSendData;

		     		dbg.infoMessage( `Resolved`, Data );
		     		dbg.dbgResolve( 'mySelfPromiseData' );
		        	resolve( mySelfPromiseData );
	        	}    		
			).catch(
				function(Data) {
		     		dbg.infoMessage( `Rejected`, Data );
					dbg.dbgReject( );
					reject( NkMedia.createRejectObject( Data ) );
				}
			);
		});

		dbg.dbgExitPd( );
		return promise;
    }


	//--------------------------------------------------------
	//  _chn_nk_MediaSessionInfo - "media", "session", "info"
	//--------------------------------------------------------

	/**
	 * Inforamation about a Media Session.
	 * 
	 * Parameters Used - Should be set before calling.
	 * * self.nkSessionId - MUST not be set via developer.  Only set by {@link NkMedia._chn_nk_MediaSessionStart}
	 *
	 * Parameters Set - Via function (or Promise)
	 * * self._wsSendData
	 * * self._wsResponseData
	 * 
	 * @param  {PromiseData} mySelfPromiseData Contains the instance to work on.  
	 * 
	 * @return {Promise(PromiseData)} Promise.resolve( mySelfPromiseData ) so they can be chained together
	 *
	 * @see  NkMedia.nkMediaSessionType
	 * @see  https://github.com/NetComposer/nkmedia/blob/master/doc/api_commands.md#get-info-about-a-session
	 */
    static _chn_nk_MediaSessionInfo( mySelfPromiseData ) {
    	var self = mySelfPromiseData.self;
    	var ncCmdStr = "media:session:info";

    	var DataObject = {
    		session_id: self.nkSessionId
    	}; 

		var dbg = new DebugData( NkMedia.className, self, "_chn_nk_MediaSessionInfo", ncCmdStr, DataObject ).dbgEnter( true );


    	var myError;

    	// session_id 
    	if ( !NkMedia._isValidNkSessionId( self.nkSessionId ) ) {
			myError = new Error('Invalid nkSessionId of ${self.nkSessionId}');
    		dbg.errorMessage( myError.stack );
    		throw( myError );
    	}

		var promise = new Promise( function(resolve, reject) {

	    	WsMngr.sendDataViaPromise( "media", "session", "info", DataObject ).then(
	        	function( Data ) {
	        		self._wsResponseData = Data.wsResponseData;
	        		self._wsSendData = Data.wsSendData;

		     		dbg.infoMessage( `Resolved`, Data );
		     		dbg.dbgResolve( 'mySelfPromiseData' );
		        	resolve( mySelfPromiseData );
	        	}    		
			).catch(
				function(Data) {
		     		dbg.infoMessage( `Rejected`, Data );
					dbg.dbgReject( );
					reject( NkMedia.createRejectObject( Data ) );
				}
			);
		});

		dbg.dbgExitPd( );
		return promise;
    }




	//====================================================================================
	// R O O M   Functionalities  
	//====================================================================================
	// _nkMediaRoomCreate
	// _nkMediaRoomDestroy
	// _nkMediaRoomInfo
	// _nkMediaRoomList
	// _nkMediaRoomMsgLogSend
	// _nkMediaRoomMsgLogGet
	//====================================================================================



	//--------------------------------------------------------
	//  _nkMediaRoomCreate - "media", "room", "create"
	//--------------------------------------------------------
	// @see https://github.com/NetComposer/nkmedia/blob/master/doc/api_commands.md#create-a-room 
	//
	// @param DataObject {object}
	//		{
	//			class: (M) {string}  - 'sfu' | 'mcu'
	//			backend: (O) {string} - 'nkmedia_janus' for sfu | 'nkmedia_fs' for mcu
	//			room_id: (O) {sring} - if you give the room_id it will be used.  If 
	//								not, one will be created for you - a UUID
	//						NOTE: It is best to use domains with room_id -- ie.  devstatus@sipstorm.com
	//			audio_codec:  (O) {string} - default 'opus' - opus, isac32, isac16, pcmu, pcma
	//			video_codec:  (O) {string} - default 'vp8' - vp8, vp9, h264
	//			nkBitrate:  (O) {number} - default '0' - nkBitrate to use
	//			record: (O) {boolean} - default 'false' 
	//			use_audio: (O) {boolean} - default 'true' 
	//			use_video: (O) {boolean} - default 'true' 
	//		}
	//
	// @return - promise
	// 		resolve
	//		reject
	//--------------------------------------------------------

	/**
	 * Create a Conference Room 
	 * 
	 * @param  {object} CmdData 
	 * @param {string} CmdData.room_id (Optional) Name of the room.  If not provided, one will be created.
	 * @param {string} CmdData.class Type of Conference.  Options include:
	 * * sfu
	 * * mcu
	 * @param {string} CmdData.backend Type of Media Server.  Options include:
	 * * nkmedia_janus
	 * * nkmedia_fs
	 * @param {boolean} RejectOnAlreadyCreated If the Room is already created, should we return Resolve or Reject
	 * * true = Reject
	 * * false = (Default/undefined) Resolve
	 * 
	 * @return {Object} Data
	 * * Data.room_id -- Room ID
	 * * Data.wsResponseData -- Response from NetComposer
	 * * Data.wsSendData -- Data Sent to NetComposer
	 *
	 * @see  NkMedia.mediaServerTypes
	 * @see  https://github.com/NetComposer/nkmedia/blob/master/doc/api_commands.md#create-a-room
	 */
    static _nkMediaRoomCreate( CmdData, RejectOnAlreadyCreated ) {

		var dbg = new DebugData( NkMedia.className, this, "_nkMediaRoomCreate", CmdData, RejectOnAlreadyCreated ).dbgEnter( true );

    	var myError;

    	if ( typeof( CmdData ) === 'undefined' ) {
			myError = new Error('No CmdData with options was provided.  Must provide CmdData!');
    		dbg.errorMessage( myError.stack );
    		throw( myError );
    	}

    	// class 
    	if ( ( typeof( CmdData.class ) === 'string' ) && 
    			( CmdData.class === 'sfu' || CmdData.class === 'mcu') ) {
			// Let it continue
    	} else {
			myError = new Error("Must specify CmdData.class as a {string} with values of 'sfu' or 'mcu'");
    		dbg.errorMessage( myError.stack );
    		throw( myError );
    	}

		var promise = new Promise( function(resolve, reject) {

	    	WsMngr.sendDataViaPromise( "media", "room", "create", CmdData ).then(

				// Response: {
				// 	"tid": 1001,
				// 	"result": "ok",
				// 	"data": {
				// 		"room_id": "jamesadsf"
				// 	}
				// } 

	        	function( Data ) {
		     		dbg.infoMessage( `Resolved`, Data.wsResponseData );
		     		dbg.dbgResolve( Data );
		        	resolve( Data.wsResponseData );

	        	}    		
			).catch(

				// Response: {
				// 	"tid": 1104,
				// 	"result": "error",
				// 	"data": {
				// 		"error": "Room already exists",
				// 		"code": 2031
				// 	}
				// } 

				function(Data) {

					switch( Data.wsResponseData.data.code ) {
					    case NkMedia.ncErrorCode.room_already_exists : 		// 2031

					    	if ( RejectOnAlreadyCreated === true ) {
					     		
					     		dbg.infoMessage( `Rejected`, Data.wsResponseData );
								dbg.dbgReject( Data );
								reject( NkMedia.createRejectObject( Data ) );

					    	} else {
					    		
				        		Data.wsResponseData.data.room_id = CmdData.room_id;
					     		dbg.infoMessage( `Resolved`, Data.wsResponseData );
					     		dbg.dbgResolve( Data );
					        	resolve( Data.wsResponseData );

					    	}
					        break;
					    default:
				     		dbg.infoMessage( `Rejected`, Data.wsResponseData );
							dbg.dbgReject( Data );
							reject( NkMedia.createRejectObject( Data ) );
					}						
				}
			);
		});

		dbg.dbgExit( );
		return promise;
    }


  //   static _chn_nk_MediaRoomCreate( mySelfPromiseData ) {
  //   	var self = mySelfPromiseData.self;
  //   	var ncCmdStr = "media:room:create";
  //   	var DataObject = self._cmdData;

	 //    DataObject.audio_codec = ( typeof DataObject.audio_codec === 'string' ) ? DataObject.audio_codec : NkMedia.defaultValues.confAudioCodec;
	 //    DataObject.video_codec = ( typeof DataObject.video_codec === 'string' ) ? DataObject.video_codec : NkMedia.defaultValues.confVideoCodec;

	 //    DataObject.record = ( typeof DataObject.record === 'boolean'  ) ? DataObject.record : self.nkRecord ;
	 //    DataObject.use_audio = ( typeof DataObject.use_audio === 'boolean' ) ? DataObject.use_audio : self.nkUseAudio ;
	 //    DataObject.use_video = ( typeof DataObject.use_video === 'boolean' ) ? DataObject.use_video : self.nkUseVideo ;
	 //    DataObject.bitrate = ( typeof DataObject.bitrate === 'string' ) ? DataObject.bitrate : self.nkBitrate ;

		// var dbg = new DebugData( NkMedia.className, self, "_chn_nk_MediaRoomCreate", ncCmdStr, DataObject ).dbgEnter( true );

  //   	var myError;

  //   	if ( typeof( DataObject ) === 'undefined' ) {
		// 	myError = new Error('No DataObject with options was provided.  Must provide DataObject!');
  //   		dbg.errorMessage( myError.stack );
  //   		throw( myError );
  //   	}

  //   	// class 
  //   	if ( ( typeof( DataObject.class ) === 'string' ) && 
  //   			( DataObject.class === 'sfu' || DataObject.class === 'mcu') ) {
		// 	// Let it continue
  //   	} else {
		// 	myError = new Error("Must specify DataObject.class as a {string} with values of 'sfu' or 'mcu'");
  //   		dbg.errorMessage( myError.stack );
  //   		throw( myError );
  //   	}

		// var promise = new Promise( function(resolve, reject) {

	 //    	WsMngr.sendDataViaPromise( "media", "room", "create", DataObject ).then(

		// 		// Response: {
		// 		// 	"tid": 1001,
		// 		// 	"result": "ok",
		// 		// 	"data": {
		// 		// 		"room_id": "jamesadsf"
		// 		// 	}
		// 		// } 

	 //        	function( Data ) {
	 //        		self._wsResponseData = Data.wsResponseData;
	 //        		self._wsSendData = Data.wsSendData;

	 //        		self.roomMngr.room_id = Data.wsResponseData.data.room_id;

		//      		dbg.infoMessage( `Resolved`, Data );
		//      		dbg.dbgResolve( 'mySelfPromiseData' );
		//         	resolve( mySelfPromiseData );

	 //        	}    		
		// 	).catch(

		// 		// Response: {
		// 		// 	"tid": 1104,
		// 		// 	"result": "error",
		// 		// 	"data": {
		// 		// 		"error": "Room already exists",
		// 		// 		"code": 2031
		// 		// 	}
		// 		// } 

		// 		function(Data) {

		// 			switch( Data.wsResponseData.data.code ) {
		// 			    case NkMedia.ncErrorCode.room_already_exists : 		// 2031

		// 			    	if ( self.confCreateRejectOnAlreadyCreated === true ) {
					     		
		// 			     		dbg.infoMessage( `Rejected`, Data );
		// 						dbg.dbgReject( );
		// 						reject( NkMedia.createRejectObject( Data ) );

		// 			    	} else {

		// 		        		self._wsResponseData = Data.wsResponseData;
		// 		        		self._wsSendData = Data.wsSendData;

		// 		        		self.roomMngr.room_id = Data.wsSendData.data.room_id;

		// 			     		dbg.infoMessage( `Resolved`, Data );
		// 			     		dbg.dbgResolve( 'mySelfPromiseData' );
		// 			        	resolve( mySelfPromiseData );
				    		
		// 			    	}
		// 			        break;
		// 			    default:
		// 		     		dbg.infoMessage( `Rejected`, Data );
		// 					dbg.dbgReject( );
		// 					reject( NkMedia.createRejectObject( Data ) );
		// 			}						
		// 		}
		// 	);
		// });

		// dbg.dbgExitPd( );
		// return promise;
  //   }










	//--------------------------------------------------------
	//  _nkMediaRoomDestroy - "media", "room", "destroy"
	//--------------------------------------------------------

	/**
	 * Destroy a Conference Room 
	 * 
	 * @param  {object} CmdData 
	 * @param {string} CmdData.room_id (Manditory) Name of the room.  If not provided, one will be created.
	 * 
	 * @return {Object} Data
	 * * Data.wsResponseData -- Response from NetComposer
	 * * Data.wsSendData -- Data Sent to NetComposer
	 *
	 * @see  https://github.com/NetComposer/nkmedia/blob/master/doc/api_commands.md#destroy-a-room
	 */
    static _nkMediaRoomDestroy( CmdData ) {

		var dbg = new DebugData( NkMedia.className, this, "_nkMediaRoomDestroy", CmdData ).dbgEnter( true );

    	var myError;

    	// room_id 
    	if ( ( typeof( CmdData.room_id ) !== 'string' ) ) {
			myError = new Error('self.roomMngr.room_id was not set.  Must set self.roomMngr.room_id before calling this!');
    		dbg.errorMessage( myError.stack );
    		throw( myError );
    	}

		var promise = new Promise( function( resolve, reject) {

	    	WsMngr.sendDataViaPromise( "media", "room", "destroy", CmdData ).then(
	        	function( Data ) {
		     		dbg.infoMessage( `Resolved`, Data.wsResponseData );
		     		dbg.dbgResolve( Data );
		        	resolve( Data.wsResponseData );
	        	}    		
			).catch(
				function(Data) {

					switch( Data.wsResponseData.data.code ) {
					    case NkMedia.ncErrorCode.room_not_found : 		// 2030
					     		dbg.infoMessage( `Resolved`, Data.wsResponseData );
					     		dbg.dbgResolve( Data );
					        	resolve( Data.wsResponseData );
					        break;
					    default:
				     		dbg.infoMessage( `Rejected`, Data.wsResponseData );
							dbg.dbgReject( Data );
							reject( NkMedia.createRejectObject( Data ) );
					}						
				}
			);
		});

		dbg.dbgExit( );
		return promise;
    }







	//--------------------------------------------------------
	//  _nkMediaRoomInfo - "media", "room", "info"
	//--------------------------------------------------------

	/**
	 * Get information about a Conference Room 
	 * 
	 * @param  {object} CmdData 
	 * @param {string} CmdData.room_id (Manditory) Name of the room.  If not provided, one will be created.
	 * 
	 * @return {Object} Data
	 * * Data.wsResponseData -- Response from NetComposer
	 * * Data.wsSendData -- Data Sent to NetComposer
	 *
	 * @see  https://github.com/NetComposer/nkmedia/blob/master/doc/api_commands.md#get-info-about-a-room
	 */
    static _nkMediaRoomInfo( CmdData ) {

		var dbg = new DebugData( NkMedia.className, this, "_nkMediaRoomInfo", CmdData ).dbgEnter( true );

    	var myError;

    	// room_id 
    	if ( ( typeof CmdData.room_id !== 'string' ) ) {
			myError = new Error('self.roomMngr.room_id was not set.  Must set self.roomMngr.room_id before calling this!');
    		dbg.errorMessage( myError.stack );
    		throw( myError );
    	}

		var promise = new Promise( function( resolve, reject) {

	    	WsMngr.sendDataViaPromise( "media", "room", "info", CmdData ).then(
	        	function( Data ) {
		     		dbg.infoMessage( `Resolved`, Data.wsResponseData );
		     		dbg.dbgResolve( Data );
		        	resolve( Data.wsResponseData );
	        	}    		
			).catch(
				function(Data) {
		     		dbg.infoMessage( `Rejected`, Data );
					dbg.dbgReject( Data );
					reject( NkMedia.createRejectObject( Data ) );
				}
			);
		});

		dbg.dbgExit( );
		return promise;
    }



	//--------------------------------------------------------
	//  _nkMediaRoomList - "media", "room", "list"
	//--------------------------------------------------------

	/**
	 * List Conference Rooms
	 * 
	 * @return {Object} Data
	 * * Data.wsResponseData -- Response from NetComposer
	 * * Data.wsSendData -- Data Sent to NetComposer
	 *
	 * @see  https://github.com/NetComposer/nkmedia/blob/master/doc/api_commands.md#list-rooms
	 */

    static _nkMediaRoomList( ) {
    	var CmdData = {};

		var dbg = new DebugData( NkMedia.className, this, "_nkMediaRoomList", CmdData ).dbgEnter( true );

		var promise = new Promise( function( resolve, reject) {

	    	WsMngr.sendDataViaPromise( "media", "room", "list", CmdData ).then(
	        	function( Data ) {
		     		dbg.infoMessage( `Resolved`, Data.wsResponseData );
		     		dbg.dbgResolve( Data );
		        	resolve( Data.wsResponseData );
	        	}    		
			).catch(
				function(Data) {
		     		dbg.infoMessage( `Rejected`, Data );
					dbg.dbgReject( Data );
					reject( NkMedia.createRejectObject( Data ) );
				}
			);
		});

		dbg.dbgExit( );
		return promise;
    }


	//--------------------------------------------------------
	//  _nkMediaRoomMsgLogSend - "media", "room", "msglog_send"
	//--------------------------------------------------------

	/**
	 * Send a message to all parties in a conference
	 *
	 * NOTE: NC adds the following fields to the msg object:
	 * * msg_id
	 * * user
	 * * session_id
	 * * timestamp
	 * 
	 * @param  {object} CmdData 
	 * @param {string} CmdData.room_id (Manditory) Name of the room.  If not provided, one will be created.
	 * @param {object} CmdData.msg 
	 * @param {object} CmdData.msg.type 	Type of data.  Some options are:
	 * * text
	 * * notice
	 * * action - This is a way to pass action data to all participants if needed.
	 * * json - The text of the message is in JSON format that may include multi-media
	 * @param {object} CmdData.msg.text 	The text of the message
	 * 
	 * @return {Object} Data
	 * * Data.wsResponseData -- Response from NetComposer
	 * * Data.wsSendData -- Data Sent to NetComposer
	 *
	 * @see  https://github.com/NetComposer/nkmedia/blob/master/doc/api_commands.md
	 */    
    static _nkMediaRoomMsgLogSend( CmdData ) {

		var dbg = new DebugData( NkMedia.className, this, "_nkMediaRoomMsgLogSend", CmdData ).dbgEnter( true );

    	var myError;

    	if ( ( typeof CmdData === 'undefined' ) || ( CmdData === {} ) ) {
			myError = new Error('No CmdData with options was provided.  Must provide CmdData!');
    		dbg.errorMessage( myError.stack );
    		throw( myError );
    	}

    	// room_id 
    	if ( ( typeof CmdData.room_id !== 'string' ) ) {
			myError = new Error('self.roomMngr.room_id was not set.  Must set self.roomMngr.room_id before calling this!');
    		dbg.errorMessage( myError.stack );
    		throw( myError );
    	}

    	// msg 
    	if ( ( typeof( CmdData.msg ) !== 'object' ) ) {
			myError = new Error('Must specify CmdData.msg as a {object} with valid data!');
    		dbg.errorMessage( myError.stack );
    		throw( myError );
    	}

    	// Can not use these names in msg object 
    	if ( !! CmdData.msg.msg_id ||  !!CmdData.msg.user ||  !!CmdData.msg.session_id  ||  !!CmdData.msg.timestamp ) {
    		var errString = "NkMedia: _nkMediaRoomMsgLogSend: You provided a msg.key name that is restricted.  Your value will be overwriten." +
    			" Restricted Keys are: msg_id, user, session_id and timestamp.  You provided " + DebugData.JsonTab( CmdData.msg );
    		dbg.warnMessage( errString );
    	}

		var promise = new Promise( function( resolve, reject) {

	    	WsMngr.sendDataViaPromise( "media", "room", "msglog_send", CmdData ).then(
	        	function( Data ) {
		     		dbg.infoMessage( `Resolved`, Data.wsResponseData );
		     		dbg.dbgResolve( Data );
		        	resolve( Data.wsResponseData );
	        	}    		
			).catch(
				function(Data) {
		     		dbg.infoMessage( `Rejected`, Data );
					dbg.dbgReject( Data );
					reject( NkMedia.createRejectObject( Data ) );
				}
			);
		});

		dbg.dbgExit( );
		return promise;
    }


	//--------------------------------------------------------
	//  _nkMediaRoomMsgLogGet - "media", "room", "msglog_get"
	//--------------------------------------------------------

	/**
	 * Get all messages for this conference - this should be used for an update when coming into the conference.
	 *
	 * 
	 * @param  {object} CmdData 
	 * @param {string} CmdData.room_id (Manditory) Name of the room.  If not provided, one will be created.
	 * @param {object} CmdData.msg 
	 * @param {object} CmdData.msg.type 	Type of data.  Some options are:
	 * * text
	 * * notice
	 * * action - This is a way to pass action data to all participants if needed.
	 * * json - The text of the message is in JSON format that may include multi-media
	 * @param {object} CmdData.msg.text 	The text of the message
	 * 
	 * @return {Object} Data
	 * * Data.wsResponseData -- Response from NetComposer
	 * * Data.wsSendData -- Data Sent to NetComposer
	 *
	 * @see  https://github.com/NetComposer/nkmedia/blob/master/doc/api_commands.md
	 */    
    static _nkMediaRoomMsgLogGet( CmdData ) {

		var dbg = new DebugData( NkMedia.className, this, "_nkMediaRoomMsgLogGet", CmdData ).dbgEnter( true );

    	var myError;

    	if ( ( typeof CmdData === 'undefined' ) || ( CmdData === {} ) ) {
			myError = new Error('No CmdData with options was provided.  Must provide CmdData!');
    		dbg.errorMessage( myError.stack );
    		throw( myError );
    	}

    	// room_id 
    	if ( ( typeof CmdData.room_id !== 'string' ) ) {
			myError = new Error('self.roomMngr.room_id was not set.  Must set self.roomMngr.room_id before calling this!');
    		dbg.errorMessage( myError.stack );
    		throw( myError );
    	}

		var promise = new Promise( function( resolve, reject) {

	    	WsMngr.sendDataViaPromise( "media", "room", "msglog_get", CmdData ).then(
	        	function( Data ) {
		     		dbg.infoMessage( `Resolved`, Data.wsResponseData );
		     		dbg.dbgResolve( Data );
		        	resolve( Data.wsResponseData );
	        	}    		
			).catch(
				function(Data) {
		     		dbg.infoMessage( `Rejected`, Data );
					dbg.dbgReject( Data );
					reject( NkMedia.createRejectObject( Data ) );
				}
			);
		});

		dbg.dbgExit( );
		return promise;
    }



	//====================================================================================
	// C A L L   Functionalities  
	//====================================================================================
	// mediaCallStart
	// mediaCallRinging
	// mediaCallAnswered
	// mediaCallRejected
	// mediaCallHangup
	//====================================================================================





	//====================================================================================
	// Response Helpers
	//====================================================================================
	// createResolveObject
	// createRejectObject
	//====================================================================================


    static createResolveObject( Data, OptionalResponse ) {
    	var respData = {
			successCode: "ok",
			successText: 200,
			response: Data.wsResponseData,
			sendData: Data.wsSendData,
    		fullResponse: Data
    	};

    	if ( typeof( OptionalResponse) === 'object' ) {
			respData.successCode = Data.wsResponseData.data.code;
			respData.successText = Data.wsResponseData.data.error;
    		respData.response = OptionalResponse;
    	}

    	return respData;
    }




    static createRejectObject( Data ) {
    	return {
	        		errCode: Data.wsResponseData.data.code,
	        		errText: Data.wsResponseData.data.error,
	        		errResponse: Data.wsResponseData,
	        		fullResponse: Data
	        	};
    }


	/**
	 * Returns a list of Event Names for this class and parents.
	 * 
	 * @return {object} Returns a list of Event Names for this class and parents
	 */
	get eventNames() {
		return NkMedia.eventNames;
	}


	/**
	 * Returns events for this class PLUS events for parent classes if available.
	 *
	 * Events for this class are:
	 * * nkEvent1
	 * * nkEvent2
	 *
     * @see  RtcMedia.eventNames
	 * 
	 */
	static get eventNames() {
		// allEvent
		var allEvents = {};
		var superEvents = super.eventNames;

		var myEvents = {
			NkMedia_EventNames_Start_Here: "NkMedia_EventNames_Start_Here",

			//--------------------------------------------------------
			//  See RtcMedia eventNames for documentaiton examples. 
			//--------------------------------------------------------

			/**
		     * When calling {@link RtcMedia#getLocalFaceStream} and it gets a stream, this fires and returns the stream.
		     * 		From here, the developer would attach it to an HTML Video Element.
		     *
		     * @event nkEvent1
		     * @type {Event}
		     * @see  NkMedia.eventNames
		     */
			nkEvent1: "nkEvent1",

			/**
		     * When calling {@link RtcMedia#getLocalScreenCaptureStream} and it gets a stream, this fires and returns the stream.
		     * 		From here, the developer would attach it to an HTML Video Element.
		     *
		     * @event nkEvent2
		     * @type {Event}
		     *
		     * @see  NkMedia.eventNames
		     */
			nkEvent2: "nkEvent2",


		};

		allEvents = Object.assign( {}, myEvents, superEvents );

		return allEvents;
	}



    /**
     * Error Codes from NetComposer
     * 
	 * * internal_error:               1001
	 * * normal:                       1002
	 * * anormal_termination:          1003
	 * * invalid_state:                     1004
	 * * timeout:                      1005
	 * * not_implemented:              1006
	 * * process_not_found:            1010
	 * * process_down:                 1011
	 * * registered_down:              1012
	 * * user_stop:                         101
	 * * service_not_found:            1020
	 * * unauthorized:                 1030
	 * * not_authenticated:            1031
	 * * already_authenticated:        1032
	 * * user_not_found:               1033
	 * * duplicated_session_id:        1034
	 * * invalid_session_id:           1035
	 * * operation_error:              1040
	 * * unknown_command:              1041
	 * * unknown_class:                     1042
	 * * incompatible_operation:  1043
	 * * unknown_operation:            1044
	 * * invalid_operation:            1045
	 * * syntax_error:                 1046
	 * * missing_field:                     1047
	 * * invalid_parameters:           1048
	 * * missing_parameters:           1049
	 * * session_timeout:              1060
	 * * session_stop:                 1061
	 * * session_not_found:            1062
	 * * no_mediaserver:               2001
	 * * unknown_session_type:         2002
	 * * missing_offer:                     2010
	 * * duplicated_offer:             2011
	 * * offer_not_set:                     2012
	 * * offer_already_set:            2013
	 * * duplicated_answer:            2014
	 * * answer_not_set:               2015
	 * * answer_already_set:           2016
	 * * call_not_found:               2020
	 * * call_rejected:                     2021
	 * * no_destination:               2022
	 * * no_answer:                         2023
	 * * already_answered:             2024
	 * * originator_cancel:            2025
	 * * peer_hangup:                  2026
	 * * room_not_found:               2030
	 * * room_already_exists:          2031
	 * * room_destroyed:               2032
	 * * no_participants:              2033
	 * * unknown_publisher:            2034
	 * * invalid_publisher:            2035
	 * * publisher_stopped:            2036
     */

	static get ncErrorCode() {
		return {

          internal_error:               1001,
          normal:                       1002,
          anormal_termination:          1003,
          invalid_state:                     1004,
          timeout:                      1005,
          not_implemented:              1006,

          process_not_found:            1010,
          process_down:                 1011,
          registered_down:              1012,
          user_stop:                         101,

          service_not_found:            1020,

          unauthorized:                 1030,
          not_authenticated:            1031,
          already_authenticated:        1032,
          user_not_found:               1033,
          duplicated_session_id:        1034,
          invalid_session_id:           1035,

          operation_error:              1040,
          unknown_command:              1041,
          unknown_class:                     1042,
          incompatible_operation:  1043,
          unknown_operation:            1044,
          invalid_operation:            1045,
          syntax_error:                 1046,
          missing_field:                     1047,
          invalid_parameters:           1048,
          missing_parameters:           1049,

          session_timeout:              1060,
          session_stop:                 1061,
          session_not_found:            1062,

          no_mediaserver:               2001,
          unknown_session_type:         2002,

          missing_offer:                     2010,
          duplicated_offer:             2011,
          offer_not_set:                     2012,
          offer_already_set:            2013,
          duplicated_answer:            2014,
          answer_not_set:               2015,
          answer_already_set:           2016,

          call_not_found:               2020,
          call_rejected:                     2021,
          no_destination:               2022,
          no_answer:                         2023,
          already_answered:             2024,
          originator_cancel:            2025,
          peer_hangup:                  2026,

          room_not_found:               2030,
          room_already_exists:          2031,
          room_destroyed:               2032,
          no_participants:              2033,
          unknown_publisher:            2034,
          invalid_publisher:            2035,
          publisher_stopped:            2036
      };
	}















	/**
	 * Inits the CLASS (not an instance) and registers handlers for some NC Events 
	 * @return {void} 
	 */
	static init() {
		if ( NkMedia._inited === true ) {
			return;
		}

		NkMedia._inited = true;

		// WsMngr.addClassSubclassManager( "media", "session", NkMedia.handleAllSessionEvents );
		
		WsMngr.addClassSubclassTypeManager( "media", "session", "stop", NkMedia.handle_MediaSession_Stop );

	}

	/**
	 * Handles Session:Media:Stop Events from NC
	 * @param  {object} WsEventObj Data from NetComposer Event
	 * @return {void}
	 */
	static handle_MediaSession_Stop( WsEventObj ) {

		var dbg = new DebugData( NkMedia.className, 'Static', "handle_MediaSession_Stop", WsEventObj ).dbgEnter( true );

		var sessionId = WsEventObj.data.obj_id;
		var mediaInstance = RtcMedia.dbList.byNcSessionId[ sessionId ];

		// console.error( `WsEventObj: Media-Session-${WsEventObj.data.type} = `, DebugData.JsonTab( WsEventObj )  );
		// console.error( `Name from dbList = ${RtcMedia.dbList.byNcSessionId[ sessionId ].name} WsMngr._webSocket.readyState = ${WsMngr._webSocket.readyState}` );

		if ( typeof mediaInstance === 'undefined' ) {
			dbg.warnMessage( `No current session with SessionId = ${sessionId}`, WsEventObj );
			WsMngr.respondError( WsEventObj, 400, 'NkMedia: handle_MediaSession_Stop: No current session with that Id.' );
			return;
		}

		mediaInstance.closeAll();

		RtcMedia.dbDelete( mediaInstance );

    	delete mediaInstance._nkSessionId;

		// WsMngr.respondAck( WsEventObj );

		WsMngr.respondOk( WsEventObj, { closed: true } );

		dbg.infoMessage( `Closing and responding to Nc Event for sessionId = ${sessionId}`, WsEventObj );

		// "tid": 2,
		// "data": {
		// 	"type": "stop",
		// 	"subclass": "session",
		// 	"obj_id": "a7ef9191-3ca4-9c3b-33a7-0007cb0396bd",
		// 	"class": "media",
		// 	"body": {
		// 		"reason": "Janus op process down",
		// 		"code": 2202
		// 	}
		// },
		// "cmd": "event",
		// "class": "core"

		dbg.dbgExit( );
	}

}













