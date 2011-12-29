/**
 * @author jeff hoefs
 */

BREAKOUT.namespace('BREAKOUT.SocketEvent');

BREAKOUT.SocketEvent = (function() {
	
	var SocketEvent;

	// dependencies
	var Event = BREAKOUT.Event;

	/**
	 * @exports SocketEvent as BREAKOUT.SocketEvent
	 * @constructor
	 * @augments BREAKOUT.Event
	 * @param {String} type The event type
	 */
	SocketEvent = function(type) {
		this.name = "SocketEvent"; // for testing
		
		// call the super class
		// 2nd parameter is passed to EventDispatcher constructor
		Event.call(this, type);		
	};

	// events
	/** @constant */
	SocketEvent.CONNECTED = "socketConnected";
	/** @constant */
	SocketEvent.MESSAGE = "socketMessage";
	/** @constant */
	SocketEvent.CLOSE = "socketClosed";

	SocketEvent.prototype = BREAKOUT.inherit(Event.prototype);
	SocketEvent.prototype.constructor = SocketEvent;	

	return SocketEvent;

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
 		SocketEvent = BREAKOUT.SocketEvent;

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
					self.dispatchEvent(new SocketEvent(SocketEvent.CONNECTED));

					self._socket.on('message', function(msg) {
						self.dispatchEvent(new SocketEvent(SocketEvent.MESSAGE), {message: msg});
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

					self.dispatchEvent(new SocketEvent(SocketEvent.CONNECTED));

					self._socket.onmessage = function(msg) {
						self.dispatchEvent(new SocketEvent(SocketEvent.MESSAGE), {message: msg.data});
					};

					self._socket.onclose = function() {
						self._readyState = self._socket.readyState;
						self.dispatchEvent(new SocketEvent(SocketEvent.CLOSE));	
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