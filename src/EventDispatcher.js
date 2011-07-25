/* EventDispatcher.js
 * jeff hoefs 7/21/11
 *
 * example usage:
 *
 *	// EventDispatcherSubClass.js
 *  function EventDispatcherSubClass() {
 *		var self = this;
 *		
 * 		// call the super class
 *		// 2nd parameter is passed to EventDispatcher constructor
 *		EventDispatcher.call(this, this);
 *
 *		// some properties, methods, etc...
 * 
 *		someMethod() {
 *			self.dispatchEvent(new CustomEvent(CustomEvent.EVENT_TYPE, {v1: 0, v2: 0}));
 *			// or: - basically any way you want to handle additional params in custom event
 *			//var v1 = 0;
 *			//var v2 = 0;
 *			//self.dispatchEvent(new CustomEvent(CustomEvent.EVENT_TYPE, v1, v2));
 *			// or:
 *			//self.dispatchEvent(new Event(Event.EVENT_TYPE));
 *		}
 *	}
 *
 *
 *	SubClass.prototype = new EventDispatcher();
 *	SubClass.constructor = Subclass;
 *
 *	function CustomEvent(type, data) {
 *		this.data = data;
 *		// call the super class
 *		// 2nd parameter is passed to EventDispatcher constructor
 *		Event.call(this, type);
 *	}
 *	
 *	CustomEvent.prototype = new Event();
 *	CustomEvent.constructor = CustomEvent;
 *
 *
 *	// Application.js
 *	// assuming jquery (but could use any or no framework)
 *	$(document).ready(function() {
 *		var evtSubClass = new EventDispatcherSubClass();
 *
 *		evtSubClass.addEventListener(CustomEvent.EVENT_TYPE, onCustomEvent);
 *
 *		function onCustomEvent(event) {
 *			console.log(event.type);
 *			console.log(event.target);
 *			console.log(event.data.v1);
 *			console.log(event.data.v2);
 *		}
 *	}
 *
 */
 
function EventDispatcher(target) {
	"use strict";
	
	console.log("constructor called, target = " + target);

	var _target = target || null;
	var _eventListeners = {};
	
	this.addEventListener = function (type, listener) {
		if(!_eventListeners[type]) {
			_eventListeners[type] = [];
		}
		_eventListeners[type].push(listener);
	}
	
	this.removeEventListener = function(type, listener) {
		for (var i=0, len = _eventListeners[type].length; i<len; i++) {
			if (_eventListeners[type][i] == listener) {
				_eventListeners[type].splice(i, 1);
			}
		}
	}
	
	this.hasEventListener = function(type) {
		// to do: implement this method
		if (_eventListeners[type]) {
			return true;
		} else {
			return false;
		}	
	}
	
	this.dispatchEvent = function(event) {
		event.target = _target;
					
		if (this.hasEventListener(event.type)) {
			for (var j=0, len=_eventListeners[event.type].length; j<len; j++) {
				try {
					_eventListeners[event.type][j].call(this, event);
				} catch(e) {
					// to do: handle error
				}
			}
		}
		//return this;	
	}
		
	/*
	// DOM-like implementation, pass type and optional args
	this.dispatchEvent = function(event) {
			
		var args = [];
		for (var i=1, len=arguments.length; i<len; i++) {
			args.push(arguments[i]);
		}
		//if (_eventListeners[event]) {
		if (this.hasEventListener(event)) {
			for (var j=0, len=_eventListeners[event].length; j<len; j++) {
				try {
					_eventListeners[event][j].apply(this, args);
				} catch(e) {
					// to do: handle error
				}
			}
		}
		//return this;
	}
	*/
}

// Event 'base class'
function Event(type) {
	this.type = type;
	this.target = null;
}

Event.CONNECTED = "connected";
Event.CHANGE	= "change";
Event.COMPLETE	= "complete";
