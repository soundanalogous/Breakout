/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BREAKOUT.io.AccelerometerEvent');

BREAKOUT.io.AccelerometerEvent = (function() {

	var AccelerometerEvent;

	// dependencies
	var Event = JSUTILS.Event;

	/**
	 * @exports AccelerometerEvent as BREAKOUT.io.AccelerometerEvent
	 * @constructor
	 * @augments JSUTILS.Event
 	 * @param {String} type The event type	 
	 */
	AccelerometerEvent = function(type) {

		Event.call(this, type);

		this.name = "AccelerometerEvent";

	};

	/** @constant */
	AccelerometerEvent.UPDATE = "update";
	

	AccelerometerEvent.prototype = JSUTILS.inherit(Event.prototype);
	AccelerometerEvent.prototype.constructor = AccelerometerEvent;

	return AccelerometerEvent;

}());
