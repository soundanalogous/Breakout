/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.io.GyroEvent');

BO.io.GyroEvent = (function() {

	var GyroEvent;

	// dependencies
	var Event = JSUTILS.Event;

	/**
	 * @exports GyroEvent as BO.io.GyroEvent
	 * @class An Event object to be dispatched (fired) by a Gyroscope
	 * object.	 
	 * @constructor
	 * @augments JSUTILS.Event
 	 * @param {String} type The event type	 
	 */
	GyroEvent = function(type) {

		Event.call(this, type);

		this.name = "GyroEvent";

	};

	/** @constant */
	GyroEvent.GYRO_READY = "gyroReady";
	/** @constant */
	GyroEvent.UPDATE = "update";
	

	GyroEvent.prototype = JSUTILS.inherit(Event.prototype);
	GyroEvent.prototype.constructor = GyroEvent;

	return GyroEvent;

}());
