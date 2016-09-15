'use strict';


const PublishMedia_Version = "PublishMedia 1.0.0";

/**
 * Constructs a new PublishMedia instance
 * 
 * @extends {MediaMngr}
 * 
 * @param  {object}		SettingsObject	[Optional] Object with name/value pairs of parameters to be set.  You can use this to set an value (including those not in the class).
 * 			It is a convience method for setting multple things at once and/or passing them from other sub classes or parents.
 *
 * @return {PublishMedia} PublishMedia
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
class PublishMedia extends NkMedia {

    constructor( SettingsObject ) {
    	super( SettingsObject );
    }

    //--------------------------------------------------------
    //  version(s), className, toString & Versions
    //--------------------------------------------------------
    get className() { return PublishMedia.className; }
    toString() { return '[object PublishMedia]'; }
    
    static get className() { return "PublishMedia"; }
    static toString() { return '[object PublishMedia]'; }

    get version() { return PublishMedia.version; }
    get versions() { return PublishMedia.versions; }
    
    static get version() { return PublishMedia_Version; }
    static get versions() { return `${PublishMedia_Version} --> ${super.versions}`; }  



    callPublish( ) {
		new DebugData( PublishMedia.className, this, "callEcho" ).dbgDoPd();

    	return RtcMedia._chn_pc_SetLocalStream_To_FullSdpOffer( this.mySelfPromiseData )
    		.then( PublishMedia._chn_nk_MediaSessionStart_Publish )
    		.then( RtcMedia._chn_pc_SetRemoteDescription );

    }

    callPublishFace( UseAudio, UseVideo ) {
        new DebugData( PublishMedia.className, this, "callEchoFace" ).dbgDoPd();

        // Check UseAudio, UseVideo
        
        return this.getLocalFaceStream( UseAudio, UseVideo )
            .then( RtcMedia._chn_pc_SetLocalStream_To_FullSdpOffer )
            .then( PublishMedia._chn_nk_MediaSessionStart_Publish )
            .then( RtcMedia._chn_pc_SetRemoteDescription );
    }

    callPublishScreen( ) {
        new DebugData( PublishMedia.className, this, "callPublishFace" ).dbgDoPd();

        // Check UseAudio, UseVideo
        
        return this.getLocalScreenCaptureStream( )
            .then( RtcMedia._chn_pc_SetLocalStream_To_FullSdpOffer )
            .then( PublishMedia._chn_nk_MediaSessionStart_Publish )
            .then( RtcMedia._chn_pc_SetRemoteDescription );
    }


    static _chn_nk_MediaSessionStart_Publish( mySelfPromiseData ) {
        var self = mySelfPromiseData.self;
        var dbg = new DebugData( RtcMedia.className, self, "_chn_nk_MediaSessionStart_Publish" ).dbgDo();

        var errString;

        if ( typeof self.confRoom.roomId === 'undefined' ) {
            errString = "It appears that confRoom has not been set.  You MUST set a valid confRoom before starting a conference session! ";
            dbg.dbgError( errString );
            throw( errString );
        }

        self._cmdData = {
            type: "publish",
            room_id: self.confRoom.roomId,
            offer: {
                sdp: self.sdpOffer,
            }
        };

        return NkMedia._chn_nk_MediaSessionStart( mySelfPromiseData );  // Returns NkMedia Data 
    }

}

