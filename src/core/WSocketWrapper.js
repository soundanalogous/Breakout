/**
 * Copyright (c) 2011-2014 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.WSocketWrapper');

BO.WSocketWrapper = (function () {
    "use strict";

    var WSocketWrapper;

    // dependencies
    var EventDispatcher = JSUTILS.EventDispatcher,
        WSocketEvent = BO.WSocketEvent;

    var READY_STATE = {
        "CONNECTING": 0,
        "OPEN": 1,
        "CLOSING": 2,
        "CLOSED": 3
    };

    /**
     * Creates a wrapper for various websocket implementations to unify the
     * interface.
     *
     * @class WSocketWrapper
     * @constructor
     * @uses JSUTILS.EventDispatcher
     * @param {String} host The host address of the web server.
     * @param {Number} port The port to connect to on the web server.
     * native websocket implementation.
     * @param {String} protocol The websockt protocol definition (if necessary).
     */
    WSocketWrapper = function (host, port, protocol) {
        this.name = "WSocketWrapper";

        EventDispatcher.call(this, this);

        this._host = host;
        this._port = port;
        this._protocol = protocol || "default-protocol";
        this._socket = null;
        this._readyState = null; // only applies to native WebSocket implementations

        this.init(this);

    };

    WSocketWrapper.prototype = JSUTILS.inherit(EventDispatcher.prototype);
    WSocketWrapper.prototype.constructor = WSocketWrapper;

    /**
     * Initialize the websocket
     * @private
     * @method init
     * @param {Object} self A reference to this websocket object.
     */
    WSocketWrapper.prototype.init = function (self) {

        // if io (socket.io) is defined, assume that the node server is being used
        if (typeof io !== "undefined") {
            self._socket = io.connect("http://" + self._host + ":" + self._port);

            try {
                /** @private */
                self._socket.on('connect', function () {
                    // prevent socket.io from automatically attempting to reconnect
                    // when the server is quit
                    self._socket.socket.options.reconnect = false;

                    // set this for compatibility with native WebSocket
                    self._readyState = READY_STATE.OPEN;
                    
                    self.dispatchEvent(new WSocketEvent(WSocketEvent.CONNECTED));
                    /** @private */
                    self._socket.on('message', function (msg) {
                        self.dispatchEvent(new WSocketEvent(WSocketEvent.MESSAGE), {message: msg});
                    });
                });
                
            } catch (exception) {
                console.log("Error " + exception);
            }

        } else {
            
            try {

                if ("MozWebSocket" in window) {
                    // MozWebSocket is no longer used in Firefox 11 and higher
                    self._socket = new MozWebSocket("ws://" + self._host + ":" + self._port + '/websocket', self._protocol);
                } else if ("WebSocket" in window) {
                    // Safari doesn't like protocol parameter
                    //self._socket = new WebSocket("ws://"+self._host+":"+self._port, self._protocol);
                    self._socket = new WebSocket("ws://" + self._host + ":" + self._port + '/websocket');
                } else {
                    console.log("Websockets not supported by this browser");
                    throw new Error("Websockets not supported by this browser");
                }
                self._readyState = self._socket.readyState;

                /** @private */
                self._socket.onopen = function () {

                    self._readyState = self._socket.readyState;
                    self.dispatchEvent(new WSocketEvent(WSocketEvent.CONNECTED));

                    /** @private */
                    self._socket.onmessage = function (msg) {
                        self.dispatchEvent(new WSocketEvent(WSocketEvent.MESSAGE), {message: msg.data});
                    };
                    /** @private */
                    self._socket.onclose = function () {
                        self._readyState = self._socket.readyState;
                        self.dispatchEvent(new WSocketEvent(WSocketEvent.CLOSE));
                    };

                };
                
            } catch (exception) {
                console.log("Error " + exception);
            }
                
        }

    };

    /**
     * Send a message
     * TO DO: support sending ArrayBuffers and Blobs
     * For now, forward any calls to sendString
     * @private
     * @method send
     * @param {String} message The message to send
     */
    WSocketWrapper.prototype.send = function (message) {
        // to do: ensure socket is not null before trying to send
        //this._socket.send();
        this.sendString(message);
    };

    /**
     * Send a message
     * @method sendString
     * @param {String} message The message to send
     */
    WSocketWrapper.prototype.sendString = function (message) {
        if (this.readyState === READY_STATE.OPEN) {
            this._socket.send(message.toString());
        }
    };

    /**
     * [read-only] Wrapper for the readyState method of the native websocket implementation
     * <p>CONNECTING = 0, OPEN = 1, CLOSING = 2, CLOSED = 3</p>
     * @property readyState
     * @type String
     */
    Object.defineProperty(WSocketWrapper.prototype, "readyState", {
        get: function () {
            return this._readyState;
        }
    });


    // document events

    /**
     * The webSocketConnected event is dispatched when a connection with
     * the websocket is established.
     * @type BO.WebsocketEvent.CONNECTED
     * @event webSocketConnected
     * @param {BO.WSocketWrapper} target A reference to the WSocketWrapper object.
     */

    /**
     * The webSocketMessage event is dispatched when a websocket message is received.
     * @type BO.WebsocketEvent.MESSAGE
     * @event webSocketMessage
     * @param {BO.WSocketWrapper} target A reference to the WSocketWrapper object.
     * @param {String} message The websocket data    
     */

    /**
     * The webSocketClosed event is dispatched the websocket connection is closed.
     * @type BO.WebsocketEvent.CLOSE
     * @event webSocketClosed
     * @param {BO.WSocketWrapper} target A reference to the WSocketWrapper object. 
     */

    return WSocketWrapper;

}());