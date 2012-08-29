/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.io.PotEvent');

BO.io.PotEvent = (function() {

	var PotEvent;

	// Dependencies
	var Event = JSUTILS.Event;

	/**
	 * @exports PotEvent as BO.io.PotEvent
	 * @class An Event object to be dispatched (fired) by a Potentiometer
	 * object.	 
	 * @constructor
	 * @augments JSUTILS.Event
	 * @param {String} type The event type
	 */
	PotEvent = function(type) {

		this.name = "PotEvent";
		
		// Call the super class
		// 2nd parameter is passed to EventDispatcher constructor
		Event.call(this, type);
	};

	// Events
	/** @constant */
	PotEvent.CHANGE = "potChange";	

	PotEvent.prototype = JSUTILS.inherit(Event.prototype);
	PotEvent.prototype.constructor = PotEvent;

	return PotEvent;

}());
