/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.WSocketEvent');

BO.WSocketEvent = (function() {
	
	var WSocketEvent;

	// dependencies
	var Event = JSUTILS.Event;

	/**
	 * @exports WSocketEvent as BO.WSocketEvent
	 * @class Dispatches Websocket events: Connected (onopen), Message (onmessge) 
	 * and Closed (onclose) objects.	 
	 * @constructor
	 * @augments JSUTILS.Event
	 * @param {String} type The event type
	 */
	WSocketEvent = function(type) {
		this.name = "WSocketEvent";
		
		// call the super class
		// 2nd parameter is passed to EventDispatcher constructor
		Event.call(this, type);		
	};

	// events
	/** @constant */
	WSocketEvent.CONNECTED = "webSocketConnected";
	/** @constant */
	WSocketEvent.MESSAGE = "webSocketMessage";
	/** @constant */
	WSocketEvent.CLOSE = "webSocketClosed";

	WSocketEvent.prototype = JSUTILS.inherit(Event.prototype);
	WSocketEvent.prototype.constructor = WSocketEvent;	

	return WSocketEvent;

}());