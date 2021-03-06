'use strict';

const RtcMedia_Version = "RtcMedia 1.0.0";


//=========================================================================
// RTC Media - Class  
//=========================================================================


/**
 * Constructs a new RtcMedia instance
 * 
 * Create an Offer
 * * Get Stream from getUserMedia
 * * Set Stream
 * * pc.onnegotiationneeded
 * * pc.createOffer
 * * pc.setLocalDescription(offer)
 * * Send SDP --> signalingChannel.send(JSON.stringify({ "sdp": pc.localDescription }));
 *
 * Create an Answer 
 * * Get SDP from remote site 
 * * Creat (desc)
 * * pc.setRemoteDescription(desc)
 * * pc.createAnswer()
 * * pc.setLocalDescription(answer)
 * * Send SDP --> signalingChannel.send(JSON.stringify({ "sdp": pc.localDescription }))
 * 	
 * @example
 * B = new RtcMedia();
 * or
 * B = new RtcMedia( {name: "myName", sendAudio: true, sendVideo: true } );
 * 
 * @class
 * @requires {@link WsMngr}
 * @requires {@link DebugData}
 * @requires {@link PromiseData}
 * @requires {@link RemoteLogMngr}
 * @requires {@link EventLoggerDb}
 * @requires {@link adapter}
 * @requires {@link getScreenId}
 *
 */
class RtcMedia extends EventMngr {

	/**
	 * Constructor 
	 *
	 * 
	 * @param  {object}		SettingsObject	Object with name/value pairs of parameters to be set.  You can use this to set an value (including those not in the class).
	 * 			It is a convience method for setting multple things at once and/or passing them from other sub classes.
	 * 			
	 * @param  {boolean}	SettingsObject.name					name - {@link RtcMedia#name} use for this instance
	 * * Default Value: Will be created if none provided
	 * 
	 * @param  {boolean}	SettingsObject.sendAudio			sendAudio - {@link RtcMedia#sendAudio}
	 * * true = yes
	 * * false = no
	 * * Default Value: true
	 * 
	 * @param  {boolean}	SettingsObject.sendVideo			sendVideo - {@link RtcMedia#sendVideo}
	 * * true = yes
	 * * false = no
	 * * Default Value: true
	 *
	 * @param  {boolean}	SettingsObject.offerToReceiveAudio			offerToReceiveAudio - {@link RtcMedia#offerToReceiveAudio}
	 * * true = yes
	 * * false = no
	 * * Default Value: true
	 * 
	 * @param  {boolean}	SettingsObject.offerToReceiveVideo			offerToReceiveVideo - {@link RtcMedia#offerToReceiveVideo}
	 * * true = yes
	 * * false = no
	 * * Default Value: true
	 *
	 * @param  {boolean}	SettingsObject.voiceActivityDetection			voiceActivityDetection - {@link RtcMedia#voiceActivityDetection}
	 * * true = yes
	 * * false = no
	 * * Default Value: true
	 * 
	 * @param  {boolean}	SettingsObject.iceRestart			iceRestart - {@link RtcMedia#iceRestart}
	 * * true = yes
	 * * false = no
	 * * Default Value: false
	 *
	 * @param {boolean} 	SettingsObject.singleStreamOnly 	singleStreamOnly - {@link RtcMedia#singleStreamOnly}
	 * * true = Make sure there is only 1 MediaStream in the PeerConn.  Unless you really know what you are doing and the media server allows for multiple streams, this should always be set true!
	 * * false = Allows multiple streams to be added to the PeerConn.
	 * * Default Value: true
	 * 
	 * @param  {number}	SettingsObject.mediaDirection		mediaDirection - {@link RtcMedia#mediaDirection}.  
	 *   NOTE: Usually other classes set this.
	 * * BOTH: 2 - see {@link RtcMedia.mediaDirectionOptions}
	 * * PUBLISH_ONLY: 1 - see {@link RtcMedia.mediaDirectionOptions}
	 * * LISTEN_ONLY: 0 - see {@link RtcMedia.mediaDirectionOptions}
	 * * Default Value: BOTH - {@link RtcMedia.mediaDirectionOptions}
	 * 
	 * @param  {boolean}	SettingsObject.localAudioMuted 		localAudioMuted - {@link RtcMedia#localAudioMuted}
	 * * true = Mute local audio
	 * * false = Unmute local audio - let it be heard
	 * * Default Value: false
	 * 
	 * @param  {boolean}	SettingsObject.localVideoMuted 		localVideoMuted - {@link RtcMedia#localVideoMuted}
	 * * true = Mute local video
	 * * false = Unmute local audio - let it be seen
	 * * Default Value: false
	 * 
	 * @param  {boolean}	SettingsObject.trickleIce	 		trickleIce - {@link RtcMedia#trickleIce}
	 * * true = Get initial SDP, then send Ice Candidates in trickle fashon.
	 * * false = Only send Sdp once all candidate are gathered OR timeout happens
	 * * Default Value: false
	 * 
	 * @param  {number}	SettingsObject.iceCandidatesTimeOutMs		iceCandidatesTimeOutMs - {@link RtcMedia#iceCandidatesTimeOutMs} 
	 *   Time in MS to wait for Ice Candidates. 
	 * * Min value = 500
	 * * Max value = 20000
	 * * Default Value: 1000
	 * 
	 * @param  {number}	SettingsObject.negotiationNeededTimeOutMs	negotiationNeededTimeOutMs - {@link RtcMedia#negotiationNeededTimeOutMs}
	 *   Time in MS to wait for Negotiation timeout.
	 * * Min value = 100
	 * * Max value = 1000
	 * * Default Value: false
	 *
	 * @param {boolean} SettingsObject.negotiationNeededTimeOutReject 	negotiationNeededTimeOutReject - {@link RtcMedia#negotiationNeededTimeOutReject}
	 * * true = If negotiationNeededTimeOutMs triggers, then do a Promise.Reject(), which SHOULD cause other things to be rejected after it.
	 * * false = If negotiationNeededTimeOutMs triggers, then do a Promise.Resolve() and carry on normal
	 * * Default Value: false
	 * 
	 * @param  {object}	SettingsObject.localVideoElement			localVideoElement - {@link RtcMedia#localVideoElement}
	 *   An HTML Video Element.  If provided, then the video element will be populated when local video is available.
	 * * Default Value: none - this must be set but the developer if it is to be used.
	 * 
	 * @param  {object}	SettingsObject.remoteVideoElement			remoteVideoElement - {@link RtcMedia#remoteVideoElement}
	 *   An HTML Video Element.  If provided, then the video element will be populated when remote video is available.
	 * * Default Value: none - this must be set but the developer if it is to be used.
	 * 
	 * @return {RtcMedia}	RtcMedia Instance 
	 * 
	 */

    constructor( SettingsObject ) {

    	super();
    	this._settingObject = SettingsObject;
		this._mySelfPromiseData = new PromiseData( this );
		this._localVideoElement = null;		// localVideoElement
		this._remoteVideoElement = null;	// remoteVideoElement

		this._closed = true;

    	this.init();


		// this._sendAudio = RtcMedia.defaultValues.sendAudio; 		
		// this._sendVideo = RtcMedia.defaultValues.sendVideo; 
		// this._offerToReceiveAudio = RtcMedia.defaultValues.offerToReceiveAudio; 
		// this._offerToReceiveVideo = RtcMedia.defaultValues.offerToReceiveVideo; 
		// this._voiceActivityDetection = RtcMedia.defaultValues.voiceActivityDetection; 
		// this._iceRestart = RtcMedia.defaultValues.iceRestart; 
		// this._singleStreamOnly = RtcMedia.defaultValues.singleStreamOnly;
		// this._mediaDirection = RtcMedia.defaultValues.mediaDirection;
		// this._localAudioMuted = RtcMedia.defaultValues.localAudioMuted;
		// this._localVideoMuted = RtcMedia.defaultValues.localVideoMuted;
		// this._trickleIce	= RtcMedia.defaultValues.trickleIce; 		// Default false -- Trickle Ice defaults to false
		// this._iceCandidatesTimeOutMs = RtcMedia.defaultValues.iceCandidatesTimeOutMs;

		// this._negotiationNeededTimeOutMs = 200; 	// negotiationNeededTimeOutMs - This has min/max defaults, but set actual, here.

		// this._negotiationNeededTimeOutReject = RtcMedia.defaultValues.negotiationNeededTimeOutReject; 		// Default false;

		// this._localVideoElement = null;		// localVideoElement
		// this._remoteVideoElement = null;	// remoteVideoElement

		// this._localCurrentStream = null;
		// this._localPreviousStream = null;


		// this._mySelfPromiseData = new PromiseData( this );

		// // Reset some things based on values in SettingsObject 
  //   	if ( typeof SettingsObject === 'object' ) {
  //   		this.initArgs( SettingsObject );
  //   	}

		// this.tmpCB = {
		// 	// onicecandidate_completed: function() {},		// Used for good complete and onicecandidateerror
		// 	onicecandidate_resolve: null,		// This gets set to a Promise.resolve in a function, then called from an outside function/event
		// 	onicecandidate_reject: null,		// This gets set to a Promise.reject in a function, then called from an outside function/event

		// 	onnegotiationneeded: function() {},
		// 	onnegotiationneeded_resolve: null,		// This gets set to a Promise.resolve in a function, then called from an outside function/event
		// 	onnegotiationneeded_reject: null,		// This gets set to a Promise.reject in a function, then called from an outside function/event

		// 	onicecandidate_gathered: function() {},
		// 	// onicecandidateerror: function() {},   // onicecandidateerror is used with onicecandidate_completed

		// 	onaddstream: function() {},
		// 	onremovestream: function() {},

		// 	oniceconnectionstatechange: function() {},
		// 	onicegatheringstatechange: function() {},
		// 	onisolationchange: function() {},
		// 	onsignalingstatechange: function() {},

		// };

		// this.initArgs( this._settingObject );

    }

    init() {
		var dbg = new DebugData( RtcMedia.className, this, "init" ).dbgDo();

    	if ( this._closed === false ) {
			var myError = new Error('This instance is being used.  You MUST do a closeAll() before doing another init()!');
    		dbg.errorMessage( myError.stack );
    		throw( myError );
    	}

		this._closed = false;

		this._rtcId = RtcMedia.createUuid();

		this._sendAudio = RtcMedia.defaultValues.sendAudio; 		
		this._sendVideo = RtcMedia.defaultValues.sendVideo; 
		this._offerToReceiveAudio = RtcMedia.defaultValues.offerToReceiveAudio; 
		this._offerToReceiveVideo = RtcMedia.defaultValues.offerToReceiveVideo; 
		this._voiceActivityDetection = RtcMedia.defaultValues.voiceActivityDetection; 
		this._iceRestart = RtcMedia.defaultValues.iceRestart; 
		this._singleStreamOnly = RtcMedia.defaultValues.singleStreamOnly;
		this._mediaDirection = RtcMedia.defaultValues.mediaDirection;
		this._localAudioMuted = RtcMedia.defaultValues.localAudioMuted;
		this._localVideoMuted = RtcMedia.defaultValues.localVideoMuted;
		this._trickleIce	= RtcMedia.defaultValues.trickleIce; 		// Default false -- Trickle Ice defaults to false
		this._iceCandidatesTimeOutMs = RtcMedia.defaultValues.iceCandidatesTimeOutMs;

		this._negotiationNeededTimeOutMs = 200; 	// negotiationNeededTimeOutMs - This has min/max defaults, but set actual, here.

		this._negotiationNeededTimeOutReject = RtcMedia.defaultValues.negotiationNeededTimeOutReject; 		// Default false;

		this._localCurrentStream = null;
		this._localPreviousStream = null;

		this.tmpCB = {
			// onicecandidate_completed: function() {},		// Used for good complete and onicecandidateerror
			onicecandidate_resolve: null,		// This gets set to a Promise.resolve in a function, then called from an outside function/event
			onicecandidate_reject: null,		// This gets set to a Promise.reject in a function, then called from an outside function/event

			onnegotiationneeded: function() {},
			onnegotiationneeded_resolve: null,		// This gets set to a Promise.resolve in a function, then called from an outside function/event
			onnegotiationneeded_reject: null,		// This gets set to a Promise.reject in a function, then called from an outside function/event

			onicecandidate_gathered: function() {},
			// onicecandidateerror: function() {},   // onicecandidateerror is used with onicecandidate_completed

			onaddstream: function() {},
			onremovestream: function() {},

			oniceconnectionstatechange: function() {},
			onicegatheringstatechange: function() {},
			onisolationchange: function() {},
			onsignalingstatechange: function() {},

		};

		// Only do initArgs at this level (parent)
		this.initArgs( this._settingObject );

    }

	static get defaultValues() {
		return {
		sendAudio: true,
		sendVideo: true,
		offerToReceiveAudio: true,
		offerToReceiveVideo: true,
		voiceActivityDetection: true,		// Spec Default = true
		iceRestart: false,					// Spec Default = false
		singleStreamOnly: true,
		mediaDirection: RtcMedia.mediaDirectionOptions.BOTH,
		localAudioMuted: false,
		localVideoMuted: false,
		trickleIce: false,
		iceCandidatesTimeOutMs: 1000,

		minIceGatherTimeOut: 500,
		maxIceGatherTimeOut: 20000,

		minNegotiationNeededTimeOutMs: 100,
		maxNegotiationNeededTimeOutMs: 1000,
		negotiationNeededTimeOutReject: false,

		rtcConfiguration: {
			iceServers: [{"url": "stun:stun.l.google.com:19302"}],
			iceTransportPolicy: "all",
			bundlePolicy: "balanced",
			rtcpMuxPolicy: "require",
			iceCandidatePoolSize: 9
			},

		};
	}


	toJSON() {
		var jsonData = {
			name: this._name,
			rtcId: this._rtcId,
			sendAudio: this.sendAudio,
			sendVideo: this.sendVideo,
			localAudioMuted: this.localAudioMuted,
			localVideoMuted: this.localVideoMuted,

			localDescription: this.localDescription,
			localStream: DebugData.objectCopy_MediaStream( this.localStream ),

			remoteDescription: this.remoteDescription,
			remoteStream: DebugData.objectCopy_MediaStream( this.remoteStream ),

			localVideoElement: this.localVideoElement,
			remoteVideoElement: this.remoteVideoElement,
			publishStream: DebugData.objectCopy_MediaStream( this.publishStream ),
			_localCurrentStream: DebugData.objectCopy_MediaStream( this._localCurrentStream ),
			_localPreviousStream: DebugData.objectCopy_MediaStream( this._localPreviousStream ),
			singleStreamOnly: this._singleStreamOnly,

			mediaDirection: this.mediaDirection,
			trickleIce: this.trickleIce,
			offerToReceiveAudio: this.offerToReceiveAudio,
			offerToReceiveVideo: this.offerToReceiveVideo,
			voiceActivityDetection: this.voiceActivityDetection,
			iceRestart: this.iceRestart,
			_rtcOfferOptions: this._rtcOfferOptions,

			negotiationNeededTimeOutMs: this.negotiationNeededTimeOutMs,
			negotiationNeededTimeOutReject: this.negotiationNeededTimeOutReject,

			iceCandidatesTimeOutMs: this.iceCandidatesTimeOutMs,
			
			peerConn: DebugData.objectCopy_RTCPeerConnection( this.peerConn ),
			
			_jsepRtcDesc: this._jsepRtcDesc,

		};

		return Object.assign( {}, jsonData, super.toJSON() );
	}

	/**
	 * Initialize (or Reset) instance variables in bulk.
	 * @param  {object}		SettingsObject	Object with name/value pairs of parameters to be set.  You can use this to set an value (including those not in the class).
	 * 			It is a convience method for setting multple things at once and/or passing them from other sub classes.
	 * 			
	 * @return {void}
	 * @see  RtcMedia.constructor
	 */
	initArgs( SettingsObject ) {
		if ( typeof SettingsObject === 'undefined' ) { return; }

		var dbg = new DebugData( RtcMedia.className, this, "initArgs", SettingsObject ).dbgEnter( true );

		var self = this;

		if ( typeof SettingsObject === 'object' ) {
			Object.keys( SettingsObject ).forEach( function( key ) {
				if ( typeof self[ key ] !== 'undefined' ) {
					dbg.logMessage( `${self.className} -> RtcMedia: initArgs: Setting -> this.${key} = ${SettingsObject[ key ]}` );
					self[ key ] = SettingsObject[ key ];
				} else {
					dbg.warnMessage( `${self.className} -> RtcMedia: initArgs: Warning -> this.${key} is not a standard instance variable.  However we are still setting it to ${SettingsObject[ key ]}` );
				}
			});
		}

	}


	//--------------------------------------------------------
	//  version(s), className, toString & Versions
	//--------------------------------------------------------
	get className() { return RtcMedia.className; }
	toString() { return `[object ${this.className}]`; }
    static get className() { return "RtcMedia"; }
	static toString() { return `[object RtcMedia]`; }

	get version() { return RtcMedia.version; }
	get versions() { return RtcMedia.versions; }
    static get version() { return RtcMedia_Version; }
    static get versions() { return `${RtcMedia_Version} --> ${super.versions}`; }  

    get mySelfPromiseData() { return this._mySelfPromiseData; }


	//##########################################################################
	// I N S T A N C E    VARIABLES
	//##########################################################################
	
	//--------------------------------------------------------
	//  name
	//--------------------------------------------------------

	/** 
	 * The name for this instance.  Stored in internal DB 
	 */
    set name( Name ) {
    	// Do NOT allow changing the name after first set
		new DebugData( RtcMedia.className, this, "set name", Name ).dbgDo();

    	if ( typeof this._name === 'undefined' ) {
    		if ( typeof Name === 'string' ) {
    			this._name = Name;
    		} else {
    			this._name = RtcMedia.createNewName();
    		}
    	} // ELSE do not set it -- keep it as original 
    }

    get name() { 
    	if ( typeof this._name !== 'string' ) {
    		this._name = RtcMedia.createNewName();
    	}

    	return this._name; 
    }

    /**
     * RTC UUID created at init time.  Can not change it!
     *
     * @readOnly
     */
    get rtcId() { 
    	return this._rtcId; 
    }

	//--------------------------------------------------------
	//  sendAudio
	//--------------------------------------------------------


 	/**
	 * Values used with getUserMedia functions.
	 * When creating a MediaStream via getUserMedia methods, should audio be used?  This works to set audio contrainst used in getUserMedia.
	 * * true = yes - Ask getUserMedia to use audio.
	 * * false = no - Do not get audio via getUserMedia
	 * * Default Value: true
	 * 
	 * @see  RtcMedia#gumSetAudioVideoOptions
	 * @see  RtcMedia#getLocalFaceStream
	 * @see  RtcMedia#getLocalScreenCaptureStream 
	 */
    set sendAudio( TrueFalse ) {
    	// Don't allow to send 'undefined' because of additional processing.
		var dbg = new DebugData( RtcMedia.className, this, "set sendAudio", TrueFalse ).dbgDo();

    	if ( TrueFalse === this._sendAudio ) {
    		// Do nothing here so we don't waste time and resources 
    	} else {		// They are different so check and process

    		if ( typeof TrueFalse === 'boolean' ) {
    			this._sendAudio = TrueFalse;
				dbg.logMessage( "Set to ", TrueFalse );

		    	// TODO:
		    	//
		    	// Check for things we need to do if audio is turned off / on in the middle of things.
		    	//   Things like renegotiating SDP, getting new _getUserMedia stream, etc.

    		} else {
				dbg.warnMessage( "Value must be true or false. " +
					`You gave ${TrueFalse}.  Setting to default value of '${RtcMedia.defaultValues.sendAudio}'` );
				this._sendAudio = RtcMedia.defaultValues.sendAudio;
    		}
    	}
    }

    get sendAudio() { return this._sendAudio; }


	//--------------------------------------------------------
	//  sendVideo
	//--------------------------------------------------------

 	/**
	 * Values used with getUserMedia functions.
	 * When creating a MediaStream via getUserMedia methods, should video be used?  This works to set video contrainst used in getUserMedia.
	 *
	 * Value Types:
	 * * Boolean
	 * * String
	 * * Object 
	 *  		
	 * Boolean Values:		
	 * * true = yes - Ask getUserMedia to use video.
	 * * false = no - Do not get video via getUserMedia.
	 *
	 * String Values:
	 * * String values should be the name of one of the types returned by {@link RtcMedia.videoSizeOptions}
	 *
	 * Object Value:
	 * * MUST be valid for video contrainst used in getUserMedia.  See WebRTC Spec for more details.
	 *
	 * Default Value:
	 * * Default Value: true
	 *
	 * @see  RtcMedia#gumSetAudioVideoOptions
	 * @see  RtcMedia#getLocalFaceStream
	 * @see  RtcMedia#getLocalScreenCaptureStream 
	 */
    set sendVideo( BooleanStringOrObject ) {
    	// Don't allow to send 'undefined' because of additional processing.
		var dbg = new DebugData( RtcMedia.className, this, "set sendVideo", BooleanStringOrObject ).dbgDo( true );

    	if ( BooleanStringOrObject === this._sendVideo ) {
    		// Do nothing here so we don't waste time and resources 
    		return;
	    } 

		switch( typeof BooleanStringOrObject ) {
		    case 'boolean' :
    			this._sendVideo = BooleanStringOrObject;
				dbg.logMessage( "Set to ", BooleanStringOrObject );
		        break;
		    case 'object' :
    			this._sendVideo = BooleanStringOrObject;
				dbg.logMessage( "Set to ", DebugData.JsonTab( BooleanStringOrObject ) );
		        break;
		    case 'string' :

    			if ( !! RtcMedia.videoSizeOptions[BooleanStringOrObject] ) {
    				this._sendVideo = RtcMedia.videoSizeOptions[BooleanStringOrObject];
					dbg.logMessage( "Set to ", BooleanStringOrObject );
    			} else {
    				dbg.warnMessage( "String values must be one of RtcMedia.videoSizeOptions. " +
    					`You gave ${BooleanStringOrObject}.  Setting to default value of '${RtcMedia.defaultValues.sendVideo}'` );
    				this._sendVideo = RtcMedia.defaultValues.sendVideo;
    			}
		        break;
		    default:
				dbg.warnMessage( "Un-handled type. " +
					`You gave ${BooleanStringOrObject}.  Setting to default value of '${RtcMedia.defaultValues.sendVideo}'` );
				this._sendVideo = RtcMedia.defaultValues.sendVideo;
		}				

    	// TODO:
    	//
    	// Check for things we need to do if audio is turned off / on in the middle of things.
    	//   Things like renegotiating SDP, getting new _getUserMedia stream, etc.

    }

    get sendVideo() { return this._sendVideo; }


	//--------------------------------------------------------
	//  offerToReceiveAudio
	//--------------------------------------------------------

	/**
	 * Should peerConn SDP Offer to recieve audio.
	 * * true = yes - Request to recieve audio from remote side.
	 * * false = no - Request to NOT recieve audio from remote side.
	 * * Default Value: true
	 */
    set offerToReceiveAudio( TrueFalse ) {		
		var dbg = new DebugData( RtcMedia.className, this, "set offerToReceiveAudio", TrueFalse ).dbgDo( );
		if ( typeof TrueFalse === 'boolean' ) {
			this._offerToReceiveAudio = TrueFalse;
		} else {
			var throwVal = "RtcMedia: set offerToReceiveAudio: value must be true or false.  You gave " + TrueFalse ;
			dbg.errorMessage( throwVal );
			throw( throwVal );
		}
    }

    get offerToReceiveAudio() { return this._offerToReceiveAudio; }

	//--------------------------------------------------------
	//  offerToReceiveVideo
	//--------------------------------------------------------

	/**
	 * Should peerConn SDP Offer to recieve video. 
	 * * true = yes - Request to recieve video from remote side.
	 * * false = no - Request to NOT recieve video from remote side.
	 * * Default Value: true
	 */
    set offerToReceiveVideo( TrueFalse ) {		
		var dbg = new DebugData( RtcMedia.className, this, "set offerToReceiveVideo", TrueFalse ).dbgDo( );
		if ( typeof TrueFalse === 'boolean' ) {
			this._offerToReceiveVideo = TrueFalse;
		} else {
			var throwVal = "RtcMedia: set offerToReceiveVideo: value must be true or false.  You gave " + TrueFalse ;
			dbg.errorMessage( throwVal );
			throw( throwVal );
		}
    }

    get offerToReceiveVideo() { return this._offerToReceiveVideo; }



	//--------------------------------------------------------
	//  voiceActivityDetection
	//--------------------------------------------------------

	/**
	 * Should peerConn use Voice Activity Detection. Set true if you want to use VAD to save bandwidth. 
	 * * true = Use Voice Activity Detection.
	 * * false = Turn off Voice Activity Detection.
	 * * Default Value: true
	 */
    set voiceActivityDetection( TrueFalse ) {		
		var dbg = new DebugData( RtcMedia.className, this, "set voiceActivityDetection", TrueFalse ).dbgDo( );
		if ( typeof TrueFalse === 'boolean' ) {
			this._voiceActivityDetection = TrueFalse;
		} else {
			var throwVal = "RtcMedia: set voiceActivityDetection: value must be true or false.  You gave " + TrueFalse ;
			dbg.errorMessage( throwVal );
			throw( throwVal );
		}
    }

    get voiceActivityDetection() { return this._voiceActivityDetection; }

	//--------------------------------------------------------
	//  iceRestart
	//--------------------------------------------------------

	/**
	 * Set true if you want restart Ice candidates each time you get user media.  Default = false.
	 * * true = Reset and get Ice Candidates every time an offer or answer is processed.
	 * * false = Only do Ice Candidates the first time.
	 * * Default Value: false
	 */
    set iceRestart( TrueFalse ) {		
		var dbg = new DebugData( RtcMedia.className, this, "set iceRestart", TrueFalse ).dbgDo( );
		if ( typeof TrueFalse === 'boolean' ) {
			this._iceRestart = TrueFalse;
		} else {
			var throwVal = "RtcMedia: set iceRestart: value must be true or false.  You gave " + TrueFalse ;
			dbg.errorMessage( throwVal );
			throw( throwVal );
		}
    }

    get iceRestart() { return this._iceRestart; }



	//--------------------------------------------------------
	//  gumSetAudioVideoOptions 
	//--------------------------------------------------------

	/**
 	 * Convience function to set values.
 	 * 
	 * @param {boolean} SendAudio [Optional] Should getUserMedia use audio.
	 * * If not provided, the default (or preiously set) value will be used.  
	 * * See {@link RtcMedia#sendAudio}
	 * 
	 * @param {boolean} SendVideo [Optional] Should getUserMedia use video.  
	 * * If not provided, the default (or preiously set) value will be used.  
	 * * See {@link RtcMedia#sendVideo}
	 * 
	 * @param {boolean} OfferToRecieveAudio [Optional] Should peerConn SDP Offer to recieve audio  
	 * * If not provided, the default (or preiously set) value will be used.  
	 * * See {@link RtcMedia#offerToRecieveAudio}
	 * 
	 * @param {boolean} OfferToRecieveVideo [Optional] Should peerConn SDP Offer to recieve video.  
	 * * If not provided, the default (or preiously set) value will be used.  
	 * * See {@link RtcMedia#offerToRecieveVideo}
	 * 
 	 * @param {boolean} VAD [Optional] Should peerConn use Voice Activity Detection.  
	 * * If not provided, the default (or preiously set) value will be used.  
	 * * See {@link RtcMedia#voiceActivityDetection}
	 * 
	 * @param {boolean} IceRestart [Optional] Should peerConn reset Ice Negotiation each time it creates an offer or answer.  
	 * * If not provided, the default (or preiously set) value will be used.  
	 * * See {@link RtcMedia#iceRestart}
	 * 
	 * See {@link RtcMedia#getLocalFaceStream } for parameter details and examples!
 	 * @return {Promise}	
	 * @see  RtcMedia#getLocalFaceStream
 	 */
	gumSetAudioVideoOptions( SendAudio, SendVideo, OfferToRecieveAudio, OfferToRecieveVideo, VAD, IceRestart ) {
		new DebugData( RtcMedia.className, this, "gumSetAudioVideoOptions", SendAudio, SendVideo, OfferToRecieveAudio, OfferToRecieveVideo, VAD, IceRestart ).dbgDo( );

		// For _constraints
		this.sendAudio = SendAudio;
		this.sendVideo = SendVideo;

		// For _rtcOfferOptions
		this.offerToReceiveAudio = OfferToRecieveAudio;
		this.offerToReceiveVideo = OfferToRecieveVideo;
		this.voiceActivityDetection = VAD;
		this.iceRestart = IceRestart;

	}



	//--------------------------------------------------------
	//  _constraints 
	//--------------------------------------------------------

	/**
	 * Returns contstraints used for getUserMedia.  These are set elsewher.
	 *
	 * The two values used in constraints are
	 * * this.sendAudio - {@link RtcMedia#sendAudio}
     * * this.sendVideo - {@link RtcMedia#sendVideo}
	 *
	 * @readOnly
	 * @private
	 *
	 * @see  RtcMedia#_getUserMedia
	 * @see  RtcMedia#gumSetAudioVideoOptions
	 */
    get _constraints() {
    	var theConstraints = {
    		audio: this.sendAudio,
    		video: this.sendVideo
    	};

    	return theConstraints;
    }



	//--------------------------------------------------------
	//  setRtcOfferOptions
	//--------------------------------------------------------

	/**
	 * Convienance function to set options uses with peerConn.createOffer(optional RTCOfferOptions options).
	 * 
	 * @param {boolean} OfferToRecieveAudio [Optional] Should peerConn SDP Offer to recieve audio  
	 * * If not provided, the default (or preiously set) value will be used.  
	 * * See {@link RtcMedia#offerToRecieveAudio}
	 * 
	 * @param {boolean} OfferToRecieveVideo [Optional] Should peerConn SDP Offer to recieve video.  
	 * * If not provided, the default (or preiously set) value will be used.  
	 * * See {@link RtcMedia#offerToRecieveVideo}
	 * 
 	 * @param {boolean} VAD [Optional] Should peerConn use Voice Activity Detection.  
	 * * If not provided, the default (or preiously set) value will be used.  
	 * * See {@link RtcMedia#voiceActivityDetection}
	 * 
	 * @param {boolean} IceRestart [Optional] Should peerConn reset Ice Negotiation each time it creates an offer or answer.  
	 * * If not provided, the default (or preiously set) value will be used.  
	 * * See {@link RtcMedia#iceRestart}
	 * 
	 * @return {void}
	 *
	 * @see  {@link https://www.w3.org/TR/webrtc/#idl-def-rtcofferoptions|RTCOfferOptions from RFC}
	 */

	setRtcOfferOptions( OfferToReceiveAudio, OfferToReceiveVideo, VoiceActivityDetection, IceRestart ) {
		new DebugData( RtcMedia.className, this, "setRtcOfferOptions", OfferToReceiveAudio, OfferToReceiveVideo, VoiceActivityDetection, IceRestart ).dbgDo( );
		this.offerToReceiveAudio = OfferToReceiveAudio;
		this.offerToReceiveVideo = OfferToReceiveVideo;
		this.voiceActivityDetection = VoiceActivityDetection;
		this.iceRestart = IceRestart;
	}

	//--------------------------------------------------------
	//  _rtcOfferOptions
	//--------------------------------------------------------

	/**
	 * Get Options uses with peerConn.createOffer(optional RTCOfferOptions options)
	 * 
	 * @return {object} RTCOfferOptions
	 *
	 * @see  {@link https://www.w3.org/TR/webrtc/#idl-def-rtcofferoptions|RTCOfferOptions from RFC}
	 * 
	 * @readOnly
	 * @private
	 */
    get _rtcOfferOptions() {
    	return {
			offerToReceiveAudio: ( typeof this.offerToReceiveAudio !== 'undefined' ) ? this.offerToReceiveAudio : RtcMedia.defaultValues.offerToReceiveAudio ,
			offerToReceiveVideo: ( typeof this.offerToReceiveVideo !== 'undefined' ) ? this.offerToReceiveVideo : RtcMedia.defaultValues.offerToReceiveVideo ,
			voiceActivityDetection: ( typeof this.voiceActivityDetection !== 'undefined' ) ? this.voiceActivityDetection : RtcMedia.defaultValues.voiceActivityDetection ,
			iceRestart: ( typeof this.iceRestart !== 'undefined' ) ? this.iceRestart : RtcMedia.defaultValues.iceRestart 
    	};
    }


	//--------------------------------------------------------
	//  singleStreamOnly
	//--------------------------------------------------------

	/**
	 * Determines if peerConn can have more than one MediaStream at a given time.
	 *   PeerConn allows this, BUT it causes problems in most cases. This is turned off (false) by default
	 *   to prevent many problems.  Only set this to true if you really know what you are doing.
	 *   
	 * * true = Reset and get Ice Candidates every time an offer or answer is processed.
	 * * false = Only do Ice Candidates the first time.
	 * * Default Value: false
	 */

	set singleStreamOnly( TrueFalse ) {
		var dbg = new DebugData( RtcMedia.className, this, "set singleStreamOnly", TrueFalse ).dbgDo( );
		if ( typeof TrueFalse === 'boolean' ) {
			this._singleStreamOnly = TrueFalse;
		} else {
			dbg.warnMessage( "RtcMedia: set singleStreamOnly: value must be true or false. " +
				`You gave ${TrueFalse}.  Setting to default value of '${RtcMedia.defaultValues.singleStreamOnly}'` );
			this._singleStreamOnly = RtcMedia.defaultValues.singleStreamOnly;
		}
	}

    get singleStreamOnly() { 
		return this._singleStreamOnly; 
    }


	//--------------------------------------------------------
	//  publishStream
	//--------------------------------------------------------

	/**
	 * Set/Get the local stream for publishing.  If no stream is set by the developer,
	 * 		the last stream gotten via getUserMedia is returned.
	 * 	<P>
	 * 	This is the value that gets used by Set Stream methods.
	 * 
	 * @see  RtcMedia#localCurrentStream
	 * @see  RtcMedia#localPreviousStream
	 * @see  RtcMedia#getLocalFaceStream 
	 * @see  RtcMedia#getLocalScreenCaptureStream 
	 */
	
	set publishStream( Stream ) {
		new DebugData( RtcMedia.className, this, "set publishStream", Stream ).dbgDo( true );
		this._publishStream = Stream;
	}

    get publishStream() { 
    	if ( ( typeof this._publishStream !== 'undefined' ) && ( this._publishStream !== null ) ) {
    		return this._publishStream; 
    	} else {
    		return this._localCurrentStream; 
    	}
    }

	//--------------------------------------------------------
	//  localCurrentStream
	//--------------------------------------------------------
	
	/**
	 * Get Latest Stream from getUserMedia.  There is no Set for this.  It is only set via getUserMedia.
	 *
	 * @see  RtcMedia#getLocalFaceStream 
	 * @see  RtcMedia#getLocalScreenCaptureStream 
	 */
    get localCurrentStream() { 
		return this._localCurrentStream; 
    }

	//--------------------------------------------------------
	//  localPreviousStream
	//--------------------------------------------------------

	/**
	 * Get the previous Stream from getUserMedia.  We keep the current (most recent getUserMedia) and one previous version of the streams.
	 * 		This would allow you to get/use the latest 2 Streams from getUserMedia.  There is no Set for this.  It is only set via getUserMedia.
	 * @return {MediaStream} MediaStream
	 *
	 * @see  RtcMedia#getLocalFaceStream 
	 * @see  RtcMedia#getLocalScreenCaptureStream 
	 */
    get localPreviousStream() { 
		return this._localPreviousStream; 
    }



	//--------------------------------------------------------
	//  mediaDirection
	//--------------------------------------------------------
 
 	/**
	 * Meida Direction.
	 *   NOTE: Usually other classes set this.
	 *
	 * Values 
	 * * BOTH: 2
	 * * PUBLISH_ONLY: 1
	 * * LISTEN_ONLY: 0
	 * * Default Value: BOTH
	 * 
	 * @private
	 */
    set mediaDirection( BothPubSub ) {
		var dbg = new DebugData( RtcMedia.className, this, "set mediaDirection", BothPubSub ).dbgDo( );
    	
		switch( BothPubSub ) {
		    case RtcMedia.mediaDirectionOptions.BOTH :
		    	this._mediaDirection = RtcMedia.mediaDirectionOptions.BOTH;
				dbg.logMessage( "RtcMedia: set mediaDirection: Set to BOTH." );
		        break;
		    case RtcMedia.mediaDirectionOptions.PUBLISH_ONLY :
		    	this._mediaDirection = RtcMedia.mediaDirectionOptions.PUBLISH_ONLY;
				dbg.logMessage( "RtcMedia: set mediaDirection: Set to PUBLISH_ONLY." );
		        break;
		    case RtcMedia.mediaDirectionOptions.LISTEN_ONLY :
		    	this._mediaDirection = RtcMedia.mediaDirectionOptions.LISTEN_ONLY;
				dbg.logMessage( "RtcMedia: set mediaDirection: Set to LISTEN_ONLY." );
		        break;
		    default:
				dbg.warnMessage( "RtcMedia: set mediaDirection: value must be a type from RtcMedia.mediaDirectionOptions (0,1,2). " +
					`You gave ${BothPubSub}.  Setting to default value of '${RtcMedia.defaultValues.mediaDirection}'` );
				this._mediaDirection = RtcMedia.defaultValues.mediaDirection;
		}				

	}

    get mediaDirection() { return this._mediaDirection; }



	//--------------------------------------------------------
	//  localAudioMuted
	//--------------------------------------------------------

	/**
	 * Set/get local audio muted.
	 * * true = Yes - Mute.
	 * * false = No - Unmute
	 * * Default Value: false
	 */
    set localAudioMuted( TrueFalse ) {
		var dbg = new DebugData( RtcMedia.className, this, "set localAudioMuted", TrueFalse ).dbgDo( );
    	
    	if ( TrueFalse === this._localAudioMuted ) {
			dbg.dbgExit('NO changes made' );
    		// Do nothing here so we don't waste time and resources 
    	} else {		// They are different so check and process
    		
    		if ( typeof TrueFalse === 'boolean' ) {
    			this._localAudioMuted = TrueFalse;

    			RtcMedia._muteLocalTracks( this, this._localAudioMuted, this._localVideoMuted, true );
		    
		    	// TODO:
		    	//
		    	// Check for things we need to do if audio is turned off / on in the middle of things.
		    	//   Things like renegotiating SDP, getting new _getUserMedia stream, etc.

    		} else {
    			var throwVal = "RtcMedia: set localAudioMuted: value must be true or false.  You gave " + TrueFalse ;
    			dbg.errorMessage( throwVal );
    			throw( throwVal );
    		}
			dbg.dbgExit('Changes made' );
    	}
    }

    get localAudioMuted() { return this._localAudioMuted; }


	//--------------------------------------------------------
	//  localVideoMuted
	//--------------------------------------------------------

	/**
	 * Set/get local video muted.
	 * * true = Yes - Mute.
	 * * false = No - Unmute
	 * * Default Value: false
	 */
    set localVideoMuted( TrueFalse ) {
		var dbg = new DebugData( RtcMedia.className, this, "set localVideoMuted", TrueFalse ).dbgDo( );
    	
    	if ( TrueFalse === this._localVideoMuted ) {
			dbg.dbgExit('NO changes made' );
    		// Do nothing here so we don't waste time and resources 
    	} else {		// They are different so check and process
    		
    		if ( typeof TrueFalse === 'boolean' ) {
    			this._localVideoMuted = TrueFalse;

    			RtcMedia._muteLocalTracks( this, this._localAudioMuted, this._localVideoMuted, true );

		    	// TODO:
		    	//
		    	// Check for things we need to do if audio is turned off / on in the middle of things.
		    	//   Things like renegotiating SDP, getting new _getUserMedia stream, etc.

    		} else {
    			var throwVal = "RtcMedia: set localVideoMuted: value must be true or false.  You gave " + TrueFalse ;
    			dbg.errorMessage( throwVal );
    			throw( throwVal );
    		}
			dbg.dbgExit('Changes made' );
    	}
    }

    get localVideoMuted() { return this._localVideoMuted; }



	//--------------------------------------------------------
	//  trickleIce
	//--------------------------------------------------------

	/**
	 * Set true to trickel ice,  false to send sdp as a completed batch
	 * NOTE: This is not yet working - Only sends as a batch
	 * 
	 * * true = Yes - Trickle Ice - Send Candidates 1 at a time.  Not all services allow this.
	 * * false = No - Do not trickle Ice.  Gather then all, then send in on completed SDP
	 * * Default Value: false
	 */
    set trickleIce( TrueFalse ) {		
		var dbg = new DebugData( RtcMedia.className, this, "set trickleIce", TrueFalse ).dbgDo( );
		if ( typeof TrueFalse === 'boolean' ) {
			this._trickleIce = TrueFalse;
		} else {
			dbg.warnMessage( "Value must be true or false. " +
				`You gave ${TrueFalse}.  Setting to default value of '${RtcMedia.defaultValues.trickleIce}'` );
			this._trickleIce = RtcMedia.defaultValues.trickleIce;
		}
    }

    get trickleIce() { return this._trickleIce; }





	//--------------------------------------------------------
	//  iceCandidatesTimeOutMs
	//--------------------------------------------------------

	/**
	 * Time in MS to wait before timing out waiting for Ice Candidates. 
	 */
    set iceCandidatesTimeOutMs( NumberInMs ) {		
		var dbg = new DebugData( RtcMedia.className, this, "set iceCandidatesTimeOutMs", NumberInMs ).dbgDo( );
		if ( ( typeof NumberInMs === 'number' ) && 
			( NumberInMs <= RtcMedia.defaultValues.maxIceGatherTimeOut ) && 
			( NumberInMs >= RtcMedia.defaultValues.minIceGatherTimeOut ) ) {

			this._iceCandidatesTimeOutMs = NumberInMs;
		} else {
			var setValue;
			if ( NumberInMs <= RtcMedia.defaultValues.minIceGatherTimeOut ) {
				setValue = RtcMedia.defaultValues.minIceGatherTimeOut;
			} else {
				setValue = RtcMedia.defaultValues.maxIceGatherTimeOut;
			}
			var throwVal = "RtcMedia: set iceCandidatesTimeOutMs: value must be a number in milliseconds " + 
				`between [ ${RtcMedia.defaultValues.minIceGatherTimeOut} - ${RtcMedia.defaultValues.maxIceGatherTimeOut} ].  You gave ${NumberInMs}` +
				` Setting it to ${setValue}`;
			dbg.warnMessage( throwVal );
			this._iceCandidatesTimeOutMs = setValue;
			// throw( throwVal );
		}
    }

    get iceCandidatesTimeOutMs() { return this._iceCandidatesTimeOutMs; }



	//--------------------------------------------------------
	//  negotiationNeededTimeOutMs
	//--------------------------------------------------------

	/**
	 * Time in MS to wait to determine if negotiation is needed. 
	 *
	 * @see  RtcMedia._chn_pc_TestNegotiationNeeded
	 */
    set negotiationNeededTimeOutMs( NumberInMs ) {		
		var dbg = new DebugData( RtcMedia.className, this, "set negotiationNeededTimeOutMs", NumberInMs ).dbgDo( );
		if ( ( typeof NumberInMs === 'number' ) && 
			( NumberInMs <= RtcMedia.defaultValues.maxNegotiationNeededTimeOutMs ) && 
			( NumberInMs >= RtcMedia.defaultValues.minNegotiationNeededTimeOutMs ) ) {

			this._negotiationNeededTimeOutMs = NumberInMs;
		} else {
			var setValue;
			if ( NumberInMs <= RtcMedia.defaultValues.minNegotiationNeededTimeOutMs ) {
				setValue = RtcMedia.defaultValues.minNegotiationNeededTimeOutMs;
			} else {
				setValue = RtcMedia.defaultValues.maxNegotiationNeededTimeOutMs;
			}

			var throwVal = "RtcMedia: set negotiationNeededTimeOutMs: value must be a number in milliseconds " + 
				`between [ ${RtcMedia.defaultValues.minNegotiationNeededTimeOutMs} - ${RtcMedia.defaultValues.maxNegotiationNeededTimeOutMs} ].  You gave ${NumberInMs}` +
				` Setting it to ${setValue}`;
			dbg.warnMessage( throwVal );
			this._negotiationNeededTimeOutMs = setValue;
			// throw( throwVal );
		}
    }

    get negotiationNeededTimeOutMs() { return this._negotiationNeededTimeOutMs; }


	//--------------------------------------------------------
	//  negotiationNeededTimeOutReject
	//--------------------------------------------------------

	/**
	 * If NegotiaionNeeded times out, should we reject or resolve the promise?  True = Reject.  False = Resolve.
	 *
	 * @see  RtcMedia._chn_pc_TestNegotiationNeeded
	 */
    set negotiationNeededTimeOutReject( TrueFalse ) {
		var dbg = new DebugData( RtcMedia.className, this, "set negotiationNeededTimeOutReject", TrueFalse ).dbgDo( );

		if ( typeof TrueFalse === 'boolean' ) {
			this._negotiationNeededTimeOutReject = TrueFalse;
		} else {

			var throwVal = "RtcMedia: set negotiationNeededTimeOutReject: boolean " + 
				` You gave ${TrueFalse}` +
				` Setting it to ${RtcMedia.defaultValues.negotiationNeededTimeOutReject}`;
			dbg.warnMessage( throwVal );
			this._negotiationNeededTimeOutReject = RtcMedia.defaultValues.negotiationNeededTimeOutReject;
		}
    }

    get negotiationNeededTimeOutReject() { return this._negotiationNeededTimeOutReject; }


	//--------------------------------------------------------
	//  localVideoElement
	//--------------------------------------------------------

	/**
	 * Local Video Element from HTML to put video in.  If this is set, the Video Element source
	 * 		will automatically be set when media is ready.
	 * 
	 * @see  RtcMedia#gumSetAudioVideoOptions
	 * @see  RtcMedia#getLocalFaceStream
	 * @see  RtcMedia#getLocalScreenCaptureStream
	 */
    set localVideoElement( VideoElement ) {
		new DebugData( RtcMedia.className, this, "set localVideoElement", VideoElement ).dbgDo( );
    	this._localVideoElement = VideoElement;
    }

    get localVideoElement() {
    	return this._localVideoElement;
    }


	//--------------------------------------------------------
	//  remoteVideoElement
	//--------------------------------------------------------

 	/**
	 * Remote Video Element from HTML to put video in.  If this is set, the Video Element source
	 * 		will automatically be set when media is ready.
	 * 	This should be set by the programer before getting user media (face or screen)
	 * 
	 */
    set remoteVideoElement( VideoElement ) {
		new DebugData( RtcMedia.className, this, "set remoteVideoElement", VideoElement ).dbgDo( );
    	this._remoteVideoElement = VideoElement;
    }

    get remoteVideoElement() {
    	return this._remoteVideoElement;
    }


	//--------------------------------------------------------
	//  peerConn
	//--------------------------------------------------------

	// No setter for peerConn because we only set the private
	//   variable of _peerConn;

	/**
	 * Gets the WebRTC PeerConnection. 
	 * @readOnly
	 */
    get peerConn() { return this._peerConn; }





	//--------------------------------------------------------
	//  sdpOffer
	//--------------------------------------------------------

	// No setter for sdpOffer because we only set the private
	//   variable of _offerSdp;

	/**
	 * Gets SDP from the offer.  It checks both local and remote descriptions. 
	 * @readOnly
	 */
    get sdpOffer() { 

    	var retSdp = null;

    	if ( this.localDescription.type === 'offer' ){
    		retSdp = this.localDescription.sdp;
    	} else if ( this.remoteDescription.type === 'offer' ) {
    		retSdp = this.remoteDescription.sdp;
    	} 
    	return retSdp;
    }

	//--------------------------------------------------------
	//  sdpAnswer
	//--------------------------------------------------------

	// No setter for sdpAnswer because we only set the private
	//   variable of _answerSdp;

	/**
	 * Gets SDP from the answer.  It checks both local and remote descriptions. 
	 * @readOnly
	 */
    get sdpAnswer() { 
    	var retSdp = null;

    	if ( this.localDescription.type === 'answer' ){
    		retSdp = this.localDescription.sdp;
    	} else if ( this.remoteDescription.type === 'answer' ) {
    		retSdp = this.remoteDescription.sdp;
    	} 
    	return retSdp;
    }


	//--------------------------------------------------------
	//  localDescription
	//--------------------------------------------------------

	// No setter for localDescription because we only set the private
	//   variable of _peerConn.localDescription;

	/**
	 * Gets the local JSEP Destription. 
	 * @readOnly
	 */
    get localDescription() { return ( typeof this._peerConn !== 'undefined') ? this._peerConn.localDescription : 'undefined'; }


	//--------------------------------------------------------
	//  localStream
	//--------------------------------------------------------

	// No setter for localStream because it is managage by peerConn

	/**
	 * Gets the local stream - Convienance for  this._peerConn.getLocalStreams()[0]
	 * @readOnly
	 *
	 * @see  RtcMedia#publishStream
	 */
    get localStream() { 
    	if ( typeof this._peerConn === 'undefined' ) { return; }

    	var ls = this._peerConn.getLocalStreams()[0];
    	return ls; 
    }




	//--------------------------------------------------------
	//  remoteDescription
	//--------------------------------------------------------

	// No setter for remoteDescription because we only set the private
	//   variable of _peerConn.remoteDescription;

	/**
	 * Gets the remote JSEP Destription. 
	 * @readOnly
	 */
    get remoteDescription() { return ( typeof this._peerConn !== 'undefined' ) ? this._peerConn.remoteDescription  : 'undefined'; }


	//--------------------------------------------------------
	//  remoteStream
	//--------------------------------------------------------

	// No setter for remoteStream because it is managage by peerConn

	/**
	 * Gets the remote stream - Convienance for this._peerConn.getRemoteStreams()[0]
	 * @readOnly
	 */
    get remoteStream() { 
      	if ( typeof this._peerConn === 'undefined' ) { return; }
		var rs = this._peerConn.getRemoteStreams()[0]; 
		return rs;
	}






	//##########################################################################
	//##########################################################################
	//##########################################################################
	//
	// I N S T A N C E    METHODS
	// 
	//##########################################################################
	//##########################################################################
	//##########################################################################
	



	//##########################################################################
	// General Stream & Track  Function Wrappers for Streams and Tracks
	//  - _streamTracksDisableStopRemove
	//  - setStreamTrack 		- Set/Replace Track[0] in a Stream
	//  - copyStreamTracks 		- Set/Replace Track[0] of Audio and/or Video from one Stream to another
	//  - printTracks 			- Print Track details
	//##########################################################################



	//--------------------------------------------------------
	//  _muteLocalTracks 	- 
	//--------------------------------------------------------

	/**
	 * Mute / Unmute Local (from camera or screen) Audio and Video Tracks.  True = mute, False = unmute
	 * 
	 * @param  {boolean} MuteAudioTF True = mute, False = Unmute
	 * @param  {boolean} MuteVideoTF True = mute, False = Unmute
	 * @param  {boolean} AllTracksTF True = All tracks, not just the first one.  False = mute just the first track
	 * @return {void}
	 */
	static _muteLocalTracks( Self, MuteAudioTF, MuteVideoTF, AllTracksTF ) { 
		var self = Self;
		var dbg = new DebugData( RtcMedia.className, self, "set _muteLocalTracks", MuteAudioTF, MuteVideoTF, AllTracksTF ).dbgEnter( );

		// Mute Audio 

		if 	( ( typeof( MuteAudioTF ) !== 'undefined' )  && ( typeof( MuteAudioTF ) === 'boolean' ) ) {


			if ( !!AllTracksTF ) {
				dbg.logMessage( 'Muting all AUDIO tracks.' ); 

				if ( self.peerConn ) {
					self.peerConn.getLocalStreams().forEach( 
						function( StreamToMute ) {
							RtcMedia._muteStreamAudioTracks( StreamToMute, MuteAudioTF );
						}
					);							
				}

				if ( !!self._localCurrentStream ) {
					RtcMedia._muteStreamAudioTracks( self._localCurrentStream, MuteAudioTF );
				}	

				if ( !!self._localPreviousStream ) {
					RtcMedia._muteStreamAudioTracks( self._localPreviousStream, MuteAudioTF );
				}	


			} else {		// Default Function because if AllTracksTF === 'undefined' we come here
				dbg.logMessage( 'Muting first AUDIO track only.' ); 

				if (( !!self.peerConn.getLocalStreams() ) && ( !!self.peerConn.getLocalStreams()[0].getAudioTracks().length )) {
					self.peerConn.getLocalStreams()[0].getAudioTracks()[0].enabled = !MuteAudioTF;
				}

				if (( !!self._localCurrentStream ) && ( !!self._localCurrentStream.getAudioTracks().length )) {
					self._localCurrentStream.getAudioTracks()[0].enabled = !MuteAudioTF;
				}	

				if (( !!self._localPreviousStream ) && ( !!self._localPreviousStream.getAudioTracks().length )) {
					self._localPreviousStream.getAudioTracks()[0].enabled = !MuteAudioTF;
				}	

			}

		} else {
			dbg.dbgMessage( 'NOT Muting any AUDIO tracks ' ); 
			// Do Nothing 
		}

		// Mute Video 
	
		if 	( ( typeof( MuteVideoTF ) !== 'undefined' )  && ( typeof( MuteVideoTF ) === 'boolean' ) ) {

			if ( !!AllTracksTF ) {
				dbg.logMessage( 'Muting all VIDEO tracks.' ); 

				if ( self.peerConn ) {
					self.peerConn.getLocalStreams().forEach( 
						function( StreamToMute ) {
							RtcMedia._muteStreamVideoTracks( StreamToMute, MuteVideoTF );
						}
					);
				}
	
				if ( !!self._localCurrentStream ) {
					RtcMedia._muteStreamVideoTracks( self._localCurrentStream, MuteVideoTF );
				}	

				if ( !!self._localPreviousStream ) {
					RtcMedia._muteStreamVideoTracks( self._localPreviousStream, MuteVideoTF );
				}	


			} else {		// Default Function because if AllTracksTF === 'undefined' we come here
				dbg.logMessage( 'Muting first VIDEO track only.' ); 

				if (( !!self.peerConn.getLocalStreams() ) && ( !!self.peerConn.getLocalStreams()[0].getVideoTracks().length )) {
					self.peerConn.getLocalStreams()[0].getVideoTracks()[0].enabled = !MuteVideoTF;
				}

				if (( !!self._localCurrentStream ) && ( !!self._localCurrentStream.getVideoTracks().length )) {
					self._localCurrentStream.getVideoTracks()[0].enabled = !MuteVideoTF;
				}	

				if (( !!self._localPreviousStream ) && ( !!self._localPreviousStream.getVideoTracks().length )) {
					this._localPreviousStream.getVideoTracks()[0].enabled = !MuteVideoTF;
				}	

			}
		} else {
			dbg.dbgMessage( 'NOT Muting any VIDEO tracks.' ); 
			// Do Nothing 
		}

		dbg.dbgExit();
	}





















































	//##########################################################################
	//##########################################################################
	//##########################################################################
	//
	// C L A S S   VARIABLES 
	//
	//##########################################################################
	//##########################################################################
	//##########################################################################
	
	/**
	 * Used for creating names and keeping track of multiple RtcMedia instances.
	 */
	static get counter() {
		if ( typeof RtcMedia._counter !== 'number') {
			RtcMedia._counter = 1;
		} else {
			RtcMedia._counter = RtcMedia._counter + 1;
		}
		return RtcMedia._counter;
	}


	/**
	 * Media Direction
	 *
	 * Values are:
	 * * 2) means audio/video can send and recieve
	 * * 1) means audio/video can send from the broswer/client.  This is used for publish only streams 
	 * * 0) means audio/video can only be recieved from others, not sent.  This is used for listen only streams.
	 * @readonly
	 */
	static get mediaDirectionOptions() {
		return {
			/** (2) means audio/video can send and recieve */
    		BOTH: 2,
			/** (1) means audio/video can send from the broswer/client.  This is used for publish only streams */
    		PUBLISH_ONLY: 1,
			/** (0) means audio/video can only be recieved from others, not sent.  This is used for listen only streams. */
    		LISTEN_ONLY: 0
    	};
	}


	/**
	 * This is used with {@link RtcMedia#sendVideo}.  If you pass in a string that can be matched up with 
	 * 		a value in {@link RtcMedia.videoSizeOptions}, then the return value will be used for
	 * 		video critera.
	 *
	 * Values are:
	 * * '720p': { "width": 1280, "height": 720, "ratio": "16:9" },
	 * * SVGA: { "width": 800, "height": 600, "ratio": "4:3" }, 
	 * * VGA: { "width": 640, "height": 480, "ratio": "4:3" }, 
	 * * 360p: { "width": 640, "height": 360, "ratio": "16:9" }, 
	 * * CIF: { "width": 352, "height": 288, "ratio": "4:3" }, 
	 * * QVGA: { "width": 320, "height": 240, "ratio": "4:3" }, 
	 * * QVGA: { "width": 320, "height": 240, "ratio": "4:3" }, 
	 * * QCIF: { "width": 176, "height": 144, "ratio": "4:3" }, 
	 * * QQVGA: { "width": 160, "height": 120, "ratio": "4:3" }, 
	 *
	 * ```js
	 * RtcMedia.videoSizeOptions.VGA;
	 * // Returns -->  VGA Object { "width": 640, "height": 480, "ratio": "4:3" }
	 *
	 * var rtcMedia = new RtcMedia();
	 * rtcMedia.sendVideo = RtcMedia.videoSizeOptions.VGA;
	 * 
	 * rtcMedia.sendVideo;
	 * // Returns --> Object {width: 640, height: 480, ratio: "4:3"}
	 * ```
	 * @readonly
	 * 
	 * @see  RtcMedia#sendVideo
	 */
	static get videoSizeOptions() {
		// return RtcMedia_VIDEO_SIZE_OPTIONS;
		return  {
			/**
			 * 	'720p': { "width": 1280, "height": 720, "ratio": "16:9" },
			 */
			'720p': {
			    "width": 1280,
			    "height": 720,
			    "ratio": "16:9"
			},
			/**
			 * SVGA: { "width": 800, "height": 600, "ratio": "4:3" }, 
			 */
			SVGA: {
			    "width": 800,
			    "height": 600,
			    "ratio": "4:3"
			},
			/**
			 * VGA: { "width": 640, "height": 480, "ratio": "4:3" }, 
			 */
			VGA: {
			    "width": 640,
			    "height": 480,
			    "ratio": "4:3"
			},
			/**
			 * 360p: { "width": 640, "height": 360, "ratio": "16:9" }, 
			 */
			'360p': {
			    "width": 640,
			    "height": 360,
			    "ratio": "16:9"
			},
			/**
			 * CIF: { "width": 352, "height": 288, "ratio": "4:3" }, 
			 */
			CIF: {
			    "width": 352,
			    "height": 288,
			    "ratio": "4:3"
			},
			/**
			 * QVGA: { "width": 320, "height": 240, "ratio": "4:3" }, 
			 */
			QVGA: {
			    "width": 320,
			    "height": 240,
			    "ratio": "4:3"
			},
			/**
			 * QCIF: { "width": 176, "height": 144, "ratio": "4:3" }, 
			 */
			QCIF: {
			    "width": 176,
			    "height": 144,
			    "ratio": "4:3"
			},
			/**
			 * QQVGA: { "width": 160, "height": 120, "ratio": "4:3" }, 
			 */
			QQVGA: {
			    "width": 160,
			    "height": 120,
			    "ratio": "4:3"
			}		
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
	 * * onLocalFaceStream
	 * * onLocalScreenCaptureStream
	 * * onRemoteStream
	 * * onPeerConn_NegotiationNeeded
	 * * onPeerConn_IceCandidate
	 *
	 * @return {object} Returns a list of Event Names for this class and parents
	 * 
	 */
	static get eventNames() {
		// allEvent
		var allEvents = {

			NkMedia_EventNames_Start_Here: "NkMedia_EventNames_Start_Here",

			/**
		     * When calling {@link RtcMedia#getLocalFaceStream} and it gets a stream, this fires and returns the stream.
		     * 		From here, the developer would attach it to an HTML Video Element.
		     *
		     * @event onLocalFaceStream
		     * @type {Event}
		     *
		     * @see  RtcMedia#getLocalFaceStream
		     * @see  RtcMedia.eventNames
		     * 
		     */
			onLocalFaceStream: "onLocalFaceStream",

			/**
		     * When calling {@link RtcMedia#getLocalScreenCaptureStream} and it gets a stream, this fires and returns the stream.
		     * 		From here, the developer would attach it to an HTML Video Element.
		     *
		     * @event onLocalScreenCaptureStream
		     * @type {Event}
		     *
		     * @see  RtcMedia#getLocalScreenCaptureStream
		     * @see  RtcMedia.eventNames
		     */
			onLocalScreenCaptureStream: "onLocalScreenCaptureStream",

			/**
		     * Need to implement this
		     *
		     * @event onRemoteStream
		     * @type {Event}
		     *
		     * @see  RtcMedia.eventNames
		     */
			onRemoteStream: "onRemoteStream",

			/**
		     * Fires When Adding a stream and setting Description require re-negotiation.
		     *
		     * @event onPeerConn_NegotiationNeeded
		     * @type {Event}
		     *
		     * @see  RtcMedia.eventNames
		     */
			onPeerConn_NegotiationNeeded: "onPeerConn_NegotiationNeeded",

			/**
		     * Fires IF both are true
		     * 
		     * * self.trickleIce = true
		     * * peerConn.onicecandidate event happens
		     * 	  
		     * @event onPeerConn_IceCandidate
		     * @type {Event}
		     *
		     * @see  RtcMedia.eventNames
		     */

			onPeerConn_IceCandidate: "onPeerConn_IceCandidate",



		};


		return allEvents;
	}




















	//##########################################################################
	//##########################################################################
	//##########################################################################
	//
	// C L A S S   METHODS 
	//
	//##########################################################################
	//##########################################################################
	//##########################################################################
	


	//==========================================================================
	// Class  Functions   
	//==========================================================================

	static createUuid() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	    	// var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
	    	var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
	    	return v.toString(16);
			});
	}



	static createNewName() { 
		var retVal = "RtcMedia_Instance_" + RtcMedia.counter;
		return retVal;
	}


	//--------------------------------------------------------
	//  Database 
	//--------------------------------------------------------

	static dbAdd( RtcMediaInstance ) {
		RtcMedia._dbCreate();

		if ( (typeof RtcMediaInstance.name === 'string' ) && 
			 ( typeof RtcMedia._db.byName[ RtcMediaInstance.name ] === 'undefined' ) ) {
			RtcMedia._db.byName[ RtcMediaInstance.name ] = RtcMediaInstance;
		}

		if ( (typeof RtcMediaInstance._nkSessionId === 'string' ) && 
			 ( typeof RtcMedia._db.byNcSessionId[ RtcMediaInstance._nkSessionId ] === 'undefined' ) ) {
			RtcMedia._db.byNcSessionId[ RtcMediaInstance._nkSessionId ] = RtcMediaInstance;
		}

		if ( (typeof RtcMediaInstance._rtcId === 'string' ) && 
			 ( typeof RtcMedia._db.byRtcId[ RtcMediaInstance._rtcId ] === 'undefined' ) ) {
			RtcMedia._db.byRtcId[ RtcMediaInstance._rtcId ] = RtcMediaInstance;
		}

	}

	static dbUpdate( RtcMediaInstance ) {
		RtcMedia.dbAdd( RtcMediaInstance );
	}

	static dbDelete( RtcMediaInstance ) {
		RtcMedia._dbCreate();

		if ( (typeof RtcMediaInstance.name === 'string' ) && 
			 ( typeof RtcMedia._db.byName[ RtcMediaInstance.name ] !== 'undefined' ) ) {
			delete RtcMedia._db.byName[ RtcMediaInstance.name ];
		}

		if ( (typeof RtcMediaInstance._nkSessionId === 'string' ) && 
			 ( typeof RtcMedia._db.byNcSessionId[ RtcMediaInstance._nkSessionId ] !== 'undefined' ) ) {
			delete RtcMedia._db.byNcSessionId[ RtcMediaInstance._nkSessionId ];
		}

		if ( (typeof RtcMediaInstance._rtcId === 'string' ) && 
			 ( typeof RtcMedia._db.byRtcId[ RtcMediaInstance._rtcId ] !== 'undefined' ) ) {
			delete RtcMedia._db.byRtcId[ RtcMediaInstance._rtcId ];
		}


	}

	static _dbCreate() {
		if ( typeof RtcMedia._db !== 'object' ) {
			RtcMedia._db = {
				byName: {},
				byRtcId: {},
				byNcSessionId: {},
			};
		}
	}

	static get dbList() {
		RtcMedia._dbCreate();
		return RtcMedia._db;		
	}


	static get dbListString() {
		RtcMedia._dbCreate();

		var list = {
				byName: [],
				byRtcId: [],
				byNcSessionId: [],
			};

		Object.keys( RtcMedia.dbList.byName ).forEach( function( key ) {
			list.byName.push( key );
		});

		Object.keys( RtcMedia.dbList.byNcSessionId ).forEach( function( key ) {
			list.byNcSessionId.push( key );
		});

		Object.keys( RtcMedia.dbList.byRtcId ).forEach( function( key ) {
			list.byRtcId.push( key );
		});

		return DebugData.JsonTab( list );		
	}





	//==========================================================================
	// Stream  Functions   
	//==========================================================================




	//--------------------------------------------------------
	//  _streamTracksDisableStopRemove
	//--------------------------------------------------------

	/**
	 * Cleans up a media stream by doing the following.
	 * 
	 * * track.enabled = false;
	 * * track.stop();
	 * * MediaStreamToEffect.removeTrack( track );
	 * 
	 * @param  {MediaStream}
	 * @return {null}
	 * @private
	 * 
	 * @see  RtcMedia#closePeerConn
	 * @see  RtcMedia#_getUserMedia
	 */
	static _streamTracksDisableStopRemove( MediaStreamToEffect ) {		// Returns Nothing
		var dbg = new DebugData( RtcMedia.className, 'Static', "_streamTracksDisableStopRemove", MediaStreamToEffect ).dbgEnter( true );

		MediaStreamToEffect.getTracks().forEach(
			function( track ) {
				track.enabled = false;
				track.stop();
				MediaStreamToEffect.removeTrack( track );
			}
		);

		dbg.dbgExit();
	}


	//--------------------------------------------------------
	//  printTracks
	//--------------------------------------------------------

	/**
	 * Rturns a string with track details.  Used for debuging.
	 * 
	 * @param  {MediaStreamTrack[]} 
	 * @return {string}
	 */
	static printTracks( Tracks ) { 
		var retVal = "";

		Tracks.forEach(
			function( track) {
				retVal = retVal + 
					`Track = ${track.kind}, ${track.id}, ${track.label.substring(0,12)} , enabled: ${track.enabled}, readyState: ${track.readyState}, remote: ${track.remote}\n\t\t`;
			}
		);

		return retVal.substring(0, retVal.length - 4);
	}


	//--------------------------------------------------------
	//  setStreamTrack 	- 
	//--------------------------------------------------------

	/**
	 * Set/Replace Track[0] in a Stream
	 * 
	 * @param {MediaStream} StreamToSet 	(M) MediaStream - The Stream where the Track will be put
	 * @param {MediaStreamTrack} TrackToSet 	(M) MediaStreamTrack - The Track
	 * @return {void} 
	 * @see  RtcMedia.copyStreamTracks
	 */
	static setStreamTrack( StreamToSet, TrackToSet ) {
		var dbg = new DebugData( RtcMedia.className, 'Static', "setStreamTrack", StreamToSet, TrackToSet ).dbgEnter();

		if ( !!TrackToSet ) { 
			if ( TrackToSet.kind === 'audio' ) {

				StreamToSet.getAudioTracks().forEach( 
						function(Track) {
							StreamToSet.removeTrack( Track );
						}
					);

				StreamToSet.addTrack( TrackToSet );

			} else if ( TrackToSet.kind === 'video' ) {

				StreamToSet.getVideoTracks().forEach( 
						function(Track) {
							StreamToSet.removeTrack( Track );
						}
					);

				StreamToSet.addTrack( TrackToSet );

			} else {
				dbg.warnMessage( "TrackToSet is not 'audio' or 'video'", TrackToSet );
			}

		}
		dbg.dbgExit();
	}


	//--------------------------------------------------------
	//  copyStreamTracks 	- 
	//--------------------------------------------------------

	/**
	 * Will only copy/replace the first Track of Audio and/or Video
	 *     - there should only be 1 track per audio/video for these apps
	 *
	 * @param {MediaStream} FromStream 	(M) The Stream where Track(s) come FROM
	 * @param {MediaStream} ToStream 	(M) The Stream where Track(s) go TO
	 * @param {boolean} AudioTrackTF 	(M) Should the AudioTrack be copied
	 * @param {boolean} VideoTrackTF 	(M) Should the VideoTrack be copied
	 * @return void
	 * 
	 * @see RtcMedia.setStreamTrack
	 */
	static copyStreamTracks( FromStream, ToStream, AudioTrackTF, VideoTrackTF ) { 
		var dbg = new DebugData( RtcMedia.className, 'static', "copyStreamTracks", FromStream, ToStream, AudioTrackTF, VideoTrackTF ).dbgEnter( true );

		if ( ( !ToStream ) || ( !FromStream ) ) { 
			dbg.warnMessage( "FromStream and/or ToStream are not set! ", FromStream, ToStream );

		}

		if 	( ( AudioTrackTF === true )	&& ( FromStream.getAudioTracks().length > 0 ) ) {
			RtcMedia.setStreamTrack( ToStream, FromStream.getAudioTracks()[0] );
		} 

		if 	( ( VideoTrackTF === true )	&& ( FromStream.getVideoTracks().length > 0 ) ) {
			RtcMedia.setStreamTrack( ToStream, FromStream.getVideoTracks()[0] );
		} 
		dbg.dbgExit();
	}


	//--------------------------------------------------------
	//  _muteStreamAudioTracks
	//--------------------------------------------------------

	/**
	 * Mute / Unmute Audio Tracks in a MediaStream
	 *
	 * @private
	 * @param  {MediaStream} Stream (M) Stream to Mute/Unmute
	 * @param  {boolean} MuteAudioTF True = mute, False = Unmute
	 * @return {void}
	 */
	static _muteStreamAudioTracks( Stream, MuteAudioTF ) {
		new DebugData( RtcMedia.className, 'static', "_muteStreamAudioTracks", Stream, MuteAudioTF ).dbgDo( true );

		if ( typeof Stream === 'object' && Stream !== 'null' ) {
			Stream.getAudioTracks().forEach(
				function( TrackToMute ) {
					TrackToMute.enabled = !MuteAudioTF;
				}
			);
		}
	}

	//--------------------------------------------------------
	//  _muteStreamVideoTracks
	//--------------------------------------------------------

	/**
	 * Mute / Unmute Video Tracks in a MediaStream
	 *
	 * @private
	 * @param  {MediaStream} Stream (M) Stream to Mute/Unmute
	 * @param  {boolean} MuteVideoTF True = mute, False = Unmute
	 * @return {void}
	 */
	static _muteStreamVideoTracks( Stream, MuteVideoTF ) {
		new DebugData( RtcMedia.className, 'static', "_muteStreamAudioTracks", Stream, MuteVideoTF ).dbgDo( true );

		if ( typeof Stream === 'object' && Stream !== 'null' ) {
			Stream.getVideoTracks().forEach(
				function( TrackToMute ) {
					TrackToMute.enabled = !MuteVideoTF;
				}
			);
		}
	}












































	//###########################################################
	// L O C A L   PeerConn Related Things
	//###########################################################
	// SetLocal Stream  AND TestNegotiation
	//===========================================================
	//			setLocalStream_To_FullSdpOffer() 				-> Promise( mySelfPromiseData )
	// static 	_chn_pc_SetLocalStream_To_FullSdpOffer( mySelfPromiseData )		-> Promise( mySelfPromiseData )
	// 
	// static 	_chn_pc_SetLocalStream( mySelfPromiseData )		-> Promise( mySelfPromiseData )
	// static 	_chn_pc_SetLocalStreamAndTestNegotiation( mySelfPromiseData )		-> Promise( mySelfPromiseData )
	// static 	_chn_pc_SetLocalStreamAndTestNegotiationResolve( mySelfPromiseData )		-> Promise( mySelfPromiseData )
	// static 	_chn_pc_SetLocalStreamAndTestNegotiationReject( mySelfPromiseData )		-> Promise( mySelfPromiseData )
	//
	//===========================================================
	// Create Offer / Answer, SetDescription Wait for Ice (or trickle)
	//===========================================================
	//
	// static 	_chn_pc_CreateOffer_SetLocalDescription( mySelfPromiseData )		-> Promise( mySelfPromiseData )
	// static 	_chn_pc_CreateOffer_SetLocalDescription_And_WaitForIceCompleteOrTimeout( mySelfPromiseData )		-> Promise( mySelfPromiseData )
	// static 	_chn_pc_CreateOffer_SetLocalDescription_And_TrickleIce( mySelfPromiseData )		-> Promise( mySelfPromiseData )
	//
	// static 	_chn_pc_CreateAnswer_SetLocalDescription( mySelfPromiseData ) 	-> Promise( mySelfPromiseData )
	// static 	_chn_pc_CreateAnswer_SetLocalDescription_And_WaitForIceCompleteOrTimeout( mySelfPromiseData ) 	-> Promise( mySelfPromiseData )
	// static 	_chn_pc_CreateAnswer_SetLocalDescription_And_TrickleIce( mySelfPromiseData ) 	-> Promise( mySelfPromiseData )
	//
	// static 	_chn_pc_CreateOffer( mySelfPromiseData )							-> Promise( mySelfPromiseData )
	//				setRtcOfferOptions( ... ) 				-> void
	//				_rtcOfferOptions() 						-> Object
	// 					get/set   offerToReceiveAudio 			= boolean
	// 					get/set   offerToReceiveVideo 			= boolean
	// 					get/set   voiceActivityDetection 		= boolean
	// 					get/set   iceRestart 			 		= boolean
	// static 	_chn_pc_CreateAnswer( mySelfPromiseData ) 						-> Promise( mySelfPromiseData )
	// static 	_chn_pc_SetLocalDescription( mySelfPromiseData )	 				-> Promise( mySelfPromiseData )
	// 			 	setLocalSdpOffer( LocalSdpString )								-> Promise( mySelfPromiseData )
	// 				setLocalSdpAnswer( LocalSdpString )								-> Promise( mySelfPromiseData )
	//
	// static 	_chn_pc_WaitForIceCompleteOrTimeout( mySelfPromiseData )	 		-> Promise( mySelfPromiseData )
	// 				get/set   iceCandidatesTimeOutMs 		= boolean
	// 				
	// static 	_chn_pc_TestNegotiationNeeded( mySelfPromiseData )	 			-> Promise( mySelfPromiseData )
	// 				get/set   negotiationNeededTimeOutMs 	= boolean
	//
	// 				get/set   trickleIce 							= boolean
	//
	//===========================================================
	// Local Stream Management
	//===========================================================
	//
	// 			_pcAddLocalStream( MediaStream )				-> Promise( mySelfPromiseData )
	// 			_pcRemoveLocalStream( MediaStream )			-> Promise( mySelfPromiseData )
	// 			_pcSetLocalStream( MediaStream )				-> Promise( mySelfPromiseData )
	//
	//			get localDescription()
	//			get localStream() 
	//
	//===========================================================


	/**
	 * Sets a MediaStream in the peerConn and does eveything required to get full SDP offer (with Ice Candidates)
	 * 		ready to send to NetComposer
	 * 		
	 * @return {Promise(PromiseData)} Promise.resolve( mySelfPromiseData ) so they can be chained together
	 */
	setLocalStream_To_FullSdpOffer(  ) {
		return RtcMedia._chn_pc_SetLocalStream_To_FullSdp( this.mySelfPromiseData );
	}


	static _chn_pc_SetLocalStream_To_FullSdpOffer( mySelfPromiseData ) {
		var self = mySelfPromiseData.self;
		new DebugData( RtcMedia.className, self, "_chn_pc_SetLocalStream_To_FullSdp" ).dbgDoPd();

    	return RtcMedia._chn_pc_SetLocalStreamAndTestNegotiationResolve( self.mySelfPromiseData )
    		.then( RtcMedia._chn_pc_CreateOffer_SetLocalDescription_And_WaitForIceCompleteOrTimeout );
	}





	//===========================================================
	//  SetLocal Stream  AND TestNegotiation 
	//===========================================================


	//--------------------------------------------------------
	//  _chn_pc_SetLocalStream
	//--------------------------------------------------------

	/**
	 * Does {@link RtcMedia#_pcSetLocalStream|self._pcSetLocalStream( self.localStream )}.  This will usually cause a negotiationNeeded event to be triggered.
	 * 		<P>
	 * 		NOTE: This should usually NOT be used by itself, but rather via the on of these methods
	 * 		<UL>
	 * 		  <LI> {@link RtcMedia._chn_pc_SetLocalStreamAndTestNegotiationResolve}
	 * 		  <LI> {@link RtcMedia._chn_pc_SetLocalStreamAndTestNegotiationReject}
	 * 		</UL>
	 *
	 * 		<UL>
	 * 		  <LI> {@link RtcMedia._chn_pc_SetLocalStreamAndTestNegotiationResolve}
	 * 		  <LI> {@link RtcMedia._chn_pc_SetLocalStreamAndTestNegotiationReject}
	 * 		</UL>
	 * 
	 * 
	 * @param  {PromiseData} 	mySelfPromiseData 	The Standard Input (and output) for most Promise so they can be chained together
	 * @return {Promise(PromiseData)} Promise.resolve( mySelfPromiseData ) so they can be chained together
	 * 
	 * @property {NA}  PreCall 		Things that should be set before calling this function
	 * @property {MediaStream}  PreCall.localStream  	Requires {@link RtcMedia#localStream} to be set before calling
	 * @property {NA}  PostCall  	Things this funciton sets
	 * @property {MediaStream}  PostCall.localStream  	Requires {@link RtcMedia#localStream} to be set before calling
	 * @property {NA}  Triggers  	Things this funciton triggers 
	 * @property {MediaStream}  Triggers.localStream  	Requires {@link RtcMedia#localStream} to be set before calling
	 * 
	 * @property {NA}  Uses 		Things this function uses other than parameters
	 * @property {object}  Uses._rtcOfferOptions  	{@link RtcMedia#_rtcOfferOptions} must be set before calling this.  If not set, default values will be used.
	 * 		This can get set using {@link RtcMedia#setRtcOfferOptions}
	 * 
	 * @property {NA}  Sets  	Things this funciton Sets  (Nothing)
	 * @property {object}  Sets._jsepRtcDesc  	self._jsepRtcDesc - private with no public getter
	 * 
	 * @property {NA}  Fires  	Things this funciton Fires (Nothing)
	 * 
	 * @see  RtcMedia._chn_pc_SetLocalStreamAndTestNegotiationReject
	 * @see  RtcMedia._chn_pc_SetLocalStreamAndTestNegotiationResolve
	 * @see  RtcMedia#_pcSetLocalStream
	 * @see  RtcMedia#publishStream
	 */	
	static _chn_pc_SetLocalStream( mySelfPromiseData ) {
		var self = mySelfPromiseData.self;
		var publishStream = self.publishStream;

		var dbg = new DebugData( RtcMedia.className, self, "_chn_pc_SetLocalStream", publishStream ).dbgEnterPd( true );

		var promise = new Promise( function(resolve, reject) {

			var theError; 

			if ( typeof publishStream === 'undefined' || publishStream === null ) {
				theError = new Error( "publishStream in undefined or null.  It must be set before calling this functoin!" );
				dbg.warnMessage( theError.stack );
				reject( theError );
			}

			self.peerConn_Init();	// Just returns if there is already a _peerConn - otherwise creates it.

			if ( self.singleStreamOnly ) {

				// 1) Remove other MediaStream to make sure we only have 1 stream when done.
				self.peerConn.getLocalStreams().forEach( 
					function(StreamToRemove) { 
						self._pcRemoveLocalStream(StreamToRemove);
					}
				);				
			}

			self._pcAddLocalStream( publishStream );

			dbg.dbgResolve( 'mySelfPromiseData' );
			resolve( mySelfPromiseData );
		});

		dbg.dbgExitPd(); 
		return promise;

	}


	//--------------------------------------------------------
	//  _chn_pc_SetLocalStreamAndTestNegotiation
	//--------------------------------------------------------

	/**
	 * Generic version.  Calls {@link RtcMedia._chn_pc_TestNegotiationNeeded } AND {@link RtcMedia._chn_pc_SetLocalStream } together.  This sets up 
	 * 		{@link RtcMedia._chn_pc_TestNegotiationNeeded } first (but does not wait for it), then sets up {@link RtcMedia._chn_pc_SetLocalStream }.
	 * 		{@link RtcMedia._chn_pc_SetLocalStream } SHOULD trigger a peerConn.negotiationNeeded event which will resolve the {@link RtcMedia._chn_pc_TestNegotiationNeeded }.
	 * 		If {@link RtcMedia._chn_pc_SetLocalStream } does not trigger a peerConn.negotiationNeeded event THEN {@link RtcMedia._chn_pc_TestNegotiationNeeded } times out.
	 * 		<P>
	 * 		To determine if {@link RtcMedia._chn_pc_TestNegotiationNeeded } timesOut should trigger a Resolve or Reject, the {@link RtcMedia#negotiationNeededTimeOutReject}
	 * 		is queried. 
	 * 		<P>
	 * 		With this funciton call {@link RtcMedia#negotiationNeededTimeOutReject} should be set by developer or else the default (or previously set) value will be used.
	 * 		<P>
	 * 		<B>It is MUCH better to use one of these:
	 * 		<UL>
	 * 		  <LI> {@link RtcMedia._chn_pc_SetLocalStreamAndTestNegotiationResolve} or
	 * 		  <LI> {@link RtcMedia._chn_pc_SetLocalStreamAndTestNegotiationReject}, 
	 * 		</UL> as they set those values before calling this function.</B>
	 * 
	 * @param  {PromiseData} 	mySelfPromiseData 	The Standard Input (and output) for most Promise so they can be chained together
	 * @return {Promise(PromiseData)} Promise.resolve( mySelfPromiseData ) so they can be chained together
	 * 
	 * @see  RtcMedia#negotiationNeededTimeOutReject
	 * @see  RtcMedia._chn_pc_SetLocalStreamAndTestNegotiationResolve
	 * @see  RtcMedia._chn_pc_SetLocalStreamAndTestNegotiationReject
	 * @see  RtcMedia._chn_pc_TestNegotiationNeeded
	 * @see  RtcMedia._chn_pc_SetLocalStream
	 */
	static _chn_pc_SetLocalStreamAndTestNegotiation( mySelfPromiseData ) {
		var self = mySelfPromiseData.self;
		var dbg = new DebugData( RtcMedia.className, self, "_chn_pc_SetLocalStreamAndTestNegotiation" ).dbgDoPd();

		var doTogether = [
			RtcMedia._chn_pc_TestNegotiationNeeded( mySelfPromiseData ),
			RtcMedia._chn_pc_SetLocalStream( mySelfPromiseData )
		];

		return Promise.all( doTogether ).then( function() {
			dbg.dbgResolve( 'mySelfPromiseData' );
			return mySelfPromiseData;
		});

	}

	//--------------------------------------------------------
	//  _chn_pc_SetLocalStreamAndTestNegotiationResolve
	//--------------------------------------------------------

	/**
	 * Sets {@link RtcMedia#negotiationNeededTimeOutReject} = false, then calls {@link RtcMedia._chn_pc_SetLocalStreamAndTestNegotiation} 
	 * 
	 * @param  {PromiseData} 	mySelfPromiseData 	The Standard Input (and output) for most Promise so they can be chained together
	 * @return {Promise(PromiseData)} Promise.resolve( mySelfPromiseData ) so they can be chained together
	 * 
	 * @see  RtcMedia._chn_pc_SetLocalStreamAndTestNegotiation
	 * @see  RtcMedia._chn_pc_TestNegotiationNeeded_ResolveOnTimeOut
	 * @see  RtcMedia._chn_pc_SetLocalStreamAndTestNegotiationReject
	 */
	static _chn_pc_SetLocalStreamAndTestNegotiationResolve( mySelfPromiseData ) {
		var self = mySelfPromiseData.self;
		var dbg = new DebugData( RtcMedia.className, self, "_chn_pc_SetLocalStreamAndTestNegotiationResolve" ).dbgDoPd();

		var doTogether = [
			RtcMedia._chn_pc_TestNegotiationNeeded_ResolveOnTimeOut( mySelfPromiseData ),
			RtcMedia._chn_pc_SetLocalStream( mySelfPromiseData )
		];

		return Promise.all( doTogether ).then( function() {
			dbg.dbgResolve( 'mySelfPromiseData' );
			return mySelfPromiseData;
		});

	}


	//--------------------------------------------------------
	//  _chn_pc_SetLocalStreamAndTestNegotiationReject
	//--------------------------------------------------------

	/**
	 * Sets {@link RtcMedia#negotiationNeededTimeOutReject} = true, then calls {@link RtcMedia._chn_pc_SetLocalStreamAndTestNegotiation} 
	 * 
	 * @param  {PromiseData} 	mySelfPromiseData 	The Standard Input (and output) for most Promise so they can be chained together
	 * @return {Promise(PromiseData)} Promise.resolve( mySelfPromiseData ) so they can be chained together
	 * 
	 * @see  RtcMedia._chn_pc_SetLocalStreamAndTestNegotiation
	 * @see  RtcMedia._chn_pc_TestNegotiationNeeded_RejectOnTimeOut
	 * @see  RtcMedia._chn_pc_SetLocalStreamAndTestNegotiationResolve
	 */
	static _chn_pc_SetLocalStreamAndTestNegotiationReject( mySelfPromiseData ) {
		var self = mySelfPromiseData.self;
		var dbg = new DebugData( RtcMedia.className, self, "_chn_pc_SetLocalStreamAndTestNegotiationReject" ).dbgDoPd();

		var doTogether = [
			RtcMedia._chn_pc_TestNegotiationNeeded_RejectOnTimeOut( mySelfPromiseData ),
			RtcMedia._chn_pc_SetLocalStream( mySelfPromiseData )
		];

		return Promise.all( doTogether ).then( function() {
			dbg.dbgResolve( 'mySelfPromiseData' );
			return mySelfPromiseData;
		});

	}





	//===========================================================
	// Create Offer / Answer, SetDescription Wait for Ice (or trickle)
	//===========================================================

	//--------------------------------------------------------
	//  Create OFFER  AND SetLocalDescription  Optionally Ice [ Wait | Trickle ]
	//--------------------------------------------------------


	/**
	 * @param  {PromiseData} 	mySelfPromiseData 	The Standard Input (and output) for most Promise so they can be chained together
	 * @return {Promise(PromiseData)} Promise.resolve( mySelfPromiseData ) so they can be chained together
	 * @private
	 */
	static _chn_pc_CreateOffer_SetLocalDescription( mySelfPromiseData ) {
		var self = mySelfPromiseData.self;
		new DebugData( RtcMedia.className, self, "_chn_pc_CreateOffer_SetLocalDescription" ).dbgDoPd();

		return RtcMedia._chn_pc_CreateOffer( mySelfPromiseData ).then(
			RtcMedia._chn_pc_SetLocalDescription
			);
	}

	/**
	 * @param  {PromiseData} 	mySelfPromiseData 	The Standard Input (and output) for most Promise so they can be chained together
	 * @return {Promise(PromiseData)} Promise.resolve( mySelfPromiseData ) so they can be chained together
	 * @private
	 */
	static _chn_pc_CreateOffer_SetLocalDescription_And_WaitForIceCompleteOrTimeout( mySelfPromiseData ) {
		var self = mySelfPromiseData.self;
		new DebugData( RtcMedia.className, self, "_chn_pc_CreateOffer_SetLocalDescription_And_WaitForIceCompleteOrTimeout" ).dbgDoPd();

		self.trickleIce = false;

		var doTogether = [
			RtcMedia._chn_pc_WaitForIceCompleteOrTimeout( mySelfPromiseData ),
			RtcMedia._chn_pc_CreateOffer_SetLocalDescription( mySelfPromiseData )
		];

		return Promise.all( doTogether ).then( function() {
			return mySelfPromiseData;
		});

	}

	/**
	 * @param  {PromiseData} 	mySelfPromiseData 	The Standard Input (and output) for most Promise so they can be chained together
	 * @return {Promise(PromiseData)} Promise.resolve( mySelfPromiseData ) so they can be chained together
	 * @private
	 */
	static _chn_pc_CreateOffer_SetLocalDescription_And_TrickleIce( mySelfPromiseData ) {
		var self = mySelfPromiseData.self;
		new DebugData( RtcMedia.className, self, "_chn_pc_CreateOffer_SetLocalDescription_And_TrickleIce" ).dbgDoPd();
		self.trickleIce = true;

		return RtcMedia._chn_pc_CreateOffer_SetLocalDescription( mySelfPromiseData );
	}


	//--------------------------------------------------------
	//  Create ANSWER AND SetLocalDescription  Optionally Ice [ Wait | Trickle ]
	//--------------------------------------------------------

	/**
	 * @param  {PromiseData} 	mySelfPromiseData 	The Standard Input (and output) for most Promise so they can be chained together
	 * @return {Promise(PromiseData)} Promise.resolve( mySelfPromiseData ) so they can be chained together
	 * @private
	 */
	static _chn_pc_CreateAnswer_SetLocalDescription( mySelfPromiseData ) {
		var self = mySelfPromiseData.self;
		new DebugData( RtcMedia.className, self, "_chn_pc_CreateAnswer_SetLocalDescription" ).dbgDoPd();

		return RtcMedia._chn_pc_CreateAnswer( mySelfPromiseData ).then(
			RtcMedia._chn_pc_SetLocalDescription
			);
	}

	/**
	 * @param  {PromiseData} 	mySelfPromiseData 	The Standard Input (and output) for most Promise so they can be chained together
	 * @return {Promise(PromiseData)} Promise.resolve( mySelfPromiseData ) so they can be chained together
	 * @private
	 */
	static _chn_pc_CreateAnswer_SetLocalDescription_And_WaitForIceCompleteOrTimeout( mySelfPromiseData ) {
		var self = mySelfPromiseData.self;
		new DebugData( RtcMedia.className, self, "_chn_pc_CreateAnswer_SetLocalDescription_And_WaitForIceCompleteOrTimeout" ).dbgDoPd();
		self.trickleIce = false;
	
		var doTogether = [
			RtcMedia._chn_pc_WaitForIceCompleteOrTimeout( mySelfPromiseData ),
			RtcMedia._chn_pc_CreateAnswer_SetLocalDescription( mySelfPromiseData )
		];

		return Promise.all( doTogether ).then( function() {
			return mySelfPromiseData;
		});

	}

	/**
	 * @param  {PromiseData} 	mySelfPromiseData 	The Standard Input (and output) for most Promise so they can be chained together
	 * @return {Promise(PromiseData)} Promise.resolve( mySelfPromiseData ) so they can be chained together
	 * @private
	 */
	static _chn_pc_CreateAnswer_SetLocalDescription_And_TrickleIce( mySelfPromiseData ) {
		var self = mySelfPromiseData.self;
		new DebugData( RtcMedia.className, self, "_chn_pc_CreateAnswer_SetLocalDescription_And_TrickleIce" ).dbgDoPd();
		self.trickleIce = true;

		return RtcMedia._chn_pc_CreateAnswer_SetLocalDescription( mySelfPromiseData );
	}



	
	//--------------------------------------------------------
	//  _chn_pc_CreateOffer
	//--------------------------------------------------------

	/**
	 * Creates initial Offer SDP without Ice Canadidates.<BR>
	 * 		After this, IceCandidates can be sent individually or wait for all IceCandidates to complete (or use timeout) and send as more complete SDP
	 *
	 * Parameters Used - Should be set before calling.
	 * * self._rtcOfferOptions - {@link RtcMedia#_rtcOfferOptions} must be set before calling this.  If not set, default values will be used.
	 *
	 * Parameters Set via function (or Promise)
	 * * self._jsepRtcDesc = SdpWithoutIceCandidates
	 * 
	 * @param  {PromiseData} mySelfPromiseData Contains the instance to work on.  
	 * 
	 * @return {Promise(PromiseData)} Promise.resolve( mySelfPromiseData ) so they can be chained together
	 *
	 * @see  RtcMedia#_rtcOfferOptions
	 * @see  RtcMedia#setRtcOfferOptions
	 * @see  RtcMedia._chn_pc_CreateAnswer
	 * @see  external:WebRTC.createOffer
	 */
	static _chn_pc_CreateOffer( mySelfPromiseData ) {
		var self = mySelfPromiseData.self;
		var RtcOfferOptions = self._rtcOfferOptions;
		var dbg = new DebugData( RtcMedia.className, self, "_chn_pc_CreateOffer", RtcOfferOptions ).dbgEnterPd( true );

		dbg.dbgMessage( `self._rtcOfferOptions = ${DebugData.JsonTab( self._rtcOfferOptions )}` );

		var promise = new Promise( function(resolve, reject) {

     		dbg.infoMessage( 'peerConn.createOffer' );

			/**
			 * Create an Offer
			 * @function external:WebRTC.createOffer
			 * @param {RtcOfferOptions} RtcOfferOptions RtcOfferOptions - See RFC Spec
			 * @see  {@link https://www.w3.org/TR/2015/WD-webrtc-20150210/#interface-definition|RFC Interface Definition}
			 * @see  {@link https://www.w3.org/TR/2015/WD-webrtc-20150210/#widl-RTCPeerConnection-createOffer-Promise-RTCSessionDescription--RTCOfferOptions-options|RFC 3670createOffer}
			 * @see  RtcMedia._chn_pc_CreateOffer
			 */			
		    self.peerConn.createOffer( RtcOfferOptions ).then(		// Returns Sdp without Ice Candidates
		     	function( SdpWithoutIceCandidates ) {		// successCallback
		     		dbg.setPrintStack( true );
		     		dbg.infoMessage( 'peerConn.createOffer onSuccess', SdpWithoutIceCandidates );
					
					// Set self._jsepRtcDesc so it can be used in another promise.  Return it too for now. 
					self._jsepRtcDesc = SdpWithoutIceCandidates;
		     		dbg.dbgMessage( `Set self._jsepRtcDesc = SdpWithoutIceCandidates` );
		     		dbg.dbgResolve( 'mySelfPromiseData' );
					resolve( mySelfPromiseData );
				}
			).catch(
				function( error ) { 		// errorCallback
		     		dbg.infoMessage( 'peerConn.createOffer onError' );
					dbg.dbgReject( error.stack );
					reject( error );
				}
			);
		});

		dbg.dbgExitPd();
		return promise;
	}


	//--------------------------------------------------------
	//  _chn_pc_CreateAnswer 
	//--------------------------------------------------------

	/**
	 * Creates initial Answer SDP without Ice Canadidates.<BR>
	 * 		After this, IceCandidates can be sent individually or wait for all IceCandidates to complete (or use timeout) and send as more complete SDP
	 * 
	 * @param  {PromiseData} 	mySelfPromiseData 	The Standard Input (and output) for most Promise so they can be chained together
	 * 
	 * @property {NA}  Uses 		Things this function uses other than parameters
	 * @property {object}  Uses.offer  	The sdp offer MUST be set before creating an answer.
	 * 		This can get set using {@link RtcMedia#setRtcOfferOptions}
	 * 
	 * @property {NA}  Sets  	Things this funciton Sets  (Nothing)
	 * @property {object}  Sets._jsepRtcDesc  	self._jsepRtcDesc - private with no public getter
	 * 
	 * @property {NA}  Fires  	Things this funciton Fires (Nothing)
	 * 
	 * @return {Promise(PromiseData)} Promise.resolve( mySelfPromiseData ) so they can be chained together
	 * 
	 * @see  PromiseData
	 * @see  RtcMedia#setLocalSdpOffer
	 * @see  RtcMedia#setLocalSdpAnswer
	 * @see  RtcMedia#setRemoteSdpOffer
	 * @see  RtcMedia#setRemoteSdpAnswer
	 * @see  RtcMedia._chn_pc_CreateOffer
	 * @see  RtcMedia._chn_pc_CreateAnswer
	 * @see  RtcMedia._chn_pc_SetLocalDescription
	 * @see  RtcMedia._chn_pc_SetRemoteDescription
	 * @see  external:WebRTC.createAnswer
	 */
	static _chn_pc_CreateAnswer( mySelfPromiseData ) {
		var self = mySelfPromiseData.self;
		var dbg = new DebugData( RtcMedia.className, self, "_chn_pc_CreateAnswer" ).dbgEnterPd();

		self.peerConn_Init();	// Just returns if there is already a _peerConn - otherwise creates it.

		var promise = new Promise( function(resolve, reject) {

			// peerConn.createAnswer does not have parameters 
     		dbg.infoMessage( 'peerConn.createAnswer' );

			/**
			 * Create an Answer
			 * @function external:WebRTC.createAnswer
			 * @see  {@link https://www.w3.org/TR/2015/WD-webrtc-20150210/#interface-definition|RFC Interface Definition}
			 * @see  {@link https://www.w3.org/TR/2015/WD-webrtc-20150210/#widl-RTCPeerConnection-createAnswer-Promise-RTCSessionDescription|RFC peerConn.createAnswer}
			 * @see  RtcMedia._chn_pc_CreateAnswer
			 */			
		    self.peerConn.createAnswer( ).then(		// Returns Sdp without Ice Candidates
		     	function( SdpWithoutIceCandidates ) {		// successCallback
		     		dbg.setPrintStack( true );
		     		dbg.infoMessage( 'peerConn.createAnswer onSuccess', SdpWithoutIceCandidates );

					// Set self._jsepRtcDesc so it can be used in another promise.  Return it too for now. 
					self._jsepRtcDesc = SdpWithoutIceCandidates;
		     		dbg.dbgMessage( `Set self._jsepRtcDesc = SdpWithoutIceCandidates` );
		     		dbg.dbgResolve( 'mySelfPromiseData' );
					resolve( mySelfPromiseData );
				}
			).catch(
				function( error ) { 		// errorCallback
		     		dbg.infoMessage( 'peerConn.createAnswer onError' );
					dbg.dbgReject( error.stack );
					reject( error );
				}
			);
		});

		dbg.dbgExitPd();
		return promise;
	}





	//--------------------------------------------------------
	//  _chn_pc_SetLocalDescription
	//--------------------------------------------------------

	/**
	 * 
	 * <P>Set before calling
	 * <ul>
	 *	<li> self._jsepRtcDesc - private with no public getter 
	 * </ul>
	 * <P>Set by method
	 * <ul>
	 *	<li> ??
	 * </ul>
	 * 
	 * @param  {PromiseData} 	mySelfPromiseData 	The Standard Input (and output) for most Promise so they can be chained together
	 * 
	 * @property {NA}  Uses 		Things this function uses other than parameters
	 * @property {object}  Uses._jsepRtcDesc  	self._jsepRtcDesc - private with no public getter.
	 * 		<BR>This is set by {@link RtcMedia._chn_pc_CreateAnswer} or 
	 * 		{@link RtcMedia#setLocalSdpOffer} or
	 * 		{@link RtcMedia#setLocalSdpAnswer}
	 * 		
	 * @property {NA}  Sets  	Things this funciton Sets  (Nothing)
	 * @property {object}  Sets._jsepRtcDesc  	self._jsepRtcDesc - private with no public getter
	 * 
	 * @property {NA}  Fires  	Things this funciton Fires (Nothing)
	 * 
	 * @return {Promise(PromiseData)} Promise.resolve( mySelfPromiseData ) so they can be chained together
	 * 
	 * @see  external:WebRTC.setLocalDescription
	 */
	static _chn_pc_SetLocalDescription( mySelfPromiseData ) {
		var self = mySelfPromiseData.self;
		var RTCSessionDescriptionInit = self._jsepRtcDesc;

		var dbg = new DebugData( RtcMedia.className, self, "_chn_pc_SetLocalDescription", RTCSessionDescriptionInit ).dbgEnterPd( true );

		var promise = new Promise( function(resolve, reject) {
     		dbg.infoMessage( 'peerConn.setLocalDescription' );

			/**
			 * Set Local Media
			 * @param {RTCSessionDescriptionInit} RTCSessionDescriptionInit Stuff needed to set Local Description 
			 * @function external:WebRTC.setLocalDescription
			 * @see  {@link https://www.w3.org/TR/2015/WD-webrtc-20150210/#interface-definition|RFC Interface Definition}
			 * @see  {@link https://www.w3.org/TR/2015/WD-webrtc-20150210/#widl-RTCPeerConnection-setLocalDescription-Promise-void--RTCSessionDescription-description|RFC peerConn.setLocalDescription}
			 * @see  RtcMedia._chn_pc_SetLocalDescription
			 */
		    self.peerConn.setLocalDescription( RTCSessionDescriptionInit ).then(		// Returns void - nothing
		     	function( ) {		// successCallback
		     		dbg.infoMessage( 'peerConn.setLocalDescription onSuccess', self.peerConn.localDescription );
		     		dbg.dbgResolve( 'mySelfPromiseData' );
					resolve( mySelfPromiseData );
				}
			).catch(
				function( error ) { 		// errorCallback
		     		dbg.infoMessage( 'peerConn.setLocalDescription onError' );
					dbg.dbgReject( error.stack );
					reject( error );
				}
			);
		});

		dbg.dbgExitPd();
		return promise;
	}



	//--------------------------------------------------------
	//  _chn_pc_WaitForIceCompleteOrTimeout 
	//--------------------------------------------------------

	/**
	 * This is used to wait until IceGathering is completed OR timeout is triggered.  
	 * 		To determine if timeout or not, the next thing in the chain should look at the value of mySelfPromiseData.data
	 * 		
	 * @param  {PromiseData} 	mySelfPromiseData 	The Standard Input (and output) for most Promise so they can be chained together
	 * 
	 * @return {Promise(PromiseData)} Promise.resolve( mySelfPromiseData ) so they can be chained together
	 */
	static _chn_pc_WaitForIceCompleteOrTimeout( mySelfPromiseData ) {	
		var self = mySelfPromiseData.self;
		var dbg = new DebugData( RtcMedia.className, self, "_chn_pc_WaitForIceCompleteOrTimeout" ).dbgEnterPd();

		var promise = new Promise( function(resolve, reject) {
			self.tmpCB.onicecandidate_resolve = resolve;		// Make sure it returns mySelfPromiseData !!
			self.tmpCB.onicecandidate_reject = reject;
        });

    	var TimeOutResolveOrRecject = function() {
			dbg.dbgMessage( "Timed Out -> Resolve ");
     		dbg.dbgResolve( 'mySelfPromiseData' );
     		dbg.infoMessage( 'peerConn.onicecandidate_resolve Timeout');
	    	mySelfPromiseData.data = 'timeout';
			self.tmpCB.onicecandidate_resolve( mySelfPromiseData );
    	};

    	// Set a timeout
		// Keep Timeout AFTER setting the promise BECAUSE we need to make sure reslove/reject are set before they can be triggered.
    	setTimeout( TimeOutResolveOrRecject, self.iceCandidatesTimeOutMs );

		dbg.dbgExitPd();
        return promise;
    }



	//--------------------------------------------------------
	//  _chn_pc_TestNegotiationNeeded 
	//--------------------------------------------------------

	/**
	 * This is a tricky one.  Negotiation may NOT be needed, so we so this should be executed WITH XXXXX to make sure they both happen
	 *
	 * @todo Make sure this gets used in parrellel with RtcMedia._chn_pc_SetLocalStream
	 * 
	 * @param  {PromiseData} 	mySelfPromiseData 	The Standard Input (and output) for most Promise so they can be chained together
	 * 
	 * 
	 * @property {NA}  Uses 		Things this function uses other than parameters
	 * @property {number}  Uses.negotiationNeededTimeOutMs  	self.negotiationNeededTimeOutMs
	 * 
	 * @property {NA}  Sets  	Things this funciton Sets  (Nothing)
	 * @property {NA}  Fires  	Things this funciton Fires (Nothing)
	 * 
	 * @return {Promise(PromiseData)} Promise.resolve( mySelfPromiseData ) so they can be chained together
	 * @see  external:WebRTC.onnegotiationneeded
	 */
	static _chn_pc_TestNegotiationNeeded( mySelfPromiseData ) {
		var self = mySelfPromiseData.self;
		var dbg = new DebugData( RtcMedia.className, self, "_chn_pc_TestNegotiationNeeded" ).dbgEnterPd();

		self.peerConn_Init();	// Just returns if there is already a _peerConn - otherwise creates it.

        var promise = new Promise( function(resolve, reject) {
        	self.tmpCB.onnegotiationneeded_resolve = resolve;		// Returns mySelfPromiseData
			self.tmpCB.onnegotiationneeded_reject = reject;
        });
	

     //    var promise = new Promise( function(resolve) {

     //        self.tmpCB.onnegotiationneeded = function( ReturnValue ) {			// Set Temp Callback reference
     //            self.tmpCB.onnegotiationneeded = function() {}; 	// Remove Temp Callback reference after triggered

     //            if ( ReturnValue === 'timeout' ) { 
	    // 			dbg.dbgMessage( "Timed Out -> Resolve ");
		   //   		dbg.dbgResolve( 'mySelfPromiseData' );
	    //             resolve( mySelfPromiseData );
     //            } else {
	    // 			dbg.dbgMessage( "From Negotiation ");
		   //   		dbg.dbgResolve( 'mySelfPromiseData' );
	    //             // resolve( mySelfPromiseData );
	    //             resolve( 'foo' );
     //            }
     //    	};
     //    });

    	// setTimeout( function() { this.tmpCB.onnegotiationneeded( 'timeout' ); }, self.negotiationNeededTimeOutMs );


  		// Set a timeout
		// Keep Timeout AFTER setting the promise BECAUSE we need to make sure reslove/reject are set before they can be triggered.

    	var TimeOutResolveOrRecject = function() {
    		if ( self.negotiationNeededTimeOutReject === true ) {
		    	var timeOutError = new Error( `_chn_pc_TestNegotiationNeeded:TimeOutResolveOrRecject timeout after ${self.negotiationNeededTimeOutMs} ` );
     			dbg.infoMessage( 'peerConn.onnegotiationneeded_reject Timeout');
    			dbg.dbgMessage( "Timed Out -> Reject ");
	     		dbg.dbgReject( timeOutError );
    			self.tmpCB.onnegotiationneeded_reject( timeOutError );
    		} else {
     			dbg.infoMessage( 'peerConn.onnegotiationneeded_resolve Timeout');
    			dbg.dbgMessage( "Timed Out -> Resolve ");
	     		dbg.dbgResolve( 'mySelfPromiseData' );
    			self.tmpCB.onnegotiationneeded_resolve( mySelfPromiseData );
    		}
    	};

    	setTimeout( TimeOutResolveOrRecject, self.negotiationNeededTimeOutMs );

		dbg.dbgExitPd();
        return promise;
    }

    /**
	 * Sets negotiationNeededTimeOutReject = false, then calls {@link _chn_pc_TestNegotiationNeeded}
	 * @param  {PromiseData} 	mySelfPromiseData 	The Standard Input (and output) for most Promise so they can be chained together
	 * 
	 * @return {Promise(PromiseData)} Promise.resolve( mySelfPromiseData ) so they can be chained together
	 * @see  RtcMedia._chn_pc_TestNegotiationNeeded
     */
	static _chn_pc_TestNegotiationNeeded_ResolveOnTimeOut( mySelfPromiseData ) {
		var self = mySelfPromiseData.self;
		new DebugData( RtcMedia.className, self, "_chn_pc_TestNegotiationNeeded_ResolveOnTimeOut" ).dbgDoPd();

		self.negotiationNeededTimeOutReject = false;
		return RtcMedia._chn_pc_TestNegotiationNeeded( mySelfPromiseData );
	}


    /**
	 * Sets negotiationNeededTimeOutReject = true, then calls {@link _chn_pc_TestNegotiationNeeded}
	 * @param  {PromiseData} 	mySelfPromiseData 	The Standard Input (and output) for most Promise so they can be chained together
	 * 
	 * @return {Promise(PromiseData)} Promise.resolve( mySelfPromiseData ) so they can be chained together
	 * @see  RtcMedia._chn_pc_TestNegotiationNeeded
     */
	static _chn_pc_TestNegotiationNeeded_RejectOnTimeOut( mySelfPromiseData ) {
		var self = mySelfPromiseData.self;
		new DebugData( RtcMedia.className, self, "_chn_pc_TestNegotiationNeeded_RejectOnTimeOut" ).dbgDoPd();
		self.negotiationNeededTimeOutReject = true;
		return RtcMedia._chn_pc_TestNegotiationNeeded( mySelfPromiseData );
	}












	//--------------------------------------------------------
	//  setLocalSdpOffer
	//--------------------------------------------------------

	/**
	 * @param  {PromiseData} 	mySelfPromiseData 	The Standard Input (and output) for most Promise so they can be chained together
	 * 
	 * @return {Promise(PromiseData)} Promise.resolve( mySelfPromiseData ) so they can be chained together
	 */
	setLocalSdpOffer( LocalSdpString ) {
		var dbg = new DebugData( RtcMedia.className, this, "setLocalSdpOffer", LocalSdpString ).dbgEnter( true );

		var rtcDescInit = {
	    	type: "offer", 			// "offer", "answer"
		    sdp: LocalSdpString
		};

		this._jsepRtcDesc = new RTCSessionDescription( rtcDescInit );

		dbg.logMessage( `Set this._jsepRtcDesc = ${this._jsepRtcDesc}`);
		dbg.dbgExitPd();
		return RtcMedia._chn_pc_SetLocalDescription( this.mySelfPromiseData );
	}

	//--------------------------------------------------------
	//  setLocalSdpAnswer
	//--------------------------------------------------------

	/**
	 * @param  {PromiseData} 	mySelfPromiseData 	The Standard Input (and output) for most Promise so they can be chained together
	 * 
	 * @return {Promise(PromiseData)} Promise.resolve( mySelfPromiseData ) so they can be chained together
	 */
	setLocalSdpAnswer( LocalSdpString ) {
		var dbg = new DebugData( RtcMedia.className, this, "setLocalSdpAnswer", LocalSdpString ).dbgEnter( true );

		var rtcDescInit = {
	    	type: "answer", 			// "offer", "answer"
		    sdp: LocalSdpString
		};

		this._jsepRtcDesc = new RTCSessionDescription( rtcDescInit );

		dbg.logMessage( `Set this._jsepRtcDesc = ${this._jsepRtcDesc}`);
		dbg.dbgExitPd();
		return RtcMedia._chn_pc_SetLocalDescription( this.mySelfPromiseData );
	}




	//--------------------------------------------------------
	//  _pcAddLocalStream  -- this.peerConn.addStream
	//--------------------------------------------------------

	/**
	 * Adds a MediaStream.  NOTE: This means there could be more than 1.  
	 * 		If you want to make sure there is only one use {@link RtcMedia#_pcSetLocalStream}.
	 * 		<BR> Adding streams to an existing call will trigger a Negotiation needed event.
	 * 		
	 * @param  {MediaStream} 	StreamToAdd 	A MediaStream gotten by any means.
	 * @private
	 * @return {void}
	 * @see  RtcMedia#_pcSetLocalStream
	 */
	_pcAddLocalStream( StreamToAdd ) {		// Returns Nothing
		var dbg = new DebugData( RtcMedia.className, this, "_pcAddLocalStream", StreamToAdd ).dbgEnter( true );
		var theError;
		var errText;

		if ( StreamToAdd.toString() !== '[object MediaStream]' ) {
			errText = `RtcMedia._pcAddLocalStream( StreamToAdd ) MUST provide a MediaStream.  You provided ${DebugData.JsonTab( StreamToAdd )}`;
			theError = new Error( errText );
			dbg.errorMessage( errText, theError.stack );
			throw( theError );
		}

		if ( StreamToAdd.active === false ) {
			errText = `RtcMedia._pcAddLocalStream( StreamToAdd ) SHOULD provide a MediaStream that is 'active'.  You provided one where 'active = false'`;
			// theError = new Error( errText );
			dbg.warnMessage( errText, StreamToAdd );
			// throw( theError );
		}

		this.publishStream = StreamToAdd;

		this.peerConn_Init();	// Just returns if there is already a _peerConn - otherwise creates it.

		/**
		 * Add a Stream
		 * @param {MediaStream} StreamToAdd MediaStream to add 
		 * @function external:WebRTC.addStream
		 * @see  {@link https://www.w3.org/TR/2015/WD-webrtc-20150210/#interface-definition|RFC Interface Definition}
		 * @see  {@link https://www.w3.org/TR/2015/WD-webrtc-20150210/#widl-RTCPeerConnection-addStream-void-MediaStream-stream|RFC peerConn.addStream}
		 * @see  RtcMedia#_pcAddLocalStream
		 */
		try { 
			this.peerConn.addStream(StreamToAdd);
     		dbg.infoMessage( 'peerConn.addStream', StreamToAdd );

		} catch (theError ) {
			dbg.errorMessage( theError.stack );
			throw( theError );
		}

		dbg.logMessage( `Did this.peerConn.addStream(StreamToAdd)`);
		dbg.dbgExit( );
	}


	//--------------------------------------------------------
	//  _pcRemoveLocalStream  -- this.peerConn.removeStream
	//--------------------------------------------------------
	
	/**
	 * Deletes the MediaStream IF present
	 * 
	 * @param  {MediaStream} 	StreamToRemove 	A MediaStream gotten by any means.
	 * @private
	 * @return {void}
	 */
	_pcRemoveLocalStream( StreamToRemove ) {		// Returns Nothing
		var dbg = new DebugData( RtcMedia.className, this, "_pcRemoveLocalStream", StreamToRemove ).dbgEnter( true );
		var theError;
		var errText;

		if ( StreamToRemove.toString() !== '[object MediaStream]' ) {
			errText = `RtcMedia._pcRemoveLocalStream( StreamToRemove ) MUST provide a MediaStream.  You provided ${DebugData.JsonTab( StreamToRemove )}`;
			theError = new Error( errText );
			dbg.warnMessage( errText, theError.stack );
			// throw( theError );
		}
		
		/**
		 * Remove a Stream from the peerConn
		 * @param {MediaStream} StreamToRemove MediaStream to remove
		 * @function external:WebRTC.removeStream
		 * @see  {@link https://www.w3.org/TR/2015/WD-webrtc-20150210/#interface-definition|RFC Interface Definition}
		 * @see  {@link https://www.w3.org/TR/2015/WD-webrtc-20150210/#widl-RTCPeerConnection-removeStream-void-MediaStream-stream|RFC peerConn.removeStream}
		 * @see  RtcMedia#_pcRemoveLocalStream
		 */
		if ( this.peerConn.signalingState !== 'closed' ) {

			try { 
				this.peerConn.removeStream(StreamToRemove);
	     		dbg.infoMessage( 'peerConn.removeStream', StreamToRemove );
			} catch (theError ) {
				dbg.errorMessage( theError.stack );
				throw( theError );
			}
		}

		dbg.dbgExit( );
	}



	//--------------------------------------------------------
	//  _pcSetLocalStream 
	//--------------------------------------------------------

	/**
	 * Sets only 1 MediaStream and makes sure there is only one by deleting others if needed.
	 * 
	 * @param  {MediaStream} 	StreamToSet 	A MediaStream gotten by any means.
	 * @private
	 * @return {void}
	 */
	_pcSetLocalStream( StreamToSet ) {		// Returns Nothing
		var dbg = new DebugData( RtcMedia.className, this, "_pcSetLocalStream", StreamToSet ).dbgEnter( true );
		
		this.peerConn_Init();	// Just returns if there is already a _peerConn - otherwise creates it.

		// 1) Remove other MediaStream to make sure we only have 1 stream when done.
		this.peerConn.getLocalStreams().forEach( 
			function(StreamToRemove) { 
				this._pcRemoveLocalStream(StreamToRemove);
			}
		);

		// 2) Add this as the only MediaStream
		this._pcAddLocalStream( StreamToSet );
		dbg.dbgExit( );
	}





	//###########################################################
	// R E M O T E   PeerConn Related Things
	//###########################################################
	// static 	_chn_pc_SetRemoteDescription( mySelfPromiseData )		-> Promise( mySelfPromiseData )
	// 			 	setRemoteSdpAnswer( RemoteSdpString )		-> Promise( mySelfPromiseData )
	// 			 	setRemoteSdpOffer( RemoteSdpString )		-> Promise( mySelfPromiseData )
	// 			 	setRemoteSdpPreAnswer( RemoteSdpString )	-> Promise( mySelfPromiseData )
	//
	//			peerConn_AddIceCandidate( IceCandidate )				-> Promise( mySelfPromiseData )
	//
	//===========================================================



	//--------------------------------------------------------
	//  _chn_pc_SetRemoteDescription  -- this.peerConn.setRemoteDescription
	//--------------------------------------------------------
	// @param RTCSessionDescriptionInit: (M)RTCSessionDescriptionInit
	// @return Promise
	//--------------------------------------------------------

	/**
	 * Gets JSEP RtcDescription set by some other function and does self.peerConn.setRemoteDescription.
	 * 		This MAY cause a NegotiationNeeded event to be triggered. 
	 * @requires Requires that this._jsepRtcDesc has been set previously.
	 * @return {Promise} 	Promise -> () - No return value fromo Promise.resolve()
	 * @see RtcMedia#setRemoteSdpAnswer
	 * @see RtcMedia#setRemoteSdpOffer
	 * @see RtcMedia#setRemoteSdpPreAnswer
	 * @see external:WebRTC.setRemoteDescription
	 */
	static _chn_pc_SetRemoteDescription( mySelfPromiseData ) {
		var self = mySelfPromiseData.self;

		// this._jsepRtcDesc should be set by setRemoteSdpAnswer, setRemoteSdpOffer or setRemoteSdpPreAnswer
        var RTCSessionDescriptionInit = self._jsepRtcDesc;

		var dbg = new DebugData( RtcMedia.className, self, "_chn_pc_SetRemoteDescription", RTCSessionDescriptionInit ).dbgEnterPd( true );


		self.peerConn_Init();	// Just returns if there is already a _peerConn - otherwise creates it.

		var promise = new Promise( function(resolve, reject) {

			/**
			 * Set Remote Description
			 * @function external:WebRTC.setRemoteDescription
			 * @param {RTCSessionDescriptionInit} RTCSessionDescriptionInit RTCSessionDescriptionInit - See RFC Spec
			 * @see  {@link https://www.w3.org/TR/2015/WD-webrtc-20150210/#interface-definition|RFC Interface Definition}
			 * @see  {@link https://www.w3.org/TR/2015/WD-webrtc-20150210/#widl-RTCPeerConnection-setRemoteDescription-Promise-void--RTCSessionDescription-description|RFC peerConn.setRemoteDescription}
			 * @see  RtcMedia._chn_pc_SetRemoteDescription
			 */			
		    self.peerConn.setRemoteDescription( RTCSessionDescriptionInit ).then(		// Returns void - nothing
		     	function( ) {		// successCallback
		     		dbg.infoMessage( 'peerConn.setRemoteDescription onSuccess', self.peerConn.remoteDescription );

		        	if ( !! self.remoteVideoElement ) {
			        	dbg.infoMessage( "Connecting self.remoteVideoElement.srcObject = self.remoteStream.");
			        	self.remoteVideoElement.srcObject = self.remoteStream;
		        	}

		     		dbg.dbgResolve( 'mySelfPromiseData' );
					resolve( mySelfPromiseData );
				}
			).catch(
				function( error ) { 		// errorCallback
		     		dbg.infoMessage( 'peerConn.setRemoteDescription onError');
					dbg.dbgReject( error );
					reject( error );
				}
			);
		});

		dbg.dbgExitPd( );
		return promise;
	}






	//--------------------------------------------------------
	//  setRemoteSdpAnswer
	//--------------------------------------------------------

	/**
	 * Convenience Method for {@link RtcMedia#_chn_pc_SetRemoteDescription }
	 * @param {spd}	RemoteSdpString SDP String to use.
	 * @see RtcMedia#_chn_pc_SetRemoteDescription
	 * @see RtcMedia#setRemoteSdpOffer
	 * @see RtcMedia#setRemoteSdpPreAnswer
	 * @see RtcMedia#setLocalSdpOffer
	 * @see RtcMedia#setLocalSdpAnswer
	 * @see RtcMedia#setRemoteSdpAnswer
	 * @return {Promise} 	Promise -> () from {@link RtcMedia#_chn_pc_SetRemoteDescription} - No return value from Promise.resolve()
	 */
	setRemoteSdpAnswer( RemoteSdpString ) {
		var dbg = new DebugData( RtcMedia.className, this, "setRemoteSdpAnswer", RemoteSdpString ).dbgEnter( true );

		var rtcDescInit = {
	    	type: "answer", 			// "offer", "pranswer", "answer"
		    sdp: RemoteSdpString
		};

		this._jsepRtcDesc = new RTCSessionDescription( rtcDescInit );

		dbg.dbgExitPd(); 
		return RtcMedia._chn_pc_SetRemoteDescription( this.mySelfPromiseData );
	}

	//--------------------------------------------------------
	//  setRemoteSdpOffer
	//--------------------------------------------------------


	/**
	 * Set Remote SDP with answer
	 * @param {string} RemoteSdpString Remote SDP String from NetComposer
	 */
	setRemoteSdpOffer( RemoteSdpString ) {
		var dbg = new DebugData( RtcMedia.className, this, "setRemoteSdpOffer", RemoteSdpString ).dbgEnter( true );

		var rtcDescInit = {
	    	type: "offer", 			// "offer", "pranswer", "answer"
		    sdp: RemoteSdpString
		};

		this._jsepRtcDesc = new RTCSessionDescription( rtcDescInit );

		dbg.dbgExitPd(); 
		return RtcMedia._chn_pc_SetRemoteDescription( this.mySelfPromiseData );
	}


	//--------------------------------------------------------
	//  setRemoteSdpPreAnswer
	//--------------------------------------------------------

	/**
	 * Set Remote SDP with pranser
	 * @param {string} RemoteSdpString Remote SDP String from NetComposer
	 */
	setRemoteSdpPreAnswer( RemoteSdpString ) {
		var dbg = new DebugData( RtcMedia.className, this, "setRemoteSdpPreAnswer", RemoteSdpString ).dbgEnter( true );

		var rtcDescInit = {
	    	type: "pranswer", 			// "offer", "pranswer", "answer"
		    sdp: RemoteSdpString
		};

		this._jsepRtcDesc = new RTCSessionDescription( rtcDescInit );

		dbg.dbgExitPd(); 
		return RtcMedia._chn_pc_SetRemoteDescription( this.mySelfPromiseData );
	}



	//--------------------------------------------------------
	//  peerConn_AddIceCandidate  -- this.peerConn.addIceCandidate
	//--------------------------------------------------------

	/**
	 * Used when Remote parties send trickle Ice Candidates
	 * 
	 * @param  {RTCIceCandidateInit} 	RTCIceCandidateInit 	An Ice Candidate from remotes site
	 * 
	 * @return {Promise(PromiseData)} Promise.resolve( mySelfPromiseData ) so they can be chained together
	 * @see  external:WebRTC.addIceCandidate
	 */
	peerConn_AddIceCandidate( RTCIceCandidateInit ) {
		var dbg = new DebugData( RtcMedia.className, this, "peerConn_AddIceCandidate", RTCIceCandidateInit ).dbgEnter( true );

		var self = this;

		var promise = new Promise( function(resolve, reject) {
			dbg.infoMessage( 'peerConn.addIceCandidate', RTCIceCandidateInit );

			/**
			 * Add Ice Candidate
			 * @function external:WebRTC.addIceCandidate
			 * @param {RTCIceCandidateInit} RTCIceCandidateInit RTCIceCandidateInit - See RFC Spec
			 * @see  {@link https://www.w3.org/TR/2015/WD-webrtc-20150210/#interface-definition|RFC Interface Definition}
			 * @see  {@link https://www.w3.org/TR/2015/WD-webrtc-20150210/#widl-RTCPeerConnection-addIceCandidate-Promise-void--RTCIceCandidate-candidate|RFC peerConn.addIceCandidate}
			 * @see  RtcMedia.peerConn_AddIceCandidate
			 */			
		    self.peerConn.addIceCandidate( RTCIceCandidateInit ).then(		// Returns void - nothing
		     	function( ) {		// successCallback
					dbg.infoMessage( 'peerConn.addIceCandidate onSuccess' );
					resolve( self.mySelfPromiseData );
				}
			).catch(
				function( error ) { 		// errorCallback
		     		dbg.infoMessage( 'peerConn.addIceCandidate onError');
					dbg.errorMessage( error );
					reject( error );
				}
			);
		});

		dbg.dbgExitPd(); 
		return promise;
	}








	//###########################################################
	// M O R E    Things
	//###########################################################
	// static 	stuff
	// 			foo
	//===========================================================







































	//--------------------------------------------------------
	//  getPeerConnStatesObject  
	//--------------------------------------------------------
	static getPeerConnStatesObject( TheRTCPeerConnection ) {
		return {
			PeerConn_States: {
				signalingState: TheRTCPeerConnection.signalingState,
				iceGatheringState: TheRTCPeerConnection.iceGatheringState,
				iceConnectionState: TheRTCPeerConnection.iceConnectionState
			}
		};
	}




	//##########################################################################
	// Peer Connection Wrapper Functions
	//  - new RTCPeerConnection() 			= peerConn_Init(..)
	//  - _peerConn.close 					= closePeerConn()
	//  - _peerConn.createOffer 				= _chn_pc_CreateOffer(..)
	//  - _peerConn.createAnswer				= _chn_pc_CreateAnswer(..)
	//  - _peerConn.setLocalDescription 		= _chn_pc_SetLocalDescription(..)
	// 											-- setLocalSdpOffer( SdpString )
	// 											-- setLocalSdpAnswer( SdpString )
	// 											-- getLocalDescription()
	//  - _peerConn.setRemoteDescription		= _chn_pc_SetRemoteDescription(..)
	// 											-- setRemoteSdpOffer( SdpString )
	// 											-- setRemoteSdpAnswer( SdpString )
	// 											-- setRemoteSdpPreAnswer( SdpString )
	// 											-- getRemoteDescription()
	//  - _peerConn.addIceCandidate 			-- peerConn_AddIceCandidate(..)
	//  - _peerConn.addStream 				= _pcAddLocalStream(..)
	//  - _peerConn.removeStream 			= _pcRemoveLocalStream(..)
	//
	//  Multi-Function 
	//  - peerConn_AddLocalStream_CreateOffer_SetLocalDescription_WaitForIce

	//##########################################################################

	//--------------------------------------------------------
	//  peerConn_Init  
	//--------------------------------------------------------

	/**
	 * Checks to see if there is a PeerConnection set up.
	 * * If YES - then this just returns.  
	 *    This is used often throughout the code as a check and if needed to actually create the PeerConnection
	 * * IF the PeerConnection is NOT already created, this will create it.
	 *
	 * This way we can use it as a tester AND an init from many functions to make sure we have 
	 *    a valid peerConn when we need it.
	 * 	
	 * @param  {(RTCConfiguration | empty)} RTCConfiguration If RTCConfiguration is sent, 
	 * 		it will get used to configure the PeerConnection.  If empty, we use default values.
	 * 	
	 * @return {void}
	 *
	 * @see  RtcMedia#_createPeerConnection
	 * @see  {@link https://www.w3.org/TR/webrtc/#rtcconfiguration-dictionary|WebRTC Spec}
	 */
	peerConn_Init( RTCConfiguration  ) {
		this._createPeerConnection( RTCConfiguration );
	}

	//--------------------------------------------------------
	//  closePeerConn  -- this.peerConn.close
	//--------------------------------------------------------
	// Closes all the Streams and Tracks held by this Instance PLUS
	//    Streams in the _peerConn.
	// 
	// @param none 
	// @return void / nothing
	//--------------------------------------------------------

	/**
	 * Close everything, including:
	 *
	 * * closeLocalStreams {@link RtcMedia#closeLocalStreams}
	 * * closePeerConn {@link RtcMedia#closePeerConn}
	 * 
	 * @return {void}
	 */
	closeAll() {
		var dbg = new DebugData( RtcMedia.className, this, "closeAll" ).dbgEnter( );
		
		this.closeLocalStreams();
		this.closePeerConn();

		this._closed = true;

		dbg.dbgExit(); 
	}

	/**
	 * Close all local Streams
	 * 
	 * * RtcMedia._streamTracksDisableStopRemove on this._localPreviousStream
	 * * RtcMedia._streamTracksDisableStopRemove on this._localCurrentStream
	 * * RtcMedia._streamTracksDisableStopRemove on this.peerConn.getLocalStreams
	 * * RtcMedia._streamTracksDisableStopRemove on this.peerConn.getRemoteStreams
	 * * this.localVideoElement.srcObject = null 
	 * * this.remoteVideoElement.srcObject = null
	 * 
	 * @return {void}
	 */
	closeLocalStreams() {
		var dbg = new DebugData( RtcMedia.className, this, "closeStreams" ).dbgEnter( );

		// 1) Close _localPreviousStream 
		if ( !! this._localPreviousStream ) {
			dbg.dbgMessage( 'Closing _localPreviousStream');
			RtcMedia._streamTracksDisableStopRemove( this._localPreviousStream );
			this._localPreviousStream = null;
		}

		// 2) Close _localCurrentStream
		if ( !! this._localCurrentStream ) {
			dbg.dbgMessage( 'Closing _localCurrentStream');
			RtcMedia._streamTracksDisableStopRemove( this._localCurrentStream );
			this._localCurrentStream = null;
		}

		// this._publishStream MAY be the same as this._localCurrentStream, but not always.
		if ( !! this._publishStream ) {
			dbg.dbgMessage( 'Closing _publishStream');
			RtcMedia._streamTracksDisableStopRemove( this._publishStream );
			this._publishStream = null;
			delete this._publishStream;
		}

		if ( !! this.localVideoElement ) {
			dbg.dbgMessage( 'Setting this.localVideoElement.srcObject = null');
			this.localVideoElement.srcObject = null;
		}

		if ( !! this.remoteVideoElement ) {
			dbg.dbgMessage( 'Setting this.remoteVideoElement.srcObject = null');
			this.remoteVideoElement.srcObject = null;
		}

		dbg.dbgExit(); 
	}

	/**
	 * Closes the RTCPeerConnection (peerConn) 
	 * 
	 * * RtcMedia._streamTracksDisableStopRemove on this.peerConn.getLocalStreams
	 * * RtcMedia._streamTracksDisableStopRemove on this.peerConn.getRemoteStreams
	 * * this.peerConn.close
	 *
	 * @return {void}
	 *
	 * @see  RtcMedia._streamTracksDisableStopRemove
	 */
	closePeerConn( ) {		// Returns Nothing
		var dbg = new DebugData( RtcMedia.className, this, "closePeerConn" ).dbgEnter( );


		if (  !! this.peerConn ) {


			// 3) Close ALL Local Streams
			dbg.dbgMessage( 'Closing peerConn Local and Remote Streams');

			// dbg.dbgMessage( 'RtcMedia: closePeerConn: Closing PeerConn Local Streams ' ); 
			this.peerConn.getLocalStreams().forEach(
				function( stream ) { RtcMedia._streamTracksDisableStopRemove( stream ); }
			);
			
			// 4) Close ALL Remote Streams
			// dbg.dbgMessage( 'RtcMedia: closePeerConn: Closing PeerConn Remote Streams' ); 
			this.peerConn.getRemoteStreams().forEach(
				function( stream ) { RtcMedia._streamTracksDisableStopRemove( stream ); }
			);

			dbg.dbgMessage( 'Closing peerConn');
			dbg.infoMessage( 'peerConn.close');

			// 5) Close PeerConn
			this.peerConn.close();


			this._peerConn = null;

			delete this._peerConn;
		}


		dbg.dbgExit(); 
	}




	//==========================================================================
	// Peer Connection  Private Functions 
	//==========================================================================


	/**
	 * Creates and sets up a PeerConnection.
	 * 
	 * @param  {RTCConfiguration}   RTCConfiguration 	Configuration data
	 * @private
	 */
	_createPeerConnection( RTCConfiguration  ) {

		if ( ( !! this.peerConn ) && ( this.peerConn.signalingState !== 'closed' ) ) {
			return; 	// Should only be done 1 time;
		}

		DebugData.suppressArgsWarn( true );
		var dbg = new DebugData( RtcMedia.className, this, "_createPeerConnection", RTCConfiguration ).dbgEnter( true );
		DebugData.suppressArgsWarnRevert();

		var self = this;

		var fnRTCConfiguration = ( !!RTCConfiguration ) ? RTCConfiguration : RtcMedia.defaultValues.rtcConfiguration;
	  		
		this._peerConn = new RTCPeerConnection( fnRTCConfiguration );

		this._peerConn.rtcInstance = this;
		
		dbg.infoMessage( 'peerConn - created ' );
		
		//------------------------------------
		//  onnegotiationneeded
		//------------------------------------
		// RFC: WD-webrtc-20160531: The browser wishes to inform the application that session 
		//   negotiation needs to be done (i.e. a 
		//   __createOffer__ call followed by __setLocalDescription__).

		/**
		 * The browser wishes to inform the application that session negotiation needs to be done at some point in the near future.
		 * 		This is usually triggered by setLocalDescription
		 * @param  {event} Event 	Triggered when ...
		 * @function external:WebRTC.onnegotiationneeded
		 * @see  {@link https://www.w3.org/TR/2015/WD-webrtc-20150210/#interface-definition|RFC Interface Definition}
		 * @see  https://www.w3.org/TR/2015/WD-webrtc-20150210/#event-negotiation
		 * @see  {@link https://www.w3.org/TR/2015/WD-webrtc-20150210/#widl-RTCPeerConnection-onnegotiationneeded|RFC peerConn.onnegotiationneeded}
		 */
		this.peerConn.onnegotiationneeded = function(event) { 
			var dbg = new DebugData( RtcMedia.className, this.rtcInstance, "_peerConn.onnegotiationneeded", event ).dbgEnter( true );
	
			dbg.infoMessage( 'peerConn.onnegotiationneeded', event );

			this.rtcInstance.dispatchEvent( RtcMedia.eventNames.onPeerConn_NegotiationNeeded, event );

			// this.rtcInstance.tmpCB.onnegotiationneeded( true );
			dbg.logMessage( 'Calling -> this.rtcInstance.tmpCB.onnegotiationneeded_resolve( this.rtcInstance.mySelfPromiseData ) ');
			this.rtcInstance.tmpCB.onnegotiationneeded_resolve( this.rtcInstance.mySelfPromiseData );

			dbg.dbgExit(); 
		};


		//------------------------------------
		//  onicecandidate
		//------------------------------------
		//  This triggers a promise !!!
		// 

		/**
		 * An Ice Candidate is ready
		 * @param  {event} 	Event 
		 * @function external:WebRTC.onicecandidate
		 * @see  {@link https://www.w3.org/TR/2015/WD-webrtc-20150210/#interface-definition|RFC Interface Definition}
		 * @see  {@link https://www.w3.org/TR/2015/WD-webrtc-20150210/#widl-RTCPeerConnection-onicecandidate|RFC peerConn.onicecandidate}
		 * 
		 */
		this.peerConn.onicecandidate = function(event) {
			var dbg = new DebugData( RtcMedia.className, this.rtcInstance, "_peerConn.onicecandidate", event ).dbgEnter( true );
			dbg.infoMessage( 'peerConn.onicecandidate', event );

			if (event.candidate) {

				if ( this.trickleIce ) {
					var sendEvent = {
						mySelfPromiseData: this.rtcInstance.mySelfPromiseData,
						event: event 
					};

					dbg.dbgEvent( sendEvent );

					this.rtcInstance.dispatchEvent( RtcMedia.eventNames.onPeerConn_IceCandidate, sendEvent );
				}

			} else {		// End of Candidates 

				dbg.logMessage( "End of candidates: ", event, this );
			 
				// Trigger PROMISE HERE 
				// tmpCB.onicecandidate_resolve is used to trigger Promises!!  

				if ( !!this.rtcInstance.tmpCB.onicecandidate_resolve ) {
					dbg.infoMessage( 'peerConn.onicecandidate_resolve Ice Completed' );
					this.rtcInstance.tmpCB.onicecandidate_resolve( this.mySelfPromiseData );
				}
			}
			
			dbg.dbgExit( );
		};

		//------------------------------------
		//  onicecandidateerror
		//------------------------------------


		/**
		 * On Ice Candiatate Error 
		 * @function external:WebRTC.onicecandidateerror
		 * @param  {event} 	Event 
		 */
		this.peerConn.onicecandidateerror = function(event) { 
			var dbg = new DebugData( RtcMedia.className, this.rtcInstance, "_peerConn.onicecandidateerror", event ).dbgEnter( true );
			dbg.warnMessage( 'peerConn.onicecandidateerror', event, RtcMedia.getPeerConnStatesObject( this ) );

			// Trigger PROMISE HERE 
			// tmpCB.onicecandidate_reject is used to trigger Promises!!  
			dbg.infoMessage( 'peerConn.onicecandidate_reject' );
			this.tmpCB.onicecandidate_reject( event );
			dbg.dbgExit(); 
		};
		
	
		//------------------------------------
		//  onsignalingstatechange
		//------------------------------------
		// RFC: WD-webrtc-20160531: The signaling state has changed. This state change is the 
		//   result of either __setLocalDescription__ or __setRemoteDescription__ being invoked

		/**
		 * An Ice Candidate is ready
		 * @param  {event} 	Event 
		 * @function external:WebRTC.onsignalingstatechange
		 * @see  {@link https://www.w3.org/TR/2015/WD-webrtc-20150210/#interface-definition|RFC Interface Definition}
		 * @see  {@link https://www.w3.org/TR/2015/WD-webrtc-20150210/#widl-RTCPeerConnection-onsignalingstatechange|RFC peerConn.onsignalingstatechange}
		 */	
		this.peerConn.onsignalingstatechange = function(event) { 
			var dbg = new DebugData( RtcMedia.className, this.rtcInstance, "_peerConn.onsignalingstatechange", event ).dbgEnter( true );
			dbg.infoMessage( 'peerConn.onsignalingstatechange',  event, RtcMedia.getPeerConnStatesObject( this ) );

			dbg.dbgExit(); 
		};


		//------------------------------------
		//  onisolationchange
		//------------------------------------
		this.peerConn.onisolationchange = function(event) { 
			var dbg = new DebugData( RtcMedia.className, this.rtcInstance, "_peerConn.onisolationchange", event ).dbgEnter( true );
			dbg.infoMessage( 'peerConn.onisolationchange', event, RtcMedia.getPeerConnStatesObject( this ) );

			dbg.dbgExit(); 
		};

	
		//------------------------------------
		//  oniceconnectionstatechange
		//------------------------------------
		this.peerConn.oniceconnectionstatechange = function(event) { 
			var dbg = new DebugData( RtcMedia.className, this.rtcInstance, "_peerConn.oniceconnectionstatechange", event ).dbgEnter( true );
			dbg.infoMessage( 'peerConn.oniceconnectionstatechange', event, RtcMedia.getPeerConnStatesObject( this ) );

			if ( !!self.peerConn && 
				( self.peerConn.iceconnectionstate === "failed" ||
			    self.peerConn.iceconnectionstate === "disconnected" ||
			    self.peerConn.iceconnectionstate === "closed")
			    ) {
					dbg.warnMessage( "RTC", 'RtcMedia: _peerConn.oniceconnectionstatechange: WARN - state = ', this.peerConn.iceconnectionstate );
			}

			dbg.dbgExit(); 
		};

		//------------------------------------
		//  onicegatheringstatechange
		//------------------------------------
		this.peerConn.onicegatheringstatechange = function( event) {
			var dbg = new DebugData( RtcMedia.className, this.rtcInstance, "_peerConn.onicegatheringstatechange", event ).dbgEnter( true );
			dbg.infoMessage( 'peerConn.onicegatheringstatechange', event, RtcMedia.getPeerConnStatesObject( this ) );

			dbg.dbgExit(); 
		};

		//------------------------------------
		//  onconnectionstatechange
		//------------------------------------
		this.peerConn.onconnectionstatechange = function( event) {
			var dbg = new DebugData( RtcMedia.className, this.rtcInstance, "_peerConn.onconnectionstatechange", event ).dbgEnter( true );
			dbg.infoMessage( 'peerConn.onconnectionstatechange', event, RtcMedia.getPeerConnStatesObject( this  ) );

			dbg.dbgExit(); 
		};


		//------------------------------------
		//  onremovestream
		//------------------------------------
		this.peerConn.onremovestream = function(event) { 
			var dbg = new DebugData( RtcMedia.className, this.rtcInstance, "_peerConn.onremovestream", event ).dbgEnter( true );
			dbg.infoMessage( 'peerConn.onremovestream', event, RtcMedia.getPeerConnStatesObject( this ) );

			dbg.dbgExit(); 
		};

		
		//------------------------------------
		//  ontrack
		//------------------------------------
		this.peerConn.ontrack = function(event) { 
			var dbg = new DebugData( RtcMedia.className, this.rtcInstance, "_peerConn.ontrack", event ).dbgEnter( true );
			dbg.infoMessage( 'peerConn.ontrack', event, RtcMedia.getPeerConnStatesObject( this ) );

			dbg.dbgExit(); 
		};

		//------------------------------------
		//  onaddstream
		//------------------------------------
		// Deprecated -- ontrack is in Safari / iOS 
		// RFC: WD-webrtc-20150210 This will be fired only as a result of __setRemoteDescription__. 
		//    Onnaddstream happens as early as possible after the setRemoteDescription. This callback does
		//    not wait for a given media stream to be accepted or rejected via SDP negotiation.
		this.peerConn.onaddstream = function(event) {
			var dbg = new DebugData( RtcMedia.className, this.rtcInstance, "_peerConn.onaddstream", event ).dbgEnter( true );
			dbg.infoMessage( 'peerConn.onaddstream', event, RtcMedia.getPeerConnStatesObject( this ) );

			// Call the polyfill wrapper to attach the media stream to this element.

			dbg.dbgExit(); 
		};

		RtcMedia.dbAdd( this );

		dbg.dbgExit(); 

	}












	//##########################################################################
	//##########################################################################
	//##########################################################################
	// 
	//  G U M - Get User Media --
	// 
	//  Get User Media --gum-- 
	//  - _getUserMedia(..) 
	//  - gumSetAudioVideo
	//##########################################################################
	//##########################################################################
	//##########################################################################


	//###########################################################
	// GET USER MEDIA    Things
	//###########################################################
	// 			getFaceStream( ... ) 							-> Promise( mySelfPromiseData ) with mySelfPromiseData.data = stream
	// 			getLocalScreenCaptureStream() 					-> Promise( mySelfPromiseData ) with mySelfPromiseData.data = stream
	//			_getUserMedia( Constraints )					-> Promise( mySelfPromiseData ) with mySelfPromiseData.data = stream.  Sets self._localCurrentStream
	// 				get _constraints
	// 					get/set   sendAudio 					= boolean
	// 					get/set   sendVideo 					= boolean
	//						get videoSizeOptions 				-> RtcMedia_VIDEO_SIZE_OPTIONS
	//===========================================================

	//------------------------------------------------------------------------------
	//  getFaceStream
	//------------------------------------------------------------------------------

	/**
	 * Get Local Camera video (face) and optionally connect to the local window video element.
	 * 		this.localVideoElement must be set to an HTML video element before calling this.	 
	 * 
	 * Options to PreSet
	 * * self.sendAudio  - {@link RtcMedia#sendAudio}
	 * * self.sendVideo  - {@link RtcMedia#sendVideo}
	 * * self.localVideoElement - Set it to the local HTML Video Element.  IF set, the
	 *    video will be put into that Video Element when gotten.  That same MediaStream is
	 *    available via self.localCurrentStream - {@link RtcMedia#localCurrentStream}
	 * 
	 * PreSet by this function - overrides/changes values.
	 * * None
	 *
	 * Sets durring function and available after
	 * * self.localCurrentStream - {@link RtcMedia#localCurrentStream} via {@link RtcMedia#_getUserMedia}
	 * * self.localPreviousStream - {@link RtcMedia#localPreviousStream} via {@link RtcMedia#_getUserMedia}
	 *
	 * @param {boolean} SendAudio [Optional] Should getUserMedia use audio.
	 * * If not provided, the default (or preiously set) value will be used.  
	 * * See {@link RtcMedia#sendAudio}
	 * 
	 * @param {boolean} SendVideo [Optional] Should getUserMedia use video.  
	 * * If not provided, the default (or preiously set) value will be used.  
	 * * See {@link RtcMedia#sendVideo}
	 * 
	 * Other Functions Called
	 * * self._getUserMedia - {@link RtcMedia#_getUserMedia}
	 * 
	 * @return {Promise(PromiseData)} Promise.resolve( mySelfPromiseData ) so they can be chained together
	 * 
	 * @fires onLocalFaceStream
	 * 
	 */
	getLocalFaceStream( SendAudio, SendVideo ) {
		// Sets --> self.localStream
		var dbg = new DebugData( RtcMedia.className, this, "getLocalFaceStream", SendAudio, SendVideo ).dbgEnter( true );

		if ( this.mediaDirection === RtcMedia.mediaDirectionOptions.LISTEN_ONLY ) {		// RtcMedia.mediaDirectionOptions.LISTEN_ONLY
			var throwVal = "MediaMngr: getLocalFaceStream: You can not use this function with a LISTEN_ONLY MediaManager." + 
					"  Change value of mediaDirection to use this ";
			dbg.errorMessage( throwVal );
			throw( throwVal );
		}

		if ( typeof SendAudio !== 'undefined' ) { this.sendAudio = SendAudio; }
		if ( typeof SendVideo !== 'undefined' ) { this.sendVideo = SendVideo; }

		// Make a copy
		var gumConstraintsCopy = JSON.parse( JSON.stringify( this._constraints ));
		
		var self = this;

		var promise = new Promise( function(resolve, reject) {

	    	self._getUserMedia( gumConstraintsCopy ).then(
				function(stream) {

					// NOTE: This same stream can be found in self.localStream
					dbg.dbgMessage( 'dispatchEvent onLocalFaceStream( stream )' );
					self.dispatchEvent( "onLocalFaceStream", stream);
					if ( !! self.localVideoElement ) {
						dbg.dbgMessage( 'self.localVideoElement.srcObject = stream' );
						self.localVideoElement.srcObject = stream;
					}
					self.mySelfPromiseData.data = stream;
					dbg.infoMessage( 'Got Stream', stream );
					dbg.dbgResolve( 'mySelfPromiseData' );
					resolve( self.mySelfPromiseData );
		        }        	
		    ).catch(
				function(error) {
					dbg.dbgReject( error.stack );
					reject( error );
				}
			);
		});

		RtcMedia.dbAdd( this );

		dbg.dbgExitPd();
		return promise;

	}


	//--------------------------------------------------------
	//  getScreenCaptureStream - Gets Screen Capture Stream and put it in local Video
	//--------------------------------------------------------

	/**
	 * Gets screen capture screen and returns a stream.
	 *
	 * Options to PreSet
	 * * self.localVideoElement - Set it to the local HTML Video Element.  IF set, the
	 *    video will be put into that Video Element when gotten.  That same MediaStream is
	 *    available via self.localCurrentStream - {@link RtcMedia#localCurrentStream}
	 *
	 * PreSet by this function - overrides/changes values.
	 * * self.sendAudio = false;   {@link RtcMedia#sendAudio}
	 *   * **NOTE: MUST BE false or else it will error!!**
	 * * self.sendVideo = screen_constraints.video;       {@link RtcMedia#sendVideo}
	 *
	 * Sets durring function and available after
	 * * self.localCurrentStream - {@link RtcMedia#localCurrentStream} via {@link RtcMedia#_getUserMedia}
	 * * self.localPreviousStream - {@link RtcMedia#localPreviousStream} via {@link RtcMedia#_getUserMedia}
	 *
	 * Other Functions Called
	 * * self._getUserMedia - {@link RtcMedia#_getUserMedia}
	 * 
	 * @return {Promise(PromiseData)} Promise.resolve( mySelfPromiseData ) so they can be chained together
	 *  
	 * @fires onLocalScreenCaptureStream
	 */
	getLocalScreenCaptureStream() {
		var dbg = new DebugData( RtcMedia.className, this, "getLocalScreenCaptureStream" ).dbgEnter();

		if ( this.mediaDirection === RtcMedia.mediaDirectionOptions.LISTEN_ONLY ) {		// RtcMedia.mediaDirectionOptions.LISTEN_ONLY
			var throwVal = "MediaMngr: getLocalScreenCaptureStream: You can not use this function with a LISTEN_ONLY MediaManager." + 
					"  Change value of mediaDirection to use this ";
			dbg.errorMessage( throwVal );
			throw( throwVal );
		}

		var self = this;

		var promise = new Promise( function(resolve, reject) {

        	window.getScreenId( function(error, sourceId, screen_constraints) {

				dbg.logMessage( DebugData.JsonTab( screen_constraints ), sourceId, screen_constraints );

				// Set Audio/Video
				// NOTE :  ######################################
				// Make sure self.sendAudio = false   OR ELSE it will ERROR  !!!!
				// ################################
				self.sendAudio = false; 		
				self.sendVideo = screen_constraints.video;

				// Make a copy
				var gumConstraintsCopy = JSON.parse( JSON.stringify( self._constraints ));

		        self._getUserMedia( gumConstraintsCopy ).then(
					function(stream) {

						dbg.dbgMessage( 'dispatchEvent onLocalScreenCaptureStream( stream )' );
						self.dispatchEvent( "onLocalScreenCaptureStream", stream);

						if ( !! self.localVideoElement ) {
							dbg.dbgMessage( 'self.localVideoElement.srcObject = stream' );
							self.localVideoElement.srcObject = stream;
						}

						self.mySelfPromiseData.data = stream;
						dbg.infoMessage( 'Got Stream', DebugData.JsonTab( stream ) );
						dbg.dbgResolve( 'mySelfPromiseData' );
						resolve( self.mySelfPromiseData );
			        }        	
		        )
		        .catch(
					function(jsError) {
						dbg.dbgReject( jsError.stack );
						reject( jsError );
					}
		    	);

	        });

		});

		RtcMedia.dbAdd( this );

		dbg.dbgExitPd();
		return promise;
        
	}



	//--------------------------------------------------------
	//  _getUserMedia  -- navigator.mediaDevices._getUserMedia
	//--------------------------------------------------------

	/**
	 * Get User Media using self._constraints created by developer 
	 *    OR just use the default.
	 *    
	 * Notes:
	 * * This should never be called by normal developer.  It is private.
	 * * Use {@link RtcMedia#getLocalFaceStream} or {@link RtcMedia#getLocalFaceStream} instead.
	 * 
	 * Options to PreSet
	 * * None
	 *
	 * PreSet by this function - overrides/changes values.
	 * * None 
	 * 
	 * Sets durring function and available after
	 * * self.localCurrentStream - {@link RtcMedia#localCurrentStream}
	 * * self.localPreviousStream - {@link RtcMedia#localPreviousStream}
	 *
	 * @return {Promise(PromiseData)} Promise.resolve( mySelfPromiseData ) so they can be chained together
	 *  
	 * @private
	 * 
	 * @see RtcMedia#getLocalFaceStream
	 * @see RtcMedia#getLocalScreenCaptureStream
	 *
	 */
	_getUserMedia( Constraints ) {
		var useConstraints = ( !!Constraints ) ? Constraints : this._constraints;

		var dbg = new DebugData( RtcMedia.className, this, "_getUserMedia", useConstraints ).dbgEnter( true );

		var self = this;

		var promise = new Promise( function(resolve, reject) {

		    navigator.mediaDevices.getUserMedia( useConstraints ).then(		// Returns stream 
		     	function(stream) {		// successCallback

					// var logStreams = "no Stream";

					// if ( !!stream ) {

					// 	logStreams = "Tracks: " + stream.getTracks().length;

					// 	stream.getTracks().forEach( 
					// 		function( TrackData ) {
					// 			logStreams = logStreams +
					// 			` { ${TrackData.kind} ${TrackData.readyState} ${TrackData.label.substring(0,8)} ${(( TrackData.remote ) ? "remote" : "local" )} }`;
					// 		}
					// 	);
					// }

					// console.info( "RTC", "RtcMedia: _getUserMedia: Got Stream ", stream, logStreams );

					// If previousStream - stop all tracks and remove
					if ( !! self._localPreviousStream ) {
						RtcMedia._streamTracksDisableStopRemove( self._localPreviousStream );
						self._localPreviousStream = null;
					}

					// Set old currentStream to previousStream
					//   We do NOT want to stop and kill it yet!!! 
					if ( !! self._localCurrentStream ) {
						self._localPreviousStream = self._localCurrentStream;
					}

					// Set currentStream
					self._localCurrentStream = stream;

					dbg.dbgResolve( stream );
					resolve( stream );
				}
			)
			.catch(
				function( navigatorUserMediaError ) { 		// errorCallback
					var jsError = new Error(`In navigator.mediaDevices.getUserMedia(gumConstraintsCopy )
						NavigatorUserMediaError
							name = ${navigatorUserMediaError.name} 
							message = ${navigatorUserMediaError.message} 
							constraintName = ${navigatorUserMediaError.constraintName}`);
					dbg.dbgReject( jsError.stack );
					reject( jsError );
				}
			);
		});

		dbg.dbgExit('Promise->Resolve(MediaStream)');
		return promise;
	}









	msgSendTest() {
		var dbg = new DebugData( RtcMedia.className, this, "msgSendTest", this, [1,2,3,4], {b:"b"} );
		dbg.dbgEnter( );
		dbg.dbgResolve( "This is an resolve " );
		dbg.dbgReject( "This is an reject " );
		dbg.dbgEvent( "This is an reject " );
		dbg.dbgMessage( "This is an details ", this, this.peerConn, this.mute );
		dbg.dbgDo();
		dbg.logMessage( "This is an logMessage " );
		dbg.setPrintStack( true ).infoMessage( "This is an infoMessage " );
		dbg.warnMessage( "This is an warnMessage " );
		dbg.errorMessage( "This is an errorMessage " );
		dbg.alertMessage( "This is an alertMessage " );
		dbg.dbgExit( );

		dbg = new DebugData( RtcMedia.className, this, "_pc_TestNegotiation_CreateOffer_SetLocalDescription_WaitForIce" ).dbgDo();
		dbg = new DebugData( RtcMedia.className, this, "_pc_TestNegotiation_CreateOffer_SetLocalDescription_WaitForIce" ).dbgDoPd();

		console.debug("WERWERWE");

	}




}


