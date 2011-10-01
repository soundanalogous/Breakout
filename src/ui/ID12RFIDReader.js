/**
 * @author jeff hoefs
 */

/**
 * Creates a new ID12RFIDReader
 *
 * @constructor
 * @param {Class} board A reference to the Arduino class instance
 */
function ID12RFIDReader(board) {
	"use strict";

	// to do: object id to be passed in as a param rather than
	// explicitly set? This would support the ability to use multiple
	// RFID readers with a single Arduino.
	// Would also need to update the Arduino library to enable this.
	var 	ID12_READER		= 13,
			READ_EVENT		= 1,
			REMOVE_EVENT	= 2;

	var self = this;	
	this.className = "ID12RFIDReader"; 	// for testing
	
	var _evtDispatcher = new EventDispatcher(this);

	board.addEventListener(ArduinoEvent.SYSEX_MESSAGE, onSysExMessage);
	
	// private methods:
	/**
	 * @private
	 */
	function onSysExMessage(event) {
		var message = event.data.message;

		if (message[0] != ID12_READER) {
			return;
		} else {
			processRFIDData(message);
		}
	}

	// this is nice! found it here:
	// http://stackoverflow.com/questions/57803/how-to-convert-decimal-to-hex-in-javascript
	/**
	 * @private
	 */
	function dec2hex(i) {
   		return (i+0x100).toString(16).substr(-2).toUpperCase();
	}
	
	/**
	 * @private
	 */
	function processRFIDData(data) {
		var tagEvent = board.getValueFromTwo7bitBytes(data[1], data[2]);
		var tagEventType = "";
		var tag = "";
				
		for (var i=3, len=data.length; i<len; i+=2) {
			tag += dec2hex(board.getValueFromTwo7bitBytes(data[i], data[i+1]));
		}
		
		// change this to dispatch a single event and handle add or remove in object parameter?
		if (tagEvent == READ_EVENT) {
			dispatch(new RFIDEvent(RFIDEvent.ADD_TAG, tag));
		} else if (tagEvent == REMOVE_EVENT) {
			dispatch(new RFIDEvent(RFIDEvent.REMOVE_TAG, tag));
		} else {
			// got something else
			return;
		}
		
	}
	
	/**
	 * @private
	 */
	function dispatch(event) {
		self.dispatchEvent(event);
	}
	
	// public methods:
	
	/* implement EventDispatcher */
	
	/**
	 * @param {String} type The event type
	 * @param {Function} listener The function to be called when the event is fired
	 */
	this.addEventListener = function(type, listener) {
		_evtDispatcher.addEventListener(type, listener);
	}
	
	/**
	 * @param {String} type The event type
	 * @param {Function} listener The function to be called when the event is fired
	 */
	this.removeEventListener = function(type, listener) {
		_evtDispatcher.removeEventListener(type, listener);
	}
	
	/**
	 * @param {String} type The event type
	 * return {boolean} True is listener exists for this type, false if not.
	 */
	this.hasEventListener = function(type) {
		return _evtDispatcher.hasEventListener(type);
	}
	
	/**
	 * @param {Event} type The Event object
	 * return {boolean} True if dispatch is successful, false if not.
	 */		
	this.dispatchEvent = function(event) {
		return _evtDispatcher.dispatchEvent(event);
	}
}

/**
 * @constructor
 * @augments Event
 * @param {String} type The event type
 * @param {String} tag The RFID tag value (hexadecimal)
 */
function RFIDEvent(type, tag) {
	this.tag = tag;
	// call the super class
	// 2nd parameter is passed to EventDispatcher constructor
	Event.call(this, type);
}

/** @constant */
RFIDEvent.ADD_TAG = "addTag";
/** @constant */
RFIDEvent.REMOVE_TAG = "removeTag";

// to do: figure out how to inherit a class without using 'new' when we want
// to call the super class in the subclass constructor (as we do in this case)
RFIDEvent.prototype = new Event;
RFIDEvent.prototype.constructor = RFIDEvent;
