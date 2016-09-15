'use strict';

// Constants.js
 

//#########################################################################
// Event Listing - Constants  
//#########################################################################

/**
 * Events used throughout.  They are kept here to make sure we do not overlap, etc.
 */
const NcEvents = {

	//--------------------------------------------------------
	//  WebSocket Events 
	//--------------------------------------------------------

	/**
     * WebSocket Open.
     *
     * @event onWsOpen
     * @type {Event}
     * @property {number} timeStamp I think this is how long it took to connect in MS.
     * @property {object} currentTarget Details about the target.
     * @property {string} type "open".
     *
     */
	onWsOpen: "onWsOpen",

	/**
     * WebSocket Close.
     *
     * @event onWsClose
     * @type {Event}
     */
	onWsClose: "onWsClose",

	/**
     * WebSocket Error.
     *
     * @event onWsError
     * @type {Event}
     */
	onWsError: "onWsError",


	/**
     * Successful Login to NetComposer.
     *
     * @event onWsLoginSuccess
     * @type {Event}
     */
	onWsLoginSuccess: "onWsLoginSuccess",

	/**
     * Login Error to NetComposer.
     *
     * @event onWsLoginError
     * @type {Event}
     */
	onWsLoginError: "onWsLoginError",

	/**
     * When SessionId changes = A new login happened.
     *
     * @event onWsSessionIdChanged
     * @type {Event}
     */
	onWsSessionIdChanged: "onWsSessionIdChanged",

	//--------------------------------------------------------
	//  Remote Logger 
	//--------------------------------------------------------
	onRemoteLoggerInfo: "onRemoteLoggerInfo",
	onRemoteLoggerError: "onRemoteLoggerError",



};
Object.freeze( NcEvents );



// const NcErrorCode = {

//           internal_error:               1001,
//           normal:                       1002,
//           anormal_termination:          1003,
//           invalid_state:                     1004,
//           timeout:                      1005,
//           not_implemented:              1006,

//           process_not_found:            1010,
//           process_down:                 1011,
//           registered_down:              1012,
//           user_stop:                         101,

//           service_not_found:            1020,

//           unauthorized:                 1030,
//           not_authenticated:            1031,
//           already_authenticated:        1032,
//           user_not_found:               1033,
//           duplicated_session_id:        1034,
//           invalid_session_id:           1035,

//           operation_error:              1040,
//           unknown_command:              1041,
//           unknown_class:                     1042,
//           incompatible_operation:  1043,
//           unknown_operation:            1044,
//           invalid_operation:            1045,
//           syntax_error:                 1046,
//           missing_field:                     1047,
//           invalid_parameters:           1048,
//           missing_parameters:           1049,

//           session_timeout:              1060,
//           session_stop:                 1061,
//           session_not_found:            1062,

//           no_mediaserver:               2001,
//           unknown_session_type:         2002,

//           missing_offer:                     2010,
//           duplicated_offer:             2011,
//           offer_not_set:                     2012,
//           offer_already_set:            2013,
//           duplicated_answer:            2014,
//           answer_not_set:               2015,
//           answer_already_set:           2016,

//           call_not_found:               2020,
//           call_rejected:                     2021,
//           no_destination:               2022,
//           no_answer:                         2023,
//           already_answered:             2024,
//           originator_cancel:            2025,
//           peer_hangup:                  2026,

//           room_not_found:               2030,
//           room_already_exists:          2031,
//           room_destroyed:               2032,
//           no_participants:              2033,
//           unknown_publisher:            2034,
//           invalid_publisher:            2035,
//           publisher_stopped:            2036

// };

// Object.freeze( NcErrorCode );




