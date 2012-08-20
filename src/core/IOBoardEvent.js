/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.IOBoardEvent');

BO.IOBoardEvent = (function() {

	var IOBoardEvent;

	// Dependencies
	var Event = JSUTILS.Event;

	/**
	 * @exports IOBoardEvent as BO.IOBoardEvent
	 * @class An Event object to be dispatched (fired) by the IOBoard object.
	 * The most important event is the READY event which signifies that the
	 * I/O board is ready to receive commands from the application. Many of the
	 * other IOBoard events are used when creating new io component objects.
	 * @constructor
	 * @augments JSUTILS.Event
	 * @param {String} type The event type
	 */
	IOBoardEvent = function(type) {

		this.name = "IOBoardEvent";
		
		// Call the super class
		// 2nd parameter is passed to EventDispatcher constructor
		Event.call(this, type);
	};

	// Events
	/** @constant */
	IOBoardEvent.ANALOG_DATA = "analogData";
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
	IOBoardEvent.PIN_STATE_RESPONSE = "pinStateResponse";
	/** @constant */
	IOBoardEvent.READY = "ioBoardReady";
	/** @constant */
	IOBoardEvent.CONNECTED = "ioBoardConnected";
	/** @constant */
	IOBoardEvent.DISCONNECTED = "ioBoardDisonnected";		

	IOBoardEvent.prototype = JSUTILS.inherit(Event.prototype);
	IOBoardEvent.prototype.constructor = IOBoardEvent;

	return IOBoardEvent;

}());
