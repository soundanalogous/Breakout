/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

BREAKOUT.namespace('BREAKOUT.WSocketEvent');

BREAKOUT.WSocketEvent = (function() {
	
	var WSocketEvent;

	// dependencies
	var Event = BREAKOUT.Event;

	/**
	 * @exports WSocketEvent as BREAKOUT.WSocketEvent
	 * @constructor
	 * @augments BREAKOUT.Event
	 * @param {String} type The event type
	 */
	WSocketEvent = function(type) {
		this.name = "WSocketEvent"; // for testing
		
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

	WSocketEvent.prototype = BREAKOUT.inherit(Event.prototype);
	WSocketEvent.prototype.constructor = WSocketEvent;	

	return WSocketEvent;

}());


/**
 * Wrapper for various client-side Websocket implementation to 
 * provide a consistent interface
 *
 * @author jeff hoefs
 */

BREAKOUT.namespace('BREAKOUT.WSocketWrapper');

BREAKOUT.WSocketWrapper = (function() {
	"use strict";

 	var WSocketWrapper;

 	// dependencies
 	var EventDispatcher = BREAKOUT.EventDispatcher,
 		WSocketEvent = BREAKOUT.WSocketEvent;

	/**
	 * Creates a wrapper for various websocket implementations to unify the interface.
	 *
	 * @exports WSocketWrapper as BREAKOUT.WSocketWrapper
	 * @constructor
	 * @param {String} host The host address of the web server.
	 * @param {Number} port The port to connect to on the web server.
	 * @param {Boolean} useSocketIO Set true to use socket.io implementation, set false to use
	 * native websocket implementation.
	 * @param {String} protocol The websockt protocol definition (if necessary).
	 */
	WSocketWrapper = function(host, port, useSocketIO, protocol) {
		this.name = "WSocketWrapper"; // for testing

		EventDispatcher.call(this, this);

		this._host = host;
		this._port = port;
		this._protocol = protocol || "default-protocol";
		this._useSocketIO = useSocketIO || false;
		this._socket = null;
		this._readyState = ""; // only applies to native WebSocket implementations

		this.init(this);

	};

	WSocketWrapper.prototype = BREAKOUT.inherit(EventDispatcher.prototype);
	WSocketWrapper.prototype.constructor = WSocketWrapper;

	/**
	 * Initialize the websocket
	 * @param {Object} self A reference to this websocket object.
	 * @private
	 */
	WSocketWrapper.prototype.init = function(self) {

		if (self._useSocketIO) {
			self._socket = io.connect("http://"+self._host+":"+self._port);

			try {
				self._socket.on('connect', function() {
					self.dispatchEvent(new WSocketEvent(WSocketEvent.CONNECTED));

					self._socket.on('message', function(msg) {
						self.dispatchEvent(new WSocketEvent(WSocketEvent.MESSAGE), {message: msg});
					});
				});
				
			} catch(exception){
				console.log("Error "+exception);
			}

		} else {
			
			try {

				if ("MozWebSocket" in window) {
					self._socket = new MozWebSocket("ws://"+self._host+":"+self._port, self._protocol);
				} else if ("WebSocket" in window) {
					// Safari doesn't like protocol parameter
					//self._socket = new WebSocket("ws://"+self._host+":"+self._port, self._protocol);
					self._socket = new WebSocket("ws://"+self._host+":"+self._port);
				} else {
					console.log("Websockets not supported by this browser");
					throw "Websockets not supported by this browser";
				}

				console.log("Starting up...");

				self._socket.onopen = function() {

					self.dispatchEvent(new WSocketEvent(WSocketEvent.CONNECTED));

					self._socket.onmessage = function(msg) {
						self.dispatchEvent(new WSocketEvent(WSocketEvent.MESSAGE), {message: msg.data});
					};

					self._socket.onclose = function() {
						self._readyState = self._socket.readyState;
						self.dispatchEvent(new WSocketEvent(WSocketEvent.CLOSE));	
					};

				};
				
			} catch(exception){
				console.log("Error "+exception);
			}
				
		}

	};

	/**
	 * Send a message
	 * @param {String} message The message to send
	 */
	WSocketWrapper.prototype.send = function(message) {
		// to do: ensure socket is not null before trying to send
		this._socket.send(message);
	};

	// to do: ensure socket is not null before trying to get readyState

	/**
	 * [read-only] Wrapper for the readyState method of the native websocket implementation
	 * <p>CONNECTING = 0, OPEN = 1, CLOSING = 2, CLOSED = 3</p>
	 * @name WSocketWrapper#readyState
	 * @property
	 * @type String
	 */		 
	WSocketWrapper.prototype.__defineGetter__("readyState", function() { return this._readyState; });

	return WSocketWrapper;

}());