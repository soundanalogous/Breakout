/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.io.SoftPotEvent');

BO.io.SoftPotEvent = (function() {

	var SoftPotEvent;

	// Dependencies
	var Event = JSUTILS.Event;

	/**
	 * @exports SoftPotEvent as BO.io.SoftPotEvent
	 * @class An Event object to be dispatched (fired) by a SoftPot
	 * object.	 
	 * @constructor
	 * @augments JSUTILS.Event
 	 * @param {String} type The event type
 	 * @param {Number} touchPoint The value where the softpot was touched	 
	 */
	SoftPotEvent = function(type, touchPoint) {

		this.name = "SoftPotEvent";

		Event.call(this, type);
		this._touchPoint = touchPoint;
	};

	/** @constant */
	SoftPotEvent.PRESS = "softPotPressed";
	/** @constant */
	SoftPotEvent.RELEASE = "softPotRelease";
	/** @constant */
	SoftPotEvent.DRAG = "softPotDrag";
	/** @constant */
	SoftPotEvent.FLICK_UP = "softPotFlickUp";
	/** @constant */
	SoftPotEvent.FLICK_DOWN = "softPotFlickDown";
	/** @constant */
	SoftPotEvent.TAP = "softPotTap";		

	SoftPotEvent.prototype = JSUTILS.inherit(Event.prototype);
	SoftPotEvent.prototype.constructor = SoftPotEvent;

	/**
	 * The value of the softpot.
	 * 
	 * @name SoftPotEvent#value
	 * @property
	 * @type Number
	 */ 
	SoftPotEvent.prototype.__defineGetter__("value", function() { return this._touchPoint; });	
	SoftPotEvent.prototype.__defineSetter__("value", function(val) { this._touchPoint = val; });

	return SoftPotEvent;

}());
