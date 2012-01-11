/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

BREAKOUT.namespace('BREAKOUT.IOBoardEvent');

BREAKOUT.IOBoardEvent = (function() {

	var IOBoardEvent;

	// dependencies
	var Event = BREAKOUT.Event;

	/**
	 * @exports IOBoardEvent as BREAKOUT.IOBoardEvent
	 * @constructor
	 * @augments BREAKOUT.Event
	 * @param {String} type The event type
	 */
	IOBoardEvent = function(type) {

		this.name = "IOBoardEvent"; // for testing
		
		// call the super class
		// 2nd parameter is passed to EventDispatcher constructor
		Event.call(this, type);
	};

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


	IOBoardEvent.prototype = BREAKOUT.inherit(Event.prototype);
	IOBoardEvent.prototype.constructor = IOBoardEvent;

	return IOBoardEvent;

}());