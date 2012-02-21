/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.io.AccelerometerEvent');

BO.io.AccelerometerEvent = (function() {

	var AccelerometerEvent;

	// dependencies
	var Event = JSUTILS.Event;

	/**
	 * @exports AccelerometerEvent as BO.io.AccelerometerEvent
	 * @class An Event object to be dispatched (fired) by an Accelerometer
	 * object.
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
