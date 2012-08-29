/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.PinEvent');

BO.PinEvent = (function() {

	var PinEvent;

	// Dependencies
	var Event = JSUTILS.Event;

	/**
	 * @exports PinEvent as BO.PinEvent
	 * @class An Event object to be dispatched (fired) by a Pin
	 * object.	 
	 * @constructor
	 * @augments JSUTILS.Event
	 * @param {String} type The event type
	 */
	PinEvent = function(type) {

		this.name = "PinEvent";
		
		// Call the super class
		// 2nd parameter is passed to EventDispatcher constructor
		Event.call(this, type);
	};

	// Events
	/** @constant */
	PinEvent.CHANGE = "pinChange";
	/** @constant */
	PinEvent.RISING_EDGE = "risingEdge";
	/** @constant */
	PinEvent.FALLING_EDGE = "fallingEdge";
	

	PinEvent.prototype = JSUTILS.inherit(Event.prototype);
	PinEvent.prototype.constructor = PinEvent;

	return PinEvent;

}());
