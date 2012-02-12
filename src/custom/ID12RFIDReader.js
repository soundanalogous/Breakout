/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */
 
JSUTILS.namespace('BO.custom.RFIDEvent');

BO.custom.RFIDEvent = (function() {
	"use strict";

	var RFIDEvent;

	// dependencies
	var Event = JSUTILS.Event;

	/**
	 * @exports RFIDEvent as BO.custom.RFIDEvent
	 * @constructor
	 * @augments JSUTILS.Event
	 * @param {String} type The event type
	 * @param {String} tag The RFID tag value (hexadecimal)
	 */
	RFIDEvent = function(type, tag) {
		this._tag = tag;
		// call the super class
		// 2nd parameter is passed to EventDispatcher constructor
		Event.call(this, type);

		this.name = "RFIDEvent";
	};

	/** @constant */
	RFIDEvent.ADD_TAG = "addTag";
	/** @constant */
	RFIDEvent.REMOVE_TAG = "removeTag";

	RFIDEvent.prototype = JSUTILS.inherit(Event.prototype);
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


JSUTILS.namespace('BO.custom.ID12RFIDReader');

BO.custom.ID12RFIDReader = (function() {

	var ID12RFIDReader;

	// private static constants:
	var	ID12_READER = 13,
		READ_EVENT = 1,
		REMOVE_EVENT = 2;

	// dependencies
	var EventDispatcher = JSUTILS.EventDispatcher,
		IOBoardEvent = BO.IOBoardEvent,
		RFIDEvent = BO.custom.RFIDEvent;

	/**
	 * Innovations ID-12 RFID Reader.
	 * <p>To use this object with standard io objects in Breakout, 
	 * RFIDFirmata must be uploaded to the IOBoard rather than StandardFirmata. 
	 * See custom_examples/readme.txt for insturctions.</p>
	 *
	 * <p>Is is also possible to create a custom application for your
	 * IOBoard that includes the RFID reader. See IDx_Reader_Firmata_Example
	 * in the IDxRFIDReader library example files.</p>
	 *
	 * @exports ID12RFIDReader as BO.custom.ID12RFIDReader
	 * @constructor
	 * @param {IOBoard} board A reference to the IOBoard instance
	 * @param {Number} readerId The ID assigned to the reader in the firmware
	 * running on the IOBoard (default = 13)
	 */
	ID12RFIDReader = function(board, readerId) {
		"use strict";

		this.name = "ID12RFIDReader";

		this._readerId = readerId || ID12_READER;
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

			if (message[0] != this._readerId) {
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
			if (tagEvent == READ_EVENT) {
				this.dispatch(new RFIDEvent(RFIDEvent.ADD_TAG, tag));
			} else if (tagEvent == REMOVE_EVENT) {
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


	// document events

	/**
	 * The addTag event is dispatched when a new tag is read.
	 * @name ID12RFIDReader#addTag
	 * @type BO.custom.RFIDEvent.ADD_TAG
	 * @event
	 * @param {BO.custom.ID12RFIDReader} target A reference to the ID12RFIDReader object.
	 * @param {String} tag The RFID tag value.	 
	 */
	 
	/**
	 * The removeTag event is dispatched when a tag is removed from the reader.
	 * @name ID12RFIDReader#removeTag
	 * @type BO.custom.RFIDEvent.REMOVE_TAG
	 * @event
	 * @param {BO.custom.ID12RFIDReader} target A reference to the ID12RFIDReader object.
	 * @param {String} tag The RFID tag value.	 
	 */		 	

	return ID12RFIDReader;

}());
