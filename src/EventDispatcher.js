/**
 * @author Jeff Hoefs
 */

/**
 * An as3-like EventDispatcher class.
 *
 * @constructor
 * @param {Class} target The instance of the class that implements EventDispatcher
 */
function EventDispatcher(target) {
	"use strict";
	
	var _target = target || null;
	var _eventListeners = {};
	
	/**
	 * @param {String} type The event type
	 * @param {Function} listener The function to be called when the event is fired
	 */
	this.addEventListener = function (type, listener) {
		if(!_eventListeners[type]) {
			_eventListeners[type] = [];
		}
		_eventListeners[type].push(listener);
	}
	
	/**
	 * @param {String} type The event type
	 * @param {Function} listener The function to be called when the event is fired
	 */
	this.removeEventListener = function(type, listener) {
		for (var i=0, len = _eventListeners[type].length; i<len; i++) {
			if (_eventListeners[type][i] == listener) {
				_eventListeners[type].splice(i, 1);
			}
		}
	}
	
	/**
	 * @param {String} type The event type
	 * return {boolean} True is listener exists for this type, false if not.
	 */
	this.hasEventListener = function(type) {
		// to do: implement this method
		if (_eventListeners[type]) {
			return true;
		} else {
			return false;
		}	
	}
	
	/**
	 * @param {Event} type The Event object
	 * return {boolean} True if dispatch is successful, false if not.
	 */	
	this.dispatchEvent = function(event) {
		event.target = _target;
		var isSuccess = false;
					
		if (this.hasEventListener(event.type)) {
			for (var j=0, len=_eventListeners[event.type].length; j<len; j++) {
				try {
					_eventListeners[event.type][j].call(this, event);
					isSuccess = true;
				} catch(e) {
					// to do: handle error
				}
			}
		}
		return isSuccess;	
	}
		
	/*
	// DOM-like implementation, pass type and optional args
	this.dispatchEvent = function(event) {
		var isSuccess = false;
		
		var args = [];
		args.push(_target);
		for (var i=1, len=arguments.length; i<len; i++) {
			args.push(arguments[i]);
		}
		
		//if (_eventListeners[event]) {
		if (this.hasEventListener(event)) {
			for (var j=0, len=_eventListeners[event].length; j<len; j++) {
				try {
					_eventListeners[event][j].apply(this, args);
					isSuccess = true;
				} catch(e) {
					// to do: handle error
				}
			}
		}
		return isSuccess;
	}
	*/
}

/** 
 * Event 'base class' (but it can also be instantiated directly)
 *
 * @constructor
 * @param {String} type event type
 */
function Event(type) {
	this.type = type;
	this.target = null;
}

/** @constant */
Event.CONNECTED = "connected";
/** @constant */
Event.CHANGE	= "change";
/** @constant */
Event.COMPLETE	= "complete";
