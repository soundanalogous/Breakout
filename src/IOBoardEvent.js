/**
 * @author Jeff Hoefs
 */

ARDJS.namespace('ARDJS.IOBoardEvent');

ARDJS.IOBoardEvent = (function() {

	var IOBoardEvent;

	// dependencies
	var Event = ARDJS.Event;

	/**
	 * @exports IOBoardEvent as ARDJS.IOBoardEvent
	 * @constructor
	 * @augments ARDJS.Event
	 * @param {String} type The event type
	 * @param {Object} data An object containing additional parameters
	 */
	IOBoardEvent = function(type) {

		this.name = "IOBoardEvent"; // for testing
		
		// call the super class
		// 2nd parameter is passed to EventDispatcher constructor
		Event.call(this, type);
	}

	// events
	/** @constant */
	IOBoardEvent.ANALOG_DATA = "analodData";
	/** @constant */
	IOBoardEvent.DIGITAL_DATA = "digitalData";
	/** @constant */
	IOBoardEvent.FIRMWARE_VERSION = "firmwareVersion";
	/** @constant */
	IOBoardEvent.FIRMWARE_NAME = "firmwareName";
	/** @constant */
	IOBoardEvent.STRING_MESSAGE = "stringMessage";
	/** @constant */
	IOBoardEvent.SYSEX_MESSAGE = "sysexMessage";
	/** @constant */
	IOBoardEvent.CAPABILITY_RESPONSE = "capabilityResponse";
	/** @constant */
	IOBoardEvent.PIN_STATE_RESPONSE = "pinStateResponse";
	/** @constant */
	IOBoardEvent.ANALOG_MAPPING_RESPONSE = "analogMappingResponse";
	/** @constant */
	IOBoardEvent.READY = "arduinoReady";


	IOBoardEvent.prototype = ARDJS.inherit(Event.prototype);
	IOBoardEvent.prototype.constructor = IOBoardEvent;

	return IOBoardEvent;

}());