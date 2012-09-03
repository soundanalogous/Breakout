/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('JSUTILS.EventDispatcher');

JSUTILS.EventDispatcher = (function () {

	var EventDispatcher;

	/**
	 * An DOM-like or as3-like EventDispatcher class.
	 *
	 * @class The EventDispatcher class mimics the DOM event dispatcher model so the 
	 * user can add and remove event listeners in a familiar way. Event bubbling is
	 * not available because events are dispatched in relation to state changes of
	 * physical components instead of layered graphics so there is nothing to bubble up.
	 * @exports EventDispatcher as JSUTILS.EventDispatcher
	 * @param {Class} target The instance of the class that implements EventDispatcher
	 */
	EventDispatcher = function(target) {
		"use strict";
		
		this._target = target || null;
		this._eventListeners = {};
		
		this.name = "EventDispatcher";
	};

	EventDispatcher.prototype = {

		/**
		 * Description
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
		 * Description
		 * @param {String} type The event type
		 * @param {Function} listener The function to be called when the event is fired
		 */
		removeEventListener: function(type, listener) {
			for (var i=0, len = this._eventListeners[type].length; i<len; i++) {
				if (this._eventListeners[type][i] === listener) {
					this._eventListeners[type].splice(i, 1);
				}
			}
			// To Do: If no more listeners for a type, delete key?
		},
		
		/**
		 * Description
		 * @param {String} type The event type
		 * return {boolean} True is listener exists for this type, false if not.
		 */
		hasEventListener: function(type) {
			if (this._eventListeners[type] && this._eventListeners[type].length > 0) {
				return true;
			} else {
				return false;
			}	
		},
		
		/**
		 * Description
		 * @param {Event} type The Event object.
		 * @param {Object} optionalParams Optional parameters passed as an object.
		 * return {boolean} True if dispatch is successful, false if not.
		 */	
		dispatchEvent: function(event, optionalParams) {
			
			event.target = this._target;
			var isSuccess = false;		

			// Add any optional params to the Event object
			for (var obj in optionalParams) {
				event[obj.toString()] = optionalParams[obj];
			}
						
			if (this.hasEventListener(event.type)) {
				for (var j=0, len=this._eventListeners[event.type].length; j<len; j++) {
					try {
						this._eventListeners[event.type][j].call(this, event);
						isSuccess = true;
					} catch(e) {
						// To Do: Handle error
						console.log("error: Error calling event handler. " + e);
					}
				}
			}
			return isSuccess;	
		}
	};

	return EventDispatcher;

}());
