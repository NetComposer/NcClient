'use strict';


const EchoMedia_Version = "EchoMedia 1.0.0";

/**
 * Constructs a new EchoMedia instance
 * 
 * @extends {MediaMngr}
 * 
 * @param  {object}		SettingsObject	[Optional] Object with name/value pairs of parameters to be set.  You can use this to set an value (including those not in the class).
 * 			It is a convience method for setting multple things at once and/or passing them from other sub classes or parents.
 *
 * @return {EchoMedia} EchoMedia
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
class EchoMedia extends NkMedia {

    constructor( SettingsObject ) {
    	super( SettingsObject );
    }

    //--------------------------------------------------------
    //  version(s), className, toString & Versions
    //--------------------------------------------------------
    get className() { return EchoMedia.className; }
    toString() { return '[object EchoMedia]'; }
    
    static get className() { return "EchoMedia"; }
    static toString() { return '[object EchoMedia]'; }

    get version() { return EchoMedia.version; }
    get versions() { return EchoMedia.versions; }
    
    static get version() { return EchoMedia_Version; }
    static get versions() { return `${EchoMedia_Version} --> ${super.versions}`; } 



    callEcho( ) {
		new DebugData( EchoMedia.className, this, "callEcho" ).dbgDoPd();

    	return RtcMedia._chn_pc_SetLocalStream_To_FullSdpOffer( this.mySelfPromiseData )
    		.then( EchoMedia._chn_nk_MediaSessionStart_Echo )
    		.then( RtcMedia._chn_pc_SetRemoteDescription );

    }

    callEchoFace( UseAudio, UseVideo ) {
        new DebugData( EchoMedia.className, this, "callEchoFace" ).dbgDoPd();

        // Check UseAudio, UseVideo
        
        return this.getLocalFaceStream( UseAudio, UseVideo )
            .then( RtcMedia._chn_pc_SetLocalStream_To_FullSdpOffer )
            .then( EchoMedia._chn_nk_MediaSessionStart_Echo )
            .then( RtcMedia._chn_pc_SetRemoteDescription );
    }


    callEchoScreen( ) {
        new DebugData( EchoMedia.className, this, "callEchoFace" ).dbgDoPd();

        return this.getLocalScreenCaptureStream( )
            .then( RtcMedia._chn_pc_SetLocalStream_To_FullSdpOffer )
            .then( EchoMedia._chn_nk_MediaSessionStart_Echo )
            .then( RtcMedia._chn_pc_SetRemoteDescription );
    }


    static _chn_nk_MediaSessionStart_Echo( mySelfPromiseData ) {
        var self = mySelfPromiseData.self;
        var dbg = new DebugData( RtcMedia.className, self, "_chn_nk_MediaSessionStart_Echo" ).dbgEnter();

        self._cmdData = {
            type: "echo",
            backend: self.mediaServerType,
            offer: {
                sdp: self.sdpOffer,
            }
        };

        dbg.dbgMessage( `Set self._cmdData = ${DebugData.JsonTab( self._cmdData )}`);
        dbg.dbgExit( );
        return NkMedia._chn_nk_MediaSessionStart( mySelfPromiseData );  // Returns NkMedia Data 
    }


}

