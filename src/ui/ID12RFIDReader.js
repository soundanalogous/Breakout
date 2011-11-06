/**
 * @author jeff hoefs
 */

ARDJS.namespace('ARDJS.ui.ID12RFIDReader');

ARDJS.ui.ID12RFIDReader = (function() {

	var ID12RFIDReader;

	// dependencies
	var EventDispatcher = ARDJS.EventDispatcher,
		ArduinoEvent = ARDJS.ArduinoEvent,
		RFIDEvent = ARDJS.ui.RFIDEvent;

	/**
	 * Creates a new ID12RFIDReader
	 *
	 * @exports ID12RFIDReader as ARDJS.ui.ID12RFIDReader
	 * @constructor
	 * @param {Class} board A reference to the Arduino class instance
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

		this.board = board;
		
		this._evtDispatcher = new EventDispatcher(this);

		board.addEventListener(ArduinoEvent.SYSEX_MESSAGE, this.onSysExMessage.bind(this));
			
	}

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
			var tagEvent = this.board.getValueFromTwo7bitBytes(data[1], data[2]);
			var tagEventType = "";
			var tag = "";
					
			for (var i=3, len=data.length; i<len; i+=2) {
				tag += dec2hex(this.board.getValueFromTwo7bitBytes(data[i], data[i+1]));
			}
			
			// change this to dispatch a single event and handle add or remove in object parameter?
			if (tagEvent == this.READ_EVENT) {
				dispatch(new RFIDEvent(RFIDEvent.ADD_TAG, tag));
			} else if (tagEvent == this.REMOVE_EVENT) {
				dispatch(new RFIDEvent(RFIDEvent.REMOVE_TAG, tag));
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

ARDJS.namespace('ARDJS.ui.RFIDEvent');

ARDJS.ui.RFIDEvent = (function() {
	"use strict";

	var RFIDEvent;

	// dependencies
	var Event = ARDJS.Event;

	/**
	 * @exports RFIDEvent as ARDJS.ui.RFIDEvent
	 * @constructor
	 * @augments ARDJS.Event
	 * @param {String} type The event type
	 * @param {String} tag The RFID tag value (hexadecimal)
	 */
	RFIDEvent = function(type, tag) {
		this.tag = tag;
		// call the super class
		// 2nd parameter is passed to EventDispatcher constructor
		Event.call(this, type);
	}

	/** @constant */
	RFIDEvent.ADD_TAG = "addTag";
	/** @constant */
	RFIDEvent.REMOVE_TAG = "removeTag";

	RFIDEvent.prototype = ARDJS.inherit(Event.prototype);
	RFIDEvent.prototype.constructor = RFIDEvent;

	return RFIDEvent;

}());
