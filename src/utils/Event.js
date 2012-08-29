/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('JSUTILS.Event');

JSUTILS.Event = (function() {

	var Event;

	/** 
	 * A base class for the creation of Event objects.
	 *
	 * @class A base class for the creation of Event objects.
	 * @exports Event as JSUTILS.Event
	 * @param {String} type event type
	 */
	Event = function(type) {

		this._type = type;
		this._target = null;

		this.name = "Event";
	};

	Event.prototype = {
		/**
		 * The event type
		 * @name Event#type
		 * @type String
		 */ 		
		get type() {
			return this._type;
		},
		set type(val) {
			this._type = val;
		},

		/**
		 * The event target
		 * @name Event#target
		 * @type Object
		 */ 
		get target() {
			return this._target;
		},
		set target(val) {
			this._target = val;
		}

	};

	// Generic events

	/** 
	 * Description
	 * @constant
	 */
	Event.CONNECTED = "connected";
	/** 
	 * Description
	 * @constant
	 */
	Event.CHANGE	= "change";
	/** 
	 * Description
	 * @constant
	 */
	Event.COMPLETE	= "complete";

	return Event;

}());
