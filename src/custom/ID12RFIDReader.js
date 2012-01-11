/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */
 
BREAKOUT.namespace('BREAKOUT.custom.RFIDEvent');

BREAKOUT.custom.RFIDEvent = (function() {
	"use strict";

	var RFIDEvent;

	// dependencies
	var Event = BREAKOUT.Event;

	/**
	 * @exports RFIDEvent as BREAKOUT.custom.RFIDEvent
	 * @constructor
	 * @augments BREAKOUT.Event
	 * @param {String} type The event type
	 * @param {String} tag The RFID tag value (hexadecimal)
	 */
	RFIDEvent = function(type, tag) {
		this._tag = tag;
		// call the super class
		// 2nd parameter is passed to EventDispatcher constructor
		Event.call(this, type);
	};

	/** @constant */
	RFIDEvent.ADD_TAG = "addTag";
	/** @constant */
	RFIDEvent.REMOVE_TAG = "removeTag";

	RFIDEvent.prototype = BREAKOUT.inherit(Event.prototype);
	RFIDEvent.prototype.constructor = RFIDEvent;

	/**
	 * [read-only] The RFID tag value (hexadecimal string).
	 * @name RFIDEvent#tag
	 * @property
	 * @type String
	 */ 
	RFIDEvent.prototype.__defineGetter__("tag", function() { return this._tag; });

	return RFIDEvent;

}());


BREAKOUT.namespace('BREAKOUT.custom.ID12RFIDReader');

BREAKOUT.custom.ID12RFIDReader = (function() {

	var ID12RFIDReader;

	// dependencies
	var EventDispatcher = BREAKOUT.EventDispatcher,
		IOBoardEvent = BREAKOUT.IOBoardEvent,
		RFIDEvent = BREAKOUT.io.RFIDEvent;

	/**
	 * Innovations ID-12 RFID Reader.
	 * <p>To use this object, RFIDFirmata must be uploaded to the
	 * IOBoard rather than StandardFirmata. See custom_examples/readme.txt
	 * for insturctions.</p>
	 *
	 * @exports ID12RFIDReader as BREAKOUT.custom.ID12RFIDReader
	 * @constructor
	 * @param {IOBoard} board A reference to the IOBoard instance
	 */
	ID12RFIDReader = function(board) {
		"use strict";

		this.name = "ID12RFIDReader"; 	// for testing

		// to do: object id to be passed in as a param rather than
		// explicitly set? This would support the ability to use multiple
		// RFID readers with a single Arduino.
		// Would also need to update the Arduino library to enable this.
		this.ID12_READER = 13,
		this.READ_EVENT = 1,
		this.REMOVE_EVENT = 2;

		this._board = board;
		
		this._evtDispatcher = new EventDispatcher(this);

		board.addEventListener(IOBoardEvent.SYSEX_MESSAGE, this.onSysExMessage.bind(this));			
	};

	ID12RFIDReader.prototype = {

		// private methods:
		/**
		 * @private
		 */
		onSysExMessage: function(event) {
			var message = event.message;

			if (message[0] != this.ID12_READER) {
				return;
			} else {
				this.processRFIDData(message);
			}
		},

		// this is nice! found it here:
		// http://stackoverflow.com/questions/57803/how-to-convert-decimal-to-hex-in-javascript
		/**
		 * @private
		 */
		dec2hex: function(i) {
	   		return (i+0x100).toString(16).substr(-2).toUpperCase();
		},
		
		/**
		 * @private
		 */
		processRFIDData: function(data) {

			var tagEvent = this._board.getValueFromTwo7bitBytes(data[1], data[2]);
			var tagEventType = "";
			var tag = "";
					
			for (var i=3, len=data.length; i<len; i+=2) {
				tag += this.dec2hex(this._board.getValueFromTwo7bitBytes(data[i], data[i+1]));
			}

			// change this to dispatch a single event and handle add or remove in object parameter?
			if (tagEvent == this.READ_EVENT) {
				this.dispatch(new RFIDEvent(RFIDEvent.ADD_TAG, tag));
			} else if (tagEvent == this.REMOVE_EVENT) {
				this.dispatch(new RFIDEvent(RFIDEvent.REMOVE_TAG, tag));
			} else {
				// got something else
				return;
			}
			
		},
		
		/**
		 * @private
		 */
		dispatch: function(event) {
			this.dispatchEvent(event);
		},
		
		// public methods:
		
		/* implement EventDispatcher */
		
		/**
		 * @param {String} type The event type
		 * @param {Function} listener The function to be called when the event is fired
		 */
		addEventListener: function(type, listener) {
			this._evtDispatcher.addEventListener(type, listener);
		},
		
		/**
		 * @param {String} type The event type
		 * @param {Function} listener The function to be called when the event is fired
		 */
		removeEventListener: function(type, listener) {
			this._evtDispatcher.removeEventListener(type, listener);
		},
		
		/**
		 * @param {String} type The event type
		 * return {boolean} True is listener exists for this type, false if not.
		 */
		hasEventListener: function(type) {
			return this._evtDispatcher.hasEventListener(type);
		},
		
		/**
		 * @param {Event} type The Event object
		 * @param {Object} optionalParams Optional parameters to assign to the event object.
		 * return {boolean} True if dispatch is successful, false if not.
		 */		
		dispatchEvent: function(event, optionalParams) {
			return this._evtDispatcher.dispatchEvent(event, optionalParams);
		}		

	};

	return ID12RFIDReader;

}());
