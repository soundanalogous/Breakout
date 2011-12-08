/**
 * @author jeff hoefs
 */

ARDJS.namespace('ARDJS.SocketEvent');

ARDJS.SocketEvent = (function() {
	
	var SocketEvent;

	// dependencies
	var Event = ARDJS.Event;

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

	SocketEvent.prototype = ARDJS.inherit(Event.prototype);
	SocketEvent.prototype.constructor = SocketEvent;	

	return SocketEvent;

}());


/**
 * Wrapper for various client-side Websocket implementation to 
 * provide a consistent interface
 *
 * @author jeff hoefs
 */

ARDJS.namespace('ARDJS.Socket');

ARDJS.Socket = (function() {
	"use strict";

 	var Socket;

 	// dependencies
 	var EventDispatcher = ARDJS.EventDispatcher,
 		SocketEvent = ARDJS.SocketEvent;

	Socket = function(host, port, useSocketIO, protocol) {
		this.name = "Socket"; // for testing

		EventDispatcher.call(this, this);

		this._host = host;
		this._port = port;
		this._protocol = protocol || "default-protocol";
		this._useSocketIO = useSocketIO || false;
		this._socket = null;
		this._readyState = ""; // only applies to native WebSocket implementations

		this.init(this);

	};

	Socket.prototype = ARDJS.inherit(EventDispatcher.prototype);
	Socket.prototype.constructor = Socket;

	Socket.prototype.init = function(self) {

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
					self._socket = new WebSocket("ws://"+self._host+":"+self._port, self._protocol);
				} else {
					console.log("Websockets not supported by this browser");
					throw "Websockets not supported by this browser";
					return;	
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

	Socket.prototype.send = function(message) {
		// to do: ensure socket is not null before trying to send
		this._socket.send(message);
	};

	// to do: ensure socket is not null before trying to get readyState
	Socket.prototype.__defineGetter__("readyState", function() { return this._readyState; });

	return Socket;

}());