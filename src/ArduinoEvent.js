/**
 * @author Jeff Hoefs
 */

ARDJS.namespace('ARDJS.ArduinoEvent');

ARDJS.ArduinoEvent = (function() {

	var ArduinoEvent;

	// dependencies
	var Event = ARDJS.Event;

	/**
	 * @exports ArduinoEvent as ARDJS.ArduinoEvent
	 * @constructor
	 * @augments ARDJS.Event
	 * @param {String} type The event type
	 * @param {Object} data An object containing additional parameters
	 */
	ArduinoEvent = function(type) {

		this.name = "ArduinoEvent"; // for testing
		
		// call the super class
		// 2nd parameter is passed to EventDispatcher constructor
		Event.call(this, type);
	}

	// events
	/** @constant */
	ArduinoEvent.ANALOG_DATA = "analodData";
	/** @constant */
	ArduinoEvent.DIGITAL_DATA = "digitalData";
	/** @constant */
	ArduinoEvent.FIRMWARE_VERSION = "firmwareVersion";
	/** @constant */
	ArduinoEvent.FIRMWARE_NAME = "firmwareName";
	/** @constant */
	ArduinoEvent.STRING_MESSAGE = "stringMessage";
	/** @constant */
	ArduinoEvent.SYSEX_MESSAGE = "sysexMessage";
	/** @constant */
	ArduinoEvent.CAPABILITY_RESPONSE = "capabilityResponse";
	/** @constant */
	ArduinoEvent.PIN_STATE_RESPONSE = "pinStateResponse";
	/** @constant */
	ArduinoEvent.ANALOG_MAPPING_RESPONSE = "analogMappingResponse";
	/** @constant */
	ArduinoEvent.READY = "arduinoReady";


	ArduinoEvent.prototype = ARDJS.inherit(Event.prototype);
	ArduinoEvent.prototype.constructor = ArduinoEvent;

	return ArduinoEvent;

}());