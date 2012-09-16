/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.WSocketWrapper');

BO.WSocketWrapper = (function() {
	"use strict";

 	var WSocketWrapper;

 	// dependencies
 	var EventDispatcher = JSUTILS.EventDispatcher,
 		WSocketEvent = BO.WSocketEvent;

	/**
	 * Creates a wrapper for various websocket implementations to unify the interface.
	 *
	 * @exports WSocketWrapper as BO.WSocketWrapper
	 * @class Creates a wrapper for various websocket implementations to unify the interface.
	 * @constructor
	 * @param {String} host The host address of the web server.
	 * @param {Number} port The port to connect to on the web server.
	 * native websocket implementation.
	 * @param {String} protocol The websockt protocol definition (if necessary).
	 */
	WSocketWrapper = function(host, port, protocol) {
		this.name = "WSocketWrapper";

		EventDispatcher.call(this, this);

		this._host = host;
		this._port = port;
		this._protocol = protocol || "default-protocol";
		this._socket = null;
		this._readyState = ""; // only applies to native WebSocket implementations

		this.init(this);

	};

	WSocketWrapper.prototype = JSUTILS.inherit(EventDispatcher.prototype);
	WSocketWrapper.prototype.constructor = WSocketWrapper;

	/**
	 * Initialize the websocket
	 * @param {Object} self A reference to this websocket object.
	 * @private
	 */
	WSocketWrapper.prototype.init = function(self) {

		// if io (socket.io) is defined, assume that the node server is being used
		if (typeof io !== "undefined") {
			self._socket = io.connect("http://"+self._host+":"+self._port);

			try {
				/** @private */
				self._socket.on('connect', function() {
					// prevent socket.io from automatically attempting to reconnect
					// when the server is quit
					self._socket.socket.options.reconnect = false;
					
					self.dispatchEvent(new WSocketEvent(WSocketEvent.CONNECTED));
					/** @private */
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
					// MozWebSocket is no longer used in Firefox 11 and higher
					self._socket = new MozWebSocket("ws://"+self._host+":"+self._port+'/websocket', self._protocol);
				} else if ("WebSocket" in window) {
					// Safari doesn't like protocol parameter
					//self._socket = new WebSocket("ws://"+self._host+":"+self._port, self._protocol);
					self._socket = new WebSocket("ws://"+self._host+":"+self._port+'/websocket');
				} else {
					console.log("Websockets not supported by this browser");
					throw "Websockets not supported by this browser";
				}
				/** @private */
				self._socket.onopen = function() {

					self.dispatchEvent(new WSocketEvent(WSocketEvent.CONNECTED));
					/** @private */
					self._socket.onmessage = function(msg) {
						self.dispatchEvent(new WSocketEvent(WSocketEvent.MESSAGE), {message: msg.data});
					};
					/** @private */
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
	 * TO DO: support sending ArrayBuffers and Blobs
	 * for now, forward any calls to sendString
	 * @private
	 * @param {String} message The message to send
	 */
	WSocketWrapper.prototype.send = function(message) {
		// to do: ensure socket is not null before trying to send
		//this._socket.send();
		this.sendString(message);
	};

	/**
	 * Send a message
	 * @param {String} message The message to send
	 */
	WSocketWrapper.prototype.sendString = function(message) {
		// to do: ensure socket is not null before trying to send
		this._socket.send(message.toString());
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


	// document events

	/**
	 * The webSocketConnected event is dispatched when a connection with
	 * the websocket is established.
	 * @name WSocketWrapper#webSocketConnected
	 * @type BO.WebsocketEvent.CONNECTED
	 * @event
	 * @param {BO.WSocketWrapper} target A reference to the WSocketWrapper object.
	 */	

	/**
	 * The webSocketMessage event is dispatched when a websocket message is received.
	 * @name WSocketWrapper#webSocketMessage
	 * @type BO.WebsocketEvent.MESSAGE
	 * @event
	 * @param {BO.WSocketWrapper} target A reference to the WSocketWrapper object.
	 * @param {String} message The websocket data	 
	 */	

	/**
	 * The webSocketClosed event is dispatched the websocket connection is closed.
	 * @name WSocketWrapper#webSocketClosed
	 * @type BO.WebsocketEvent.CLOSE
	 * @event
	 * @param {BO.WSocketWrapper} target A reference to the WSocketWrapper object. 
	 */		 

	return WSocketWrapper;

}());