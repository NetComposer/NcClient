'use strict';


const ListenMedia_Version = "ListenMedia 1.0.0";

/**
 * Constructs a new ListenMedia instance
 * 
 * @extends {MediaMngr}
 * 
 * @param  {object}		SettingsObject	[Optional] Object with name/value pairs of parameters to be set.  You can use this to set an value (including those not in the class).
 * 			It is a convience method for setting multple things at once and/or passing them from other sub classes or parents.
 *
 * @return {ListenMedia} ListenMedia
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
 * @requires {@link adapter}
 * @requires {@link getScreenId}
 */
class ListenMedia extends NkMedia {

    constructor( SettingsObject ) {
    	super( SettingsObject );

    }

    init() {
        var dbg = new DebugData( ListenMedia.className, this, "init" ).dbgEnter( );

        this._publisherId = null;

        // Do parent last because it refreshes args sent in at contruction. 
        super.init();

        dbg.dbgExit(); 
    }


    //--------------------------------------------------------
    //  version(s), className, toString & Versions
    //--------------------------------------------------------
    get className() { return ListenMedia.className; }
    toString() { return '[object ListenMedia]'; }
    
    static get className() { return "ListenMedia"; }
    static toString() { return '[object ListenMedia]'; }

    get version() { return ListenMedia.version; }
    get versions() { return ListenMedia.versions; }
    
    static get version() { return ListenMedia_Version; }
    static get versions() { return `${ListenMedia_Version} --> ${super.versions}`; }  




    set publisherId( PublisherId ) {
        var dbg = new DebugData( ListenMedia.className, this, "set publisherId", PublisherId ).dbgDo( );
        
        if ( typeof PublisherId !== 'string' ) {
            var myError = new Error( 'PublisherId MUST be string!' );
            dbg.errorMessage( myError.stack );
            throw( myError );
        }

        this._publisherId = PublisherId;
    }

    get publisherId() {
        return this._publisherId;
    }



    get sessionId() {
        return this._sessionId;
    }




    callListen( ) {
		new DebugData( ListenMedia.className, this, "callListen" ).dbgDoPd();

    	return ListenMedia._chn_nk_MediaSessionStart_Listen( this.mySelfPromiseData )
    		.then( RtcMedia._chn_pc_SetRemoteDescription )
            .then( RtcMedia._chn_pc_CreateAnswer_SetLocalDescription_And_WaitForIceCompleteOrTimeout )
            .then( NkMedia._chn_nk_MediaSessionSetAnswer );

    }

    static _chn_nk_MediaSessionStart_Listen( mySelfPromiseData ) {
        var self = mySelfPromiseData.self;
        var dbg = new DebugData( RtcMedia.className, self, "_chn_nk_MediaSessionStart_Listen" ).dbgDoPd();

        var myError;

        if ( typeof self.publisherId !== 'string' ) {
            myError = new Error('self.publisherId is not set to a string.  It MUST contain a valid publisher id!');
            dbg.errorMessage( myError.stack );
            throw( myError );
        }

        self._cmdData = {
            type: "listen",
            publisher_id: self.publisherId
        };

        return NkMedia._chn_nk_MediaSessionStart( mySelfPromiseData )
            .then(
                function( Response ) {
                    dbg.infoMessage( `Resolved`, Response );
                    dbg.dbgResolve( 'mySelfPromiseData' );
                    return( mySelfPromiseData );
                }           
            );
    }


}

