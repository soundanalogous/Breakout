/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.io.ButtonEvent');

BO.io.ButtonEvent = (function() {

	var ButtonEvent;

	// Dependencies
	var Event = JSUTILS.Event;

	/**
	 * @exports ButtonEvent as BO.io.ButtonEvent
	 * @class An Event object to be dispatched (fired) by a Button
	 * object.	 
	 * @constructor
	 * @augments JSUTILS.Event
 	 * @param {String} type The event type	 
	 */
	ButtonEvent = function(type) {

		this.name = "ButtonEvent";

		Event.call(this, type);
	};

	/** @constant */
	ButtonEvent.PRESS = "pressed";
	/** @constant */
	ButtonEvent.RELEASE = "released";
	/** @constant */
	ButtonEvent.LONG_PRESS = "longPress";
	/** @constant */
	ButtonEvent.SUSTAINED_PRESS = "sustainedPress";

	ButtonEvent.prototype = JSUTILS.inherit(Event.prototype);
	ButtonEvent.prototype.constructor = ButtonEvent;

	return ButtonEvent;

}());
