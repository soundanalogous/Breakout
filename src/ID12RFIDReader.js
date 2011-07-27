/**
 * @author jeff hoefs
 */

/**
 * Creates a new ID12RFIDReader
 *
 * @constructor
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
	function dec2hex(i) {
   		return (i+0x100).toString(16).substr(-2).toUpperCase();
	}
	
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
	
	function dispatch(event) {
		self.dispatchEvent(event);
	}
	
	// public methods:
	
	/* implement EventDispatcher */
	
	/**
	 * @borrows EventDispatcher#addEventListener as this.addEventListener
	 */
	this.addEventListener = function(type, listener) {
		_evtDispatcher.addEventListener(type, listener);
	}
	
	/**
	 * @borrows EventDispatcher#removeEventListener as this.removeEventListener
	 */	
	this.removeEventListener = function(type, listener) {
		_evtDispatcher.removeEventListener(type, listener);
	}
	
	/**
	 * @borrows EventDispatcher#hasEventListener as this.hasEventListener
	 */	
	this.hasEventListener = function(type) {
		return _evtDispatcher.hasEventListener(type);
	}
	
	/**
	 * @borrows EventDispatcher#dispatchEvent as this.dispatchEvent
	 */	
	this.dispatchEvent = function(event) {
		return _evtDispatcher.dispatchEvent(event);
	}
}

/**
 * @constructor
 * @augments Event
 * @param type {string} The event type
 * @param tag {string} The RFID tag value (hexadecimal)
 */
function RFIDEvent(type, tag) {
	this.tag = tag;
	// call the super class
	// 2nd parameter is passed to EventDispatcher constructor
	Event.call(this, type);
}

RFIDEvent.ADD_TAG = "addTag";
RFIDEvent.REMOVE_TAG = "removeTag";

// to do: figure out how to inherit a class without using 'new' when we want
// to call the super class in the subclass constructor (as we do in this case)
RFIDEvent.prototype = new Event;
RFIDEvent.prototype.constructor = RFIDEvent;
