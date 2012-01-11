/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

BREAKOUT.namespace('BREAKOUT.EventDispatcher');

BREAKOUT.EventDispatcher = (function () {

	var EventDispatcher;

	/**
	 * An as3-like EventDispatcher class.
	 *
	 * @exports EventDispatcher as BREAKOUT.EventDispatcher
	 * @constructor
	 * @param {Class} target The instance of the class that implements EventDispatcher
	 */
	EventDispatcher = function(target) {
		"use strict";
		
		this._target = target || null;
		this._eventListeners = {};
		
		this.name = "EventDispatcher"; // for testing	
	};

	EventDispatcher.prototype = {

		/**
		 * @param {String} type The event type
		 * @param {Function} listener The function to be called when the event is fired
		 */
		addEventListener: function (type, listener) {
			if(!this._eventListeners[type]) {
				this._eventListeners[type] = [];
			}
			this._eventListeners[type].push(listener);
		},
		
		/**
		 * @param {String} type The event type
		 * @param {Function} listener The function to be called when the event is fired
		 */
		removeEventListener: function(type, listener) {
			for (var i=0, len = this._eventListeners[type].length; i<len; i++) {
				if (this._eventListeners[type][i] == listener) {
					this._eventListeners[type].splice(i, 1);
				}
			}
		},
		
		/**
		 * @param {String} type The event type
		 * return {boolean} True is listener exists for this type, false if not.
		 */
		hasEventListener: function(type) {
			// to do: implement this method
			if (this._eventListeners[type]) {
				return true;
			} else {
				return false;
			}	
		},
		
		/**
		 * @param {Event} type The Event object.
		 * @param {Object} optionalParams Optional parameters passed as an object.
		 * return {boolean} True if dispatch is successful, false if not.
		 */	
		dispatchEvent: function(event, optionalParams) {
			
			event.target = this._target;
			var isSuccess = false;		

			// add any optional params to the Event object
			for (var obj in optionalParams) {
				event[obj.toString()] = optionalParams[obj];
			}
						
			if (this.hasEventListener(event.type)) {
				for (var j=0, len=this._eventListeners[event.type].length; j<len; j++) {
					try {
						this._eventListeners[event.type][j].call(this, event);
						isSuccess = true;
					} catch(e) {
						// to do: handle error
					}
				}
			}
			return isSuccess;	
		}


	};

	return EventDispatcher;

}());
