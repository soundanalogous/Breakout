/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('JSUTILS.Event');

JSUTILS.Event = (function() {

	var Event;

	/** 
	 * Event 'base class' (but it can also be instantiated directly)
	 *
	 * @exports Event as JSUTILS.Event
	 * @constructor
	 * @param {String} type event type
	 */
	Event = function(type) {
		/** @property {String} type The event type. */
		this.type = type;
		/** @property {Object} target The event target. */
		this.target = null;

		this.name = "Event"; // for testing
	};

	/** @constant */
	Event.CONNECTED = "connected";
	/** @constant */
	Event.CHANGE	= "change";
	/** @constant */
	Event.COMPLETE	= "complete";

	return Event;

}());