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
	 * @class An Event object to be dispatched when an RFID tag
	 * is read or when an RFID tag is removed from a reader.
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