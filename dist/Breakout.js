/*!
 * Breakout v0.3.0 - 2013-07-27

 * Copyright (c) 2011-2013 Jeff Hoefs <soundanalogous@gmail.com> 
 * Released under the MIT license. See LICENSE file for details.
 * http://breakoutjs.com
 */
/**
 * @version 0.3.0
 *
 * <p>Namespace for Breakout objects.</p>
 *
 * <p>You can use the shorthand "BO" instead of "BREAKOUT".</p>
 *
 * @namespace BO
 */
var BO = BO || {};

// allow either namespace BO or BREAKOUT
var BREAKOUT = BREAKOUT || BO;

BREAKOUT.VERSION = '0.3.0';

/**
 * The BO.enableDebugging flag can be set to true in an application
 * to print debug messages from various Breakout objects to the
 * console. By default it is false and only needs to be included
 * in an application if you intend to set it to true
 * @name BO#enableDebugging
 * @type {Boolean}
 */
BO.enableDebugging = false;
/**
 * Namespace and utility functions
 * @namespace JSUTILS
 */
var JSUTILS = JSUTILS || {};


// Utility functions

/** 
 * Use this function to safely create a new namespace
 * if a namespace already exists, it won't be recreated.
 *
 * @param {String} namespaceString The namespace as a string.
 */
JSUTILS.namespace = function (namespaceString) {
    var parts = namespaceString.split('.'),
        parent = window,
        i;
            
    for (i = 0; i < parts.length; i += 1) {
        // create a property if it doesn't exist
        if (typeof parent[parts[i]] === "undefined") {
            parent[parts[i]] = {};
        }
        parent = parent[parts[i]];
    }
    return parent;
};

/**
 * Use this method rather than Object.create() directly if
 * browser compatibility is unknown.
 *
 * @param {Object} p The prototype of the object to inherit.
 */
JSUTILS.inherit = function (p) {
    if (p === null) {
        throw new TypeError(); // p must be a non-null object
    }
    if (Object.create) { // If Object.create() is defined...
        return Object.create(p); // then just use it
    }
    var t = typeof p; // otherwise do some more type checking
    if (t !== "object" && t !== "function") {
        throw new TypeError();
    }
    function F() {} // define a dummy constructor function
    F.prototype = p; // Set its prototype property to p
    return new F(); // use f() to create an 'heir' of p.
};


// Copied from https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
if (!Function.prototype.bind) {  

    /** 
     * add bind for browsers that don't support it (Safari)
     * @private
     */
    Function.prototype.bind = function (oThis) {
        if (typeof this !== "function") {  
            // closest thing possible to the ECMAScript 5 internal IsCallable function  
            throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");  
        }  
  
        var aArgs = Array.prototype.slice.call(arguments, 1),   
            fToBind = this, 
            /** 
             * @private
             */  
            FNOP = function () {},
            /** 
             * @private
             */  
            fBound = function () {  
                return fToBind.apply(this instanceof FNOP ? this : oThis || window,  
                                aArgs.concat(Array.prototype.slice.call(arguments)));  
            };  
  
        FNOP.prototype = this.prototype;  
        fBound.prototype = new FNOP();  
      
        return fBound;  
    };  
}

JSUTILS.namespace('JSUTILS.Event');

/**
 * @namespace JSUTILS
 */
JSUTILS.Event = (function () {

    var Event;

    /** 
     * A base class for the creation of Event objects.
     *
     * @class Event
     * @constructor
     * @param {String} type event type
     */
    Event = function (type) {

        this._type = type;
        this._target = null;

        this.name = "Event";
    };

    Event.prototype = {

        constructor: Event,
        
        /**
         * The event type
         * @property type
         * @type String
         */
        get type() {
            return this._type;
        },
        set type(val) {
            this._type = val;
        },

        /**
         * The event target
         * @property target
         * @type Object
         */ 
        get target() {
            return this._target;
        },
        set target(val) {
            this._target = val;
        }

    };

    // Generic events

    /** 
     * @property Event.CONNECTED
     * @static
     */
    Event.CONNECTED = "connected";
    /** 
     * @property Event.CHANGE
     * @static
     */
    Event.CHANGE    = "change";
    /** 
     * @property Event.COMPLETE
     * @static
     */
    Event.COMPLETE  = "complete";

    return Event;

}());

JSUTILS.namespace('JSUTILS.EventDispatcher');

JSUTILS.EventDispatcher = (function () {

    var EventDispatcher;

    /**
     * The EventDispatcher class mimics the DOM event dispatcher model so the 
     * user can add and remove event listeners in a familiar way. Event bubbling
     * is not available because events are dispatched in relation to state 
     * changes of physical components instead of layered graphics so there is 
     * nothing to bubble up.
     *
     * @class EventDispatcher
     * @constructor
     * @param {Class} target The instance of the class that implements
     * EventDispatcher
     */
    EventDispatcher = function (target) {
        "use strict";
        
        this._target = target || null;
        this._eventListeners = {};
        
        this.name = "EventDispatcher";
    };

    EventDispatcher.prototype = {

        constructor: EventDispatcher,

        /**
         * @method addEventListener
         * @param {String} type The event type
         * @param {Function} listener The function to be called when the event
         * is fired
         */
        addEventListener: function (type, listener) {
            if (!this._eventListeners[type]) {
                this._eventListeners[type] = [];
            }
            this._eventListeners[type].push(listener);
        },
        
        /**
         * @method removeEventListener
         * @param {String} type The event type
         * @param {Function} listener The function to be called when the event
         * is fired
         */
        removeEventListener: function (type, listener) {
            for (var i = 0, len = this._eventListeners[type].length; i < len; i++) {
                if (this._eventListeners[type][i] === listener) {
                    this._eventListeners[type].splice(i, 1);
                }
            }
            // To Do: If no more listeners for a type, delete key?
        },
        
        /**
         * @method hasEventListener
         * @param {String} type The event type
         * return {boolean} True is listener exists for this type, false if not.
         */
        hasEventListener: function (type) {
            if (this._eventListeners[type] && this._eventListeners[type].length > 0) {
                return true;
            } else {
                return false;
            }   
        },
        
        /**
         * @method dispatchEvent
         * @param {Event} type The Event object.
         * @param {Object} optionalParams Optional parameters passed as an object.
         * return {boolean} True if dispatch is successful, false if not.
         */ 
        dispatchEvent: function (event, optionalParams) {
            
            event.target = this._target;
            var isSuccess = false;      

            // Add any optional params to the Event object
            for (var obj in optionalParams) {
                if (optionalParams.hasOwnProperty(obj)) {
                    event[obj.toString()] = optionalParams[obj];
                }
            }
                        
            if (this.hasEventListener(event.type)) {
                for (var j = 0, len = this._eventListeners[event.type].length; j < len; j++) {
                    try {
                        this._eventListeners[event.type][j].call(this, event);
                        isSuccess = true;
                    } catch (e) {
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

JSUTILS.namespace('JSUTILS.TimerEvent');

JSUTILS.TimerEvent = (function () {

    var TimerEvent;

    // Dependencies
    var Event = JSUTILS.Event;

    /**
     * An Event object to be dispatched (fired) by a Timer object.
     * 
     * @class TimerEvent
     * @constructor    
     * @extends JSUTILS.Event
     * @param {String} type The event type
     */
    TimerEvent = function (type) {

        this.name = "TimerEvent";

        Event.call(this, type);
    };

    /** 
     * @property TimerEvent.TIMER
     * @static
     */
    TimerEvent.TIMER = "timerTick";
    /** 
     * @property TimerEvent.TIMER_COMPLETE
     * @static
     */
    TimerEvent.TIMER_COMPLETE = "timerComplete";

    TimerEvent.prototype = JSUTILS.inherit(Event.prototype);
    TimerEvent.prototype.constructor = TimerEvent;

    return TimerEvent;

}());

JSUTILS.namespace('JSUTILS.Timer');

JSUTILS.Timer = (function () {

    var Timer;

    // Dependencies
    var TimerEvent = JSUTILS.TimerEvent,
        EventDispatcher = JSUTILS.EventDispatcher;

    /**
     * The Timer object wraps the window.setInterval() method to provide
     * an as3-like Timer interface.
     *
     * @class Timer
     * @constructor
     * @extends JSUTILS.EventDispatcher  
     * @param {Number} delay The delay (ms) interval between ticks
     * @param {Number} repeatCount The number of number of ticks.
     * A value of zero will set the timer to repeat forever. Default = 0
     */
    Timer = function (delay, repeatCount) {

        EventDispatcher.call(this, this);

        this.name = "Timer";

        this._count = 0;
        this._delay = delay;
        this._repeatCount = repeatCount || 0;
        this._isRunning = false;

        this._timer = null;
    };

    Timer.prototype = JSUTILS.inherit(EventDispatcher.prototype);
    Timer.prototype.constructor = Timer;


    /**
     * The delay interval in milliseconds.
     * 
     * @property delay
     * @type Number
     */ 
    Timer.prototype.__defineGetter__("delay", function () {
        return this._delay;
    });
    Timer.prototype.__defineSetter__("delay", function (val) { 
        this._delay = val;
        if (this._isRunning) {
            this.stop();
            this.start();
        }
    }); 

    /**
     * The repeat count in milliseconds.
     * 
     * @property repeatCount
     * @type Number
     */ 
    Timer.prototype.__defineGetter__("repeatCount", function () {
        return this._repeatCount;
    });
    Timer.prototype.__defineSetter__("repeatCount", function (val) { 
        this._repeatCount = val;
        if (this._isRunning) {
            this.stop();
            this.start();
        }
    });

    /**
     * [read-only] Returns true if the timer is running.
     * 
     * @property running
     * @type Number
     */ 
    Timer.prototype.__defineGetter__("running", function () {
        return this._isRunning;
    });

    /**
     * [read-only] Returns the current count (number of ticks since timer
     * started).
     * 
     * @property currentCount
     * @type Number
     */ 
    Timer.prototype.__defineGetter__("currentCount", function () {
        return this._count;
    });

    /**
     * Start the timer.
     * @method start
     */
    Timer.prototype.start = function () {
        if (this._timer === null) {
            this._timer = setInterval(this.onTick.bind(this), this._delay);
            this._isRunning = true;
        }
    };

    /**
     * Stop the timer and reset the count to zero.
     * @method reset
     */
    Timer.prototype.reset = function () {
        this.stop();
        this._count = 0;
    };

    /**
     * Stop the timer.
     * @method stop
     */
    Timer.prototype.stop = function () {
        if (this._timer !== null) {
            clearInterval(this._timer);
            this._timer = null;
            this._isRunning = false;
        }
    };

    /**
     * @private
     * @method onTick
     */
    Timer.prototype.onTick = function () {
        this._count = this._count + 1;
        if (this._repeatCount !== 0 && this._count > this._repeatCount) {
            this.stop();
            this.dispatchEvent(new TimerEvent(TimerEvent.TIMER_COMPLETE));
        } else {
            this.dispatchEvent(new TimerEvent(TimerEvent.TIMER));
        }
    };

    // Document events

    /**
     * The timerTick event is dispatched at the rate specified 
     * by the delay interval.
     * @type JSUTILS.TimerEvent.TIMER
     * @event timerTick
     * @param {JSUTILS.Timer} target A reference to the Timer object.
     */ 

    /**
     * The timerComplete event is dispatched when the repeatCount value
     * @type JSUTILS.TimerEvent.TIMER_COMPLETE
     * @event timerComplete
     * @param {JSUTILS.Timer} target A reference to the Timer object.
     */      

    return Timer;

}());

JSUTILS.namespace('JSUTILS.SignalScope');

JSUTILS.SignalScope = (function () {

    var SignalScope;

    /**
     * A simple 2 channel scope to view analog input data.
     *
     * @class SignalScope
     * @constructor 
     * @param {String} canvasId The id of the canvas element to 
     * use to draw the signal.
     * @param {Number} width The width of the canvas element.
     * @param {Number} height The height of the canvas element.
     * @param {Number} rangeMin The minimum range of the scope.
     * @param {Number} rangeMax The maximum range of the scope.
     * @param {String} ch1Color [optional] The hex color value to use
     * for the channel 1 signal (default = #FF0000).
     * @param {String} ch2Color [optional] The hex colorvalue to use
     * for the channel 2 signal (default = #0000FF).
     */
    SignalScope = function (canvasId, width, height, rangeMin, rangeMax, ch1Color, ch2Color) {

        this.name = "SignalScope";

        this._canvas = document.getElementById(canvasId);
        this._ctx = this._canvas.getContext("2d");

        this._width = width;
        this._height = height;
        this._rangeMin = rangeMin;
        this._rangeMax = rangeMax;

        this._ch1Color = ch1Color || '#FF0000';
        this._ch2Color = ch2Color || '#0000FF';
        this._markers = null;

        this._ch1Values = new Array(width);
        this._ch2Values = new Array(width);

        // inital all values to 0.0
        for (var i = 0; i < width; i++) {
            this._ch1Values[i] = 0.0;
            this._ch2Values[i] = 0.0;
        }

        this._range = 1 / (rangeMax - rangeMin) * 100;

    };

    /**
     * Call this method at the desired frame rate in order
     * to draw the input signal.
     * @method update
     * @param {Number} input1 The channel 1 input signal
     * @param {Number} input2 [optional] The channel 2 input signal
     */
    SignalScope.prototype.update = function (input1, input2) {
        // clear the canvas
        this._ctx.clearRect(0, 0, this._width, this._height);

        this._ch1Values.push(input1);
        this._ch1Values.shift();
        this.drawChannel(this._ch1Values, this._ch1Color);

        if (input2 !== undefined) {
            this._ch2Values.push(input2);
            this._ch2Values.shift();
            this.drawChannel(this._ch2Values, this._ch2Color);
        }

        this.drawMarkers();
    };

    /**
     * @private
     * @method drawChannel
     */
    SignalScope.prototype.drawChannel = function (values, color) {
        var offset = 0.0;

        this._ctx.strokeStyle = color;
        this._ctx.lineWidth = 1;
        this._ctx.beginPath();
        this._ctx.moveTo(0, this._height);

        // draw channel 1
        for (var i = 0, len = values.length; i < len; i++) {
            offset = (this._rangeMax - values[i]) * this._range;
            this._ctx.lineTo(i,  offset);
        }
        this._ctx.stroke();
    };

    /**
     * @private
     * @method drawMarkers
     */
    SignalScope.prototype.drawMarkers = function () {
        var offset = 0.0;

        if (this._markers !== null) {
            for (var i = 0, num = this._markers.length; i < num; i++) {
                offset = (this._rangeMax - this._markers[i][0]) * this._range;
                this._ctx.strokeStyle = this._markers[i][1];
                this._ctx.lineWidth = 0.5;
                this._ctx.beginPath();
                this._ctx.moveTo(0, offset);
                this._ctx.lineTo(this._width, offset);
                this._ctx.stroke();
            }
        }
    };

    /**
     * Add a horizontal marker to the scope. 1 or more markers can be added.
     * @method addMarker
     * @param {Number} level The value of the marker within the input value range.
     * @param {String} color The hex color value for the marker.
     */
    SignalScope.prototype.addMarker = function (level, color) {
        if (this._markers === null) {
            this._markers = [];
        }
        this._markers.push([level, color]);
    };

    /**
     * Remove all markers from the scope.
     * @removeAllMarkers
     */
    SignalScope.prototype.removeAllMarkers = function () {
        this._markers = null;
    };

    return SignalScope;

}());

JSUTILS.namespace('BO.IOBoardEvent');

BO.IOBoardEvent = (function () {

    var IOBoardEvent;

    // Dependencies
    var Event = JSUTILS.Event;

    /**
     * An Event object to be dispatched (fired) by the IOBoard object.
     * The most important event is the READY event which signifies that the
     * I/O board is ready to receive commands from the application. Many of the
     * other IOBoard events are used when creating new io component objects.
     *
     * @class IOBoardEvent
     * @constructor
     * @extends JSUTILS.Event
     * @param {String} type The event type
     */
    IOBoardEvent = function (type) {

        this.name = "IOBoardEvent";
        
        // Call the super class
        // 2nd parameter is passed to EventDispatcher constructor
        Event.call(this, type);
    };

    // Events
    /**
     * @property IOBoardEvent.ANALOG_DATA
     * @static
     */
    IOBoardEvent.ANALOG_DATA = "analogData";
    /**
     * @property IOBoardEvent.DIGITAL_DATA
     * @static
     */
    IOBoardEvent.DIGITAL_DATA = "digitalData";
    /**
     * @property IOBoardEvent.FIRMWARE_VERSION
     * @static
     */
    IOBoardEvent.FIRMWARE_VERSION = "firmwareVersion";
    /**
     * @property IOBoardEvent.FIRMWARE_NAME
     * @static
     */
    IOBoardEvent.FIRMWARE_NAME = "firmwareName";
    /**
     * @property IOBoardEvent.STRING_MESSAGE
     * @static
     */
    IOBoardEvent.STRING_MESSAGE = "stringMessage";
    /**
     * @property IOBoardEvent.SYSEX_MESSAGE
     * @static
     */
    IOBoardEvent.SYSEX_MESSAGE = "sysexMessage";
    /**
     * @property IOBoardEvent.PIN_STATE_RESPONSE
     * @static
     */
    IOBoardEvent.PIN_STATE_RESPONSE = "pinStateResponse";
    /**
     * @property IOBoardEvent.READY
     * @static
     */
    IOBoardEvent.READY = "ioBoardReady";
    /**
     * @property IOBoardEvent.CONNECTED
     * @static
     */
    IOBoardEvent.CONNECTED = "ioBoardConnected";
    /**
     * @property IOBoardEvent.DISCONNECTED
     * @static
     */
    IOBoardEvent.DISCONNECTED = "ioBoardDisonnected";       

    IOBoardEvent.prototype = JSUTILS.inherit(Event.prototype);
    IOBoardEvent.prototype.constructor = IOBoardEvent;

    return IOBoardEvent;

}());

JSUTILS.namespace('BO.WSocketEvent');

BO.WSocketEvent = (function () {
    
    var WSocketEvent;

    // dependencies
    var Event = JSUTILS.Event;

    /**
     * Dispatches Websocket events: Connected `onopen`, Message `onmessge`
     * and Closed `onclose` objects.
     * @class WSocketEvent
     * @constructor
     * @extends JSUTILS.Event
     * @param {String} type The event type
     */
    WSocketEvent = function (type) {
        this.name = "WSocketEvent";
        
        // call the super class
        // 2nd parameter is passed to EventDispatcher constructor
        Event.call(this, type);     
    };

    // events
    /**
     * @property WSocketEvent.CONNECTED
     * @static
     */
    WSocketEvent.CONNECTED = "webSocketConnected";
    /**
     * @property WSocketEvent.MESSAGE
     * @static
     */
    WSocketEvent.MESSAGE = "webSocketMessage";
    /**
     * @property WSocketEvent.CLOSE
     * @static
     */
    WSocketEvent.CLOSE = "webSocketClosed";

    WSocketEvent.prototype = JSUTILS.inherit(Event.prototype);
    WSocketEvent.prototype.constructor = WSocketEvent;  

    return WSocketEvent;

}());
JSUTILS.namespace('BO.WSocketWrapper');

BO.WSocketWrapper = (function () {
    "use strict";

    var WSocketWrapper;

    // dependencies
    var EventDispatcher = JSUTILS.EventDispatcher,
        WSocketEvent = BO.WSocketEvent;

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
        this._readyState = ""; // only applies to native WebSocket implementations

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
                    throw "Websockets not supported by this browser";
                }
                /** @private */
                self._socket.onopen = function () {

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
        // to do: ensure socket is not null before trying to send
        this._socket.send(message.toString());
    };  

    // to do: ensure socket is not null before trying to get readyState

    /**
     * [read-only] Wrapper for the readyState method of the native websocket implementation
     * <p>CONNECTING = 0, OPEN = 1, CLOSING = 2, CLOSED = 3</p>
     * @property readyState
     * @type String
     */      
    WSocketWrapper.prototype.__defineGetter__("readyState", function () {
        return this._readyState;
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
JSUTILS.namespace('BO.filters.FilterBase');

BO.filters.FilterBase = (function () {
    "use strict";

    var FilterBase;

    /**
     * A base object to be extended by all Filter objects. This object
     * should not be instantiated directly.
     *
     * @class FilterBase
     * @constructor
     */
    FilterBase = function () {
        throw new Error("Can't instantiate abstract classes");
    };

    /**
     * Process the value to be filtered and return the filtered result.
     *
     * @protected
     * @method processSample
     * @param {Number} val The input value to be filtered.
     * @return {Number} The resulting value after applying the filter.
     */
    FilterBase.prototype.processSample = function (val) { 
        // to be implemented in sub class
        throw new Error("Filter objects must implement the method processSample");
    };

    return FilterBase;

}());
JSUTILS.namespace('BO.filters.Scaler');

BO.filters.Scaler = (function () {
    "use strict";

    var Scaler;

    // dependencies
    var FilterBase = BO.filters.FilterBase;

    /**
     * Scales up an input value from its min and max range to a specified 
     * minimum to maximum range. See [Breakout/examples/filters/scaler.html](https://github.com/soundanalogous/Breakout/blob/master/examples/filters/scaler.html) for
     * an example application.  
     *
     * @class Scaler
     * @constructor
     * @extends BO.filters.FilterBase
     * @param {Number} inMin minimum input value
     * @param {Number} inMax maximum input value
     * @param {Number} outMin minimum output value
     * @param {Number} outMax maximum output value
     * @param {Function} type The function used to map the input curve
     * @param {Boolean} limiter Whether or not to restrict the input value if it
     * exceeds the specified range.
     */
    Scaler = function (inMin, inMax, outMin, outMax, type, limiter) {

        this.name = "Scaler";

        this._inMin = inMin || 0;
        this._inMax = inMax || 1;
        this._outMin = outMin || 0;
        this._outMax = outMax || 1;
        this._type = type || Scaler.LINEAR;
        this._limiter = limiter || true;

    };


    Scaler.prototype = JSUTILS.inherit(FilterBase.prototype);
    Scaler.prototype.constructor = Scaler;

    /**
     * Override FilterBase.processSample
     */
    Scaler.prototype.processSample = function (val) {
        var inRange = this._inMax - this._inMin;
        var outRange = this._outMax - this._outMin;
        var normalVal = (val - this._inMin) / inRange;
        if (this._limiter) {
            normalVal = Math.max(0, Math.min(1, normalVal));
        }

        return outRange * this._type(normalVal) + this._outMin;
    };

    /**
     * y = x
     * @method Scaler.LINEAR
     * @static
     */
    Scaler.LINEAR = function (val) {
        return val;
    };

    /**
     * y = x * x
     * @method Scaler.SQUARE
     * @static
     */
    Scaler.SQUARE = function (val) {
        return val * val;
    };

    /**
     * y = sqrt(x)
     * @method Scaler.SQUARE_ROOT
     * @static
     */
    Scaler.SQUARE_ROOT = function (val) {
        return Math.pow(val, 0.5);
    };
    
    /**
     * y = x^4
     * @method Scaler.CUBE
     * @static
     */
    Scaler.CUBE = function (val) {
        return val * val * val * val;
    };
    
    /**
     * y = pow(x, 1/4)
     * @method Scaler.CUBE_ROOT
     * @static
     */
    Scaler.CUBE_ROOT = function (val) {
        return Math.pow(val, 0.25);
    };          


    return Scaler;

}());
JSUTILS.namespace('BO.filters.Convolution');

/**
 * @namespace BO.filters
 */
BO.filters.Convolution = (function () {
    "use strict";

    var Convolution;

    // dependencies
    var FilterBase = BO.filters.FilterBase;

    /**
     * The Convolution object performs low-pass, high-pass and moving average
     * filtering on an analog input.
     * See [Breakout/examples/filters/convolution.html](https://github.com/soundanalogous/Breakout/blob/master/examples/filters/convolution.html) for an example application.
     *
     * @class Convolution
     * @constructor
     * @extends BO.filters.FilterBase
     * @param {Number[]} kernel An array of coefficients to be used with product-sum
     * operations for input buffers.
     */
    Convolution = function (kernel) {

        this.name = "Convolution";

        this._buffer = [];

        // use the coef setter
        this.coef = kernel;
    };


    Convolution.prototype = JSUTILS.inherit(FilterBase.prototype);
    Convolution.prototype.constructor = Convolution;

    /**
     * An array of coefficients to be used with product-sum operations for input buffers. 
     * If assigned a new array, the input buffer will be cleared.
     * @property coef
     * @type Number[]
     */
    Convolution.prototype.__defineGetter__("coef", function () {
        return this._coef;
    });
    Convolution.prototype.__defineSetter__("coef", function (kernel) {
        this._coef = kernel;
        this._buffer = new Array(this._coef.length);
        var len = this._buffer.length;
        for (var i = 0; i < len; i++) {
            this._buffer[i] = 0;
        }
    });

    /**
     * Override FilterBase.processSample
     */
    Convolution.prototype.processSample = function (val) {
        this._buffer.unshift(val);
        this._buffer.pop();

        var result = 0;
        var len = this._buffer.length;

        for (var i = 0; i < len; i++) {
            result += this._coef[i] * this._buffer[i];
        }   

        return result;
    };

    /**
     * Low-pass filter kernel. Use by passing this array to the constructor.
     * @property Convolution.LPF
     * @static
     */
    Convolution.LPF = [1 / 3, 1 / 3, 1 / 3];

    /**
     * High-pass filter kernel. Use by passing this array to the constructor.
     * @property Convolution.HPF
     * @static
     */
    Convolution.HPF = [1 / 3, -2.0 / 3, 1 / 3];
    
    /**
     * Moving average filter kernel. Use by passing this array to the constructor.
     * @property Convolution.MOVING_AVERAGE
     * @static
     */
    Convolution.MOVING_AVERAGE = [1 / 8, 1 / 8, 1 / 8, 1 / 8, 1 / 8, 1 / 8, 1 / 8, 1 / 8];      
        
    return Convolution;

}());
JSUTILS.namespace('BO.filters.TriggerPoint');

BO.filters.TriggerPoint = (function () {
    "use strict";

    var TriggerPoint;

    // dependencies
    var FilterBase = BO.filters.FilterBase;

    /**
     * Divides an input to 0 or 1 based on the threshold and hysteresis. You can
     * also use multiple points by providing a nested array such as `[[0.4, 0.1],
     * [0.7, 0.05]]`.
     * See [Breakout/examples/filters/triggerpoint.html](https://github.com/soundanalogous/Breakout/blob/master/examples/filters/triggerpoint.html) for an example application.
     *
     * @class TriggerPoint
     * @constructor
     * @extends BO.filters.FilterBase
     * @param {Number[]} points An array of threshold and hysteresis values
     * operations for input buffers.
     */
    TriggerPoint = function (points) {

        this.name = "TriggerPoint";

        this._points = {};
        this._range = [];
        this._lastStatus = 0;

        if (points === undefined) {
            points = [[0.5, 0]];
        }

        if (points[0] instanceof Array) {
            var len = points.length;
            for (var i = 0; i < len; i++) {
                this._points[points[i][0]] = points[i][1];  
            }
        } else if (typeof points[0] === "number") {
            this._points[points[0]] = points[1];
        }

        this.updateRange();

        this._lastStatus = 0;
    };


    TriggerPoint.prototype = JSUTILS.inherit(FilterBase.prototype);
    TriggerPoint.prototype.constructor = TriggerPoint;

    /**
     * Override FilterBase.processSample
     */
    TriggerPoint.prototype.processSample = function (val) {
        var status = this._lastStatus;
        var len = this._range.length;
        for (var i = 0; i < len; i++) {
            var range = this._range[i];
            if (range[0] <= val && val <= range[1]) {
                status = i;
                break;
            }
        }

        this._lastStatus = status;
        return status;
    };

    /**
     * @method addPoint
     */
    TriggerPoint.prototype.addPoint = function (threshold, hysteresis) {
        this._points[threshold] = hysteresis;
        this.updateRange();
    };

    /**
     * @method removePoint
     */
    TriggerPoint.prototype.removePoint = function (threshold) {
        // to do: verify that this works in javascript
        delete this._points[threshold];
        this.updateRange();
    };

    /**
     * @method removeAllPoints
     */
    TriggerPoint.prototype.removeAllPoints = function () {
        this._points = {};
        this.updateRange();
    };

    /**
     * @private
     * @method updateRange
     */
    TriggerPoint.prototype.updateRange = function () {
                
        this._range = [];
        var keys = this.getKeys(this._points);

        var firstKey = keys[0];
        this._range.push([Number.NEGATIVE_INFINITY, firstKey - this._points[firstKey]]);

        var len = keys.length - 1;
        for (var i = 0; i < len; i++) {
            var t0 = keys[i];
            var t1 = keys[i + 1];
            var p0 = (t0 * 1) + this._points[t0]; // multiply by 1 to force type to number
            var p1 = t1 - this._points[t1];
            if (p0 >= p1) {
                throw new Error("The specified range overlaps...");
            }
            this._range.push([p0, p1]);
        }

        var lastKey = keys[keys.length - 1];
        var positiveThresh = (lastKey * 1) + this._points[lastKey];
        this._range.push([positiveThresh, Number.POSITIVE_INFINITY]);

    };

    /**
     * @private
     * @method getKeys
     */
    TriggerPoint.prototype.getKeys = function (obj) {
        var keys = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                keys.push(key);
            }
        }
        return keys.sort();
    };
        
    return TriggerPoint;

}());
 
JSUTILS.namespace('BO.generators.GeneratorEvent');

BO.generators.GeneratorEvent = (function () {
    "use strict";

    var GeneratorEvent;

    // dependencies
    var Event = JSUTILS.Event;

    /**
     * An Event object to be dispatched (fired) by a Generator object when its
     * value has updated.
     *
     * @class GeneratorEvent
     * @constructor
     * @extends JSUTILS.Event
     * @param {String} type The event type
     */
    GeneratorEvent = function (type) {

        Event.call(this, type);

        this.name = "GeneratorEvent";
    };

    GeneratorEvent.prototype = JSUTILS.inherit(Event.prototype);
    GeneratorEvent.prototype.constructor = GeneratorEvent;

    /**
     * @property GeneratorEvent.UPDATE
     * @static
     */
    GeneratorEvent.UPDATE = "update";

    return GeneratorEvent;

}());
JSUTILS.namespace('BO.generators.GeneratorBase');

/**
 * @namespace BO.generators
 */
BO.generators.GeneratorBase = (function () {
    "use strict";

    var GeneratorBase;

    // dependencies
    var EventDispatcher = JSUTILS.EventDispatcher;

    /**
     * A base object to be extended by all Generator objects. This object should
     * not be instantiated directly.
     *
     * @class GeneratorBase
     * @constructor
     * @extends JSUTILS.EventDispatcher
     */
    GeneratorBase = function () {
        
        EventDispatcher.call(this, this);

        this.name = "GeneratorBase";
        this._value = undefined;

    };

    GeneratorBase.prototype = JSUTILS.inherit(EventDispatcher.prototype);
    GeneratorBase.prototype.constructor = GeneratorBase;

    /**
     * [read-only] Get a generated number.
     * @protected
     * @property value
     * @type Number
     */  
    GeneratorBase.prototype.__defineGetter__("value", function () { 
        return this._value;
    });

    /**
     * Use setValue() instead?
     * @protected
     */
    GeneratorBase.prototype.__defineSetter__("value", function (val) { 
        this._value = val;
    }); 

    return GeneratorBase;

}());
JSUTILS.namespace('BO.generators.Oscillator');

BO.generators.Oscillator = (function () {
    "use strict";

    var Oscillator;

    // dependencies
    var GeneratorBase = BO.generators.GeneratorBase,
        GeneratorEvent = BO.generators.GeneratorEvent,
        Timer = JSUTILS.Timer,
        TimerEvent = JSUTILS.TimerEvent;

    /**
     * The Oscillator object can be attached to a Pin or LED object to output
     * a waveform. This is useful for blinking an LED or fading it on and off. In
     * most cases (unless you are simply using it to blink and LED on or off), 
     * the Oscillator should be attached to a Pin or LED object associated with
     * a PWM pin on the I/O board.
     * See [Breakout/examples/generators/oscillator.html](https://github.com/soundanalogous/Breakout/blob/master/examples/generators/oscillator.html) for an example application.
     *
     * @class Oscillator
     * @constructor
     * @extends BO.generators.GeneratorBase
     * @param {Number} wave waveform
     * @param {Number} freq frequency
     * @param {Number} amplitude amplitude
     * @param {Number} offset offset
     * @param {Number} phase phase
     * @param {Number} times The repeat count from 0 to infinite.
     */
    Oscillator = function (wave, freq, amplitude, offset, phase, times) {

        // call super class
        GeneratorBase.call(this);

        this.name = "Oscillator";

        this._wave = wave || Oscillator.SIN;
        this._freq = freq || 1;
        this._amplitude = amplitude || 1;
        this._offset = offset || 0;
        this._phase = phase || 0;
        this._times = times || 0;

        if (freq === 0) {
            throw new Error("Frequency should be larger than 0");
        }

        this._time = undefined;
        this._startTime = undefined;
        this._lastVal = undefined;
        // need to do this in order to remove the event listener
        this._autoUpdateCallback = this.autoUpdate.bind(this);

        this._timer = new Timer(33);
        this._timer.start();

        this.reset();
    };

    Oscillator.prototype = JSUTILS.inherit(GeneratorBase.prototype);
    Oscillator.prototype.constructor = Oscillator;

    /**
     * The service interval in milliseconds. Default is 33ms.
     * @property serviceInterval
     * @type Number
     */ 
    Oscillator.prototype.__defineSetter__("serviceInterval", function (interval) {
        this._timer.delay = interval;
    });
    Oscillator.prototype.__defineGetter__("serviceInterval", function () {
        return this._timer.delay;
    });

    /**
     * Starts the oscillator.
     * @method start
     */
    Oscillator.prototype.start = function () {
        this.stop();
        this._timer.addEventListener(TimerEvent.TIMER, this._autoUpdateCallback);

        var date = new Date();
        this._startTime = date.getTime();
        this.autoUpdate(null);
    };

    /**
     * Stops the oscillator.
     * @method stop
     */
    Oscillator.prototype.stop = function () {
        if (this._timer.hasEventListener(TimerEvent.TIMER)) {
            this._timer.removeEventListener(TimerEvent.TIMER, this._autoUpdateCallback);
        }
    };

    /**
     * Resets the oscillator.
     * @method reset
     */
    Oscillator.prototype.reset = function () {
        this._time = 0;
        this._lastVal = 0.999;
    };

    /**
     * By default the interval is 33 milliseconds. The Osc is updated every 33ms.
     * @method update
     * @param {Number} interval The update interval in milliseconds.
     */
    Oscillator.prototype.update = function (interval) {
        interval = interval || -1;
        if (interval < 0) {
            this._time += this._timer.delay;
        }
        else {
            this._time += interval;
        }
        this.computeValue();
    };

    /**
     * @private
     * @method autoUpdate
     */
    Oscillator.prototype.autoUpdate = function (event) {
        var date = new Date();
        this._time = date.getTime() - this._startTime;
        this.computeValue();
    };

    /**
     * @private
     * @method computeValue
     */
    Oscillator.prototype.computeValue = function () {
        var sec = this._time / 1000;

        if (this._times !== 0 && this._freq * sec >= this._times) {
            this.stop();
            sec = this._times / this._freq;
            if (this._wave !== Oscillator.LINEAR) {
                this._value = this._offset;
            } else {
                this._value = this._amplitude * this._wave(1, 0) + this._offset;
            }
        } else {
            var val = this._freq * (sec + this._phase);
            this._value = this._amplitude * this._wave(val, this._lastVal) + this._offset;
            this._lastVal = val;
        }
        this.dispatchEvent(new GeneratorEvent(GeneratorEvent.UPDATE));
    };

    // Static methods

    /**
     * sine wave
     * @method Oscillator.SIN
     * @static
     */
    Oscillator.SIN = function (val, lastVal) {
        return 0.5 * (1 + Math.sin(2 * Math.PI * (val - 0.25)));
    };

    /**
     * square wave
     * @method Oscillator.SQUARE
     * @static
     */
    Oscillator.SQUARE = function (val, lastVal) {
        return (val % 1 <= 0.5) ? 1 : 0;
    };
    
    /**
     * triangle wave
     * @method Oscillator.TRIANGLE
     * @static
     */
    Oscillator.TRIANGLE = function (val, lastVal) {
        val %= 1;
        return (val <= 0.5) ? (2 * val) : (2 - 2 * val);
    };
    
    /**
     * saw wave
     * @method Oscillator.SAW
     * @static
     */
    Oscillator.SAW = function (val, lastVal) {
        val %= 1;
        if (val <= 0.5) {
            return val + 0.5;
        }
        else {
            return val - 0.5;
        }
    };
    
    /**
     * impulse
     * @method Oscillator.IMPULSE
     * @static
     */
    Oscillator.IMPULSE = function (val, lastVal) {
        return ((val % 1) < (lastVal % 1)) ? 1 : 0;
    };
    
    /**
     * linear
     * @method Oscillator.LINEAR
     * @static
     */
    Oscillator.LINEAR = function (val, lastVal) {
        return (val < 1) ? val : 1;
    };
    
    // document events

    /**
     * The update event is dispatched at the rate specified 
     * by the serviceInterval parameter (default = 33ms).
     * @type BO.generators.GeneratorEvent.UPDATE
     * @event update
     * @param {BO.generators.Oscillator} target A reference to the Oscillator object.
     */

    return Oscillator;

}());

JSUTILS.namespace('BO.PinEvent');

BO.PinEvent = (function () {

    var PinEvent;

    // Dependencies
    var Event = JSUTILS.Event;

    /**
     * An Event object to be dispatched (fired) by a Pin object.
     * @class PinEvent
     * @constructor
     * @extends JSUTILS.Event
     * @param {String} type The event type
     */
    PinEvent = function (type) {

        this.name = "PinEvent";
        
        // Call the super class
        // 2nd parameter is passed to EventDispatcher constructor
        Event.call(this, type);
    };

    // Events
    /**
     * @property PinEvent.CHANGE
     * @static
     */
    PinEvent.CHANGE = "pinChange";
    /**
     * @property PinEvent.RISING_EDGE
     * @static
     */
    PinEvent.RISING_EDGE = "risingEdge";
    /**
     * @property PinEvent.FALLING_EDGE
     * @static
     */
    PinEvent.FALLING_EDGE = "fallingEdge";
    

    PinEvent.prototype = JSUTILS.inherit(Event.prototype);
    PinEvent.prototype.constructor = PinEvent;

    return PinEvent;

}());

JSUTILS.namespace('BO.Pin');

BO.Pin = (function () {
    "use strict";

    var Pin;

    // dependencies
    var EventDispatcher = JSUTILS.EventDispatcher,
        PinEvent = BO.PinEvent;

    /**
     * Each analog and digital pin of the physical I/O board is 
     * represented by a Pin object.
     * The Pin object is the foundation for many of the io objects and is also 
     * very useful on its own. See the Using The Pin Object Guide on 
     * [http://breakoutjs.com](http://breakoutjs.com) for a detailed overview.
     *
     * @class Pin
     * @constructor
     * @uses JSUTILS.EventDispatcher
     * @param {Number} number The pin number
     * @param {Number} type The type of pin
     */
    Pin = function (number, type) {

        this.name = "Pin";

        this._type = type;
        this._capabilities = {};
        this._number = number;
        this._analogNumber = undefined;
        this._maxPWMValue = 255;
        this._value = 0;
        this._lastValue = -1;
        this._preFilterValue = 0;
        this._average = 0;
        this._minimum = Math.pow(2, 16);
        this._maximum = 0;
        this._sum = 0;
        this._numSamples = 0;
        this._filters = null;
        this._generator = null;
        this._state = undefined;

        this._autoSetValueCallback = this.autoSetValue.bind(this);
        
        this._evtDispatcher = new EventDispatcher(this);    

    };

    Pin.prototype = {

        constructor: Pin,
        
        /**
         * The analogNumber sould only be set internally.
         * @private
         */     
        setAnalogNumber: function (num) {
            this._analogNumber = num;
        },

        /**
         * [read-only] The analog pin number used by the IOBoard (printed on 
         * board or datasheet).
         * @property analogNumber
         * @type Number
         */ 
        get analogNumber() {
            return this._analogNumber;
        },      

        /**
         * [read-only] The pin number corresponding to the Arduino documentation 
         * for the type of board.
         * @property number
         * @type Number
         */          
        get number() {
            return this._number;
        },

        /**
         * The maximum PWM value supported for this pin. This value should
         * normally be set internally.
         * @private
         */
        setMaxPWMValue: function (value) {
            this._maxPWMValue = value;
        },

        /**
         * Sets the state value. This is populated by the 
         * processPinStateResponse method of the IOBoard object. It should not
         * be called manually.
         * 
         * @param {Number} state The state of the pin. For output modes, the
         * state is any value that has been previously written to the pin. For 
         * input modes, the state is typically zero, however for digital inputs
         * the state is the status of the pullup resistor.
         * @private
         */
        setState: function (state) {
            // convert PWM values to 0.0 - 1.0 range
            if (this._type === Pin.PWM) {
                state = state / this.maxPWMValue;
            } 

            this._state = state;
        },

        /**
         * [read-only] The maximum PWM value supported for this pin.
         * <p> This is the max PWM value supported by Arduino (currently 255) 
         * rather than the max PWM value specified by the microcontroller 
         * datasheet.</p>
         *
         * @property maxPWMValue
         * @type Number
         */          
        get maxPWMValue() {
            return this._maxPWMValue;
        },      
        
        /**
         * [read-only] The average value of the pin over time. Call clear() to 
         * reset.
         * @property average
         * @type Number
         */          
        get average() {
            return this._average;
        },

        /**
         * [read-only] The minimum value of the pin over time. Call clear() to 
         * reset.
         * @property minimum
         * @type Number
         */
        get minimum() {
            return this._minimum;
        },
        
        /**
         * [read-only] The maximum value of the pin over time. Call clear() to 
         * reset.
         * @property maximum
         * @type Number
         */          
        get maximum() {
            return this._maximum;
        },

        /**
         * <p>[read-only] The state of the pin. For output modes, the state is 
         * any value that has been previously written to the pin. For input 
         * modes, the state is typically zero, however for digital inputs the 
         * state is the status of the pullup resistor.</p>
         *
         * <p>This propery is populated by calling the queryPinState method of 
         * the IOBoard object. This is useful if there are multiple client 
         * applications connected to a single physical IOBoard and you want to 
         * get the state of a pin that is set by another client application.</p>
         * 
         * @property state
         * @type Number
         */
        get state() {
            return this._state;
        },
        
        /**
         * The current digital or analog value of the pin.
         * @property value
         * @type Number
         */      
        get value() {
            return this._value;
        },
        set value(val) {
            this._lastValue = this._value;
            this._preFilterValue = val;
            this._value = this.applyFilters(val);
            this.calculateMinMaxAndMean(this._value);
            this.detectChange(this._lastValue, this._value);
        },
        
        /**
         * [read-only] The last pin value.
         * @property lastValue
         * @type Number
         */          
        get lastValue() {
            return this._lastValue;
        },
        
        /**
         * [read-only] The value before any filters were applied.
         * @property preFilterValue
         * @type Number
         */          
        get preFilterValue() {
            return this._preFilterValue;
        },

        /**
         * Get and set filters for the Pin.
         * @property filters
         * @type FilterBase[]
         */ 
        get filters() {
            return this._filters;
        },
        set filters(filterArray) {
            this._filters = filterArray;
        },

        /**
         * [read-only] Get a reference to the current generator.
         * @property generator
         * @type GeneratorBase
         */ 
        get generator() {
            return this._generator;
        },

        /**
         * The type/mode of the pin (0: DIN, 1: DOUT, 2: AIN, 3: AOUT / PWM,
         * 4: SERVO, 5: SHIFT, 6: I2C). Use 
         * IOBoard.setDigitalPinMode(pinNumber) to set the pin type.
         * @method getType
         * @return {Number} The pin type/mode
         */ 
        getType: function () {
            return this._type;
        },

        /**
         * Set the pin type. This method should only be used internally.
         * @private
         */
        setType: function (pinType) {
            // Ensure pin type is valid
            if (pinType >= 0 && pinType < Pin.TOTAL_PIN_MODES) {
                this._type = pinType;
            }
        },          

        /**
         * An object storing the capabilities of the pin.
         * @method getCapabilities
         * @return {Object} An object describing the capabilities of this Pin.
         */ 
        getCapabilities: function () {
            return this._capabilities;
        },

        /**
         * This method should only be used internally.
         * @private
         */
        setCapabilities: function (pinCapabilities) {
            this._capabilities = pinCapabilities;
        },      

        /**
         * Dispatch a Change event whenever a pin value changes
         * @private
         * @method detectChange
         */
        detectChange: function (oldValue, newValue) {
            if (oldValue === newValue) {
                return;
            }
            this.dispatchEvent(new PinEvent(PinEvent.CHANGE));

            if (oldValue <= 0 && newValue !== 0) {
                this.dispatchEvent(new PinEvent(PinEvent.RISING_EDGE));
            } else if (oldValue !== 0 && newValue <= 0) {
                this.dispatchEvent(new PinEvent(PinEvent.FALLING_EDGE));
            }
        },
        
        /**
         * From funnel Pin.as
         * @private
         * @method clearWeight
         */
        clearWeight: function () {
            this._sum = this._average;
            this._numSamples = 1;
        },
        
        /**
         * From funnel Pin.as
         * @private
         * @method calculateMinMaxAndMean
         */
        calculateMinMaxAndMean: function (val) {
            var MAX_SAMPLES = Number.MAX_VALUE;

            this._minimum = Math.min(val, this._minimum);
            this._maximum = Math.max(val, this._maximum);
            
            this._sum += val;
            this._average = this._sum / (++this._numSamples);
            if (this._numSamples >= MAX_SAMPLES) {
                this.clearWeight();
            }
        },
            
        /**
         * Resets the minimum, maximum, average and lastValue of the pin.
         * @method clear
         */
        clear: function () {
            this._minimum = this._maximum = this._average = this._lastValue = this._preFilterValue;
            this.clearWeight();
        },
        
        /**
         * Add a new filter to the Pin.
         * @method addFilter
         * @param {FilterBase} newFilter A filter object that extends 
         * FilterBase.
         * @see BO.filters.Convolution
         * @see BO.filters.Scaler
         * @see BO.filters.TriggerPoint
         */
        addFilter: function (newFilter) {

            if (newFilter === null) {
                return;
            }

            if (this._filters === null) {
                this._filters = [];
            }

            this._filters.push(newFilter);
        },

        /**
         * Remove a specified filter from the Pin.
         * @method removeFilter
         * @param {FilterBase} filterToRemove The filter to remove.
         * @see BO.filters.Convolution
         * @see BO.filters.Scaler
         * @see BO.filters.TriggerPoint
         */
        removeFilter: function (filterToRemove) {
            var index;

            if (this._filters.length < 1) {
                return;
            }

            index = this._filters.indexOf(filterToRemove);

            if (index !== -1) {
                this._filters.splice(index, 1);
            }
        },

        /**
         * Add a new generator to the Pin. A pin can only have one generator
         * assigned. 
         * Assigning a new generator will replace the previously assigned 
         * generator.
         * @method addGenerator
         * @param {GeneratorBase} newGenerator A generator object that extends 
         * GeneratorBase.
         * @see BO.generators.Oscillator
         */
        addGenerator: function (newGenerator) {
            this.removeGenerator();
            this._generator = newGenerator;
            this._generator.addEventListener(BO.generators.GeneratorEvent.UPDATE, this._autoSetValueCallback);
        },

        /**
         * Removes the generator from the pin.
         * @method removeGenerator
         */
        removeGenerator: function () {
            if (this._generator !== null) {
                this._generator.removeEventListener(BO.generators.GeneratorEvent.UPDATE, this._autoSetValueCallback);
            }
            this._generator = null;             
        },

        /**
         * Removes all filters from the pin.
         * @method removeAllFilters
         */
        removeAllFilters: function () {
            this._filters = null;
        },

        /**
         * @private
         * @method autoSetValue
         */
        autoSetValue: function (event) {
            var val = this._generator.value;
            this.value = val;
        },

        /**
         * @private
         * @method applyFilters
         */
        applyFilters: function (val) {
            var result;

            if (this._filters === null) {
                return val;
            }
            
            result = val;
            var len = this._filters.length;
            for (var i = 0; i < len; i++) {
                result = this._filters[i].processSample(result);
            }

            return result;
        },

        // Implement EventDispatcher
        
        /**
         * @param {String} type The event type
         * @param {Function} listener The function to be called when the event 
         * is fired
         */
        addEventListener: function (type, listener) {
            this._evtDispatcher.addEventListener(type, listener);
        },
        
        /**
         * @param {String} type The event type
         * @param {Function} listener The function to be called when the event 
         * is fired
         */
        removeEventListener: function (type, listener) {
            this._evtDispatcher.removeEventListener(type, listener);
        },
        
        /**
         * @param {String} type The event type
         * return {boolean} True is listener exists for this type, false if not.
         */
        hasEventListener: function (type) {
            return this._evtDispatcher.hasEventListener(type);
        },

        /**
         * @param {PinEvent} type The Event object
         * @param {Object} optionalParams Optional parameters to assign to the 
         * event object.
         * return {boolean} True if dispatch is successful, false if not.
         */ 
        dispatchEvent: function (event, optionalParams) {
            return this._evtDispatcher.dispatchEvent(event, optionalParams);
        }       
            
    };

    /**
     * @property Pin.HIGH
     * @static
     */
    Pin.HIGH = 1;
    /**
     * @property Pin.LOW
     * @static
     */
    Pin.LOW = 0;
    /**
     * @property Pin.ON
     * @static
     */
    Pin.ON = 1;
    /**
     * @property Pin.OFF
     * @static
     */
    Pin.OFF = 0;

    // Pin modes
    /**
     * @property Pin.DIN
     * @static
     */
    Pin.DIN = 0x00;
    /**
     * @property Pin.DOUT
     * @static
     */
    Pin.DOUT = 0x01;
    /**
     * @property Pin.AIN
     * @static
     */
    Pin.AIN = 0x02;
    /**
     * @property Pin.AOUT
     * @static
     */
    Pin.AOUT = 0x03;
    /**
     * @property Pin.PWM
     * @static
     */
    Pin.PWM = 0x03;
    /**
     * @property Pin.SERVO
     * @static
     */
    Pin.SERVO = 0x04;
    /**
     * @property Pin.SHIFT
     * @static
     */
    Pin.SHIFT = 0x05;
    /**
     * @property Pin.I2C
     * @static
     */
    Pin.I2C = 0x06;
    /**
     * @property Pin.ONEWIRE
     * @static
     */
    Pin.ONEWIRE = 0x07;
    /**
     * @property Pin.STEPPER
     * @static
     */
    Pin.STEPPER = 0x08;
    /**
     * @property Pin.TOTAL_PIN_MODES
     * @static
     */
    Pin.TOTAL_PIN_MODES = 9;


    // Document events

    /**
     * The pinChange event is dispatched when the pin value changes.
     * @type BO.PinEvent.CHANGE
     * @event pinChange
     * @param {BO.Pin} target A reference to the Pin object.
     */

    /**
     * The risingEdge event is dispatched when the pin value increased 
     * (from 0 to 1).
     * @type BO.PinEvent.RISING_EDGE
     * @event risingEdge
     * @param {BO.Pin} target A reference to the Pin object.
     */ 
     
    /**
     * The change event is dispatched when the pin value decreased 
     * (from 1 to 0).
     * @type BO.PinEvent.FALLING_EDGE
     * @event fallingEdge
     * @param {BO.Pin} target A reference to the Pin object.
     */

    return Pin;

}());

JSUTILS.namespace('BO.I2CBase');

/**
 * @namespace BO
 */
BO.I2CBase = (function () {
    "use strict";

    var I2CBase;

    // dependencies
    var Pin = BO.Pin,
        EventDispatcher = JSUTILS.EventDispatcher,
        IOBoardEvent = BO.IOBoardEvent;

    /**
     * A base class for I2C objects. Extend this class when creating an
     * interface for a new I2C device. I2CBase should not be instantiated
     * directly.
     *
     * @class I2CBase
     * @constructor
     * @uses JSUTILS.EventDispatcher
     * @param {IOBoard} board A reference to the IOBoard instance
     * @param {Number} address The I2C address of the device
     * @param {Number} delayUS The number of microseconds ...
     */
    I2CBase = function (board, address, delayUS) {

        if (board === undefined) {
            return;
        }

        this.name = "I2CBase";
        /** @protected*/
        this.board = board;

        var _delay = delayUS || 0,
            _delayInMicrosecondsLSB = _delay & 0xFF,
            _delayInMicrosecondsMSB = (_delay >> 7) & 0xFF;

        /** @protected */
        this._address = address;
        this._evtDispatcher = new EventDispatcher(this);
        
        // if the pins are not set as I2C, set them now
        var i2cPins = board.getI2cPins();
        if (i2cPins.length === 2) {
            if (board.getPin(i2cPins[0]).getType() !== Pin.I2C) {
                board.getPin(i2cPins[0]).setType(Pin.I2C);
                board.getPin(i2cPins[1]).setType(Pin.I2C);
            }
        } else {
            // to do: proper error handling
            console.log("Error, this board does not support i2c");
            return;
        }

        board.addEventListener(IOBoardEvent.SYSEX_MESSAGE, this.onSysExMessage.bind(this));
        
        // call this for each board in case delay is set
        board.sendSysex(I2CBase.I2C_CONFIG, [_delayInMicrosecondsLSB, _delayInMicrosecondsMSB]);
            
    };


    I2CBase.prototype = {

        constructor: I2CBase,

        /**
         * [read-only] The address of the i2c device.
         * @property address
         * @type Number
         */
        get address() {
            return this._address;
        },

        // private methods:
        /**
         * @private
         * onSysExMessage
         */
        onSysExMessage: function (event) {
            var message = event.message;
            var addr = this.board.getValueFromTwo7bitBytes(message[1], message[2]);
            var data = [];

            if (message[0] != I2CBase.I2C_REPLY) {
                return;
            } else {
                //console.log(this);
                //console.log("addr = " + this._address);
                // to do: make sure i2c address in message matches the i2c address of the subclass
                // return if no match;
                if (addr != this._address) {
                    return;
                }

                for (var i = 3, len = message.length; i < len; i += 2) {
                    data.push(this.board.getValueFromTwo7bitBytes(message[i], message[i + 1]));
                }
                this.handleI2C(data);
            }

        },
        
        // public methods:
        
        /**
         * Send an i2c request command to the board
         * @protected
         * @method sendI2CRequest
         * @param {Number} command
         * @param {Number[]} data
         */
        sendI2CRequest: function (data) {

            // to do: support 10-bit i2c address
            var tempData = [];
            var address = data[1];
            var readWriteMode = data[0];
            
            tempData[0] = address;
            tempData[1] = readWriteMode << 3;
            
            for (var i = 2, len = data.length; i < len; i++) {
                tempData.push(data[i] & 0x007F);
                tempData.push((data[i] >> 7) & 0x007F);
            }
            
            this.board.sendSysex(I2CBase.I2C_REQUEST, tempData);
            
        },
    
        /**
         * To be implemented in subclass
         * @protected
         * @method update
         */
        update: function () {
            // To be implemented in sublasses
        },
        
        /**
         * To be implemented in subclass. Data should be: slave address,
         * register, data0, data1...
         * @protected
         * @method handleI2C
         */
        handleI2C: function (data) {
            // To be implemented in sublasses
            // data should be: slave address, register, data0, data1...
        },
                
        /* implement EventDispatcher */
        
        /**
         * @param {String} type The event type
         * @param {Function} listener The function to be called when the event is fired
         */
        addEventListener: function (type, listener) {
            this._evtDispatcher.addEventListener(type, listener);
        },
        
        /**
         * @param {String} type The event type
         * @param {Function} listener The function to be called when the event is fired
         */
        removeEventListener: function (type, listener) {
            this._evtDispatcher.removeEventListener(type, listener);
        },
        
        /**
         * @param {String} type The event type
         * return {boolean} True is listener exists for this type, false if not.
         */
        hasEventListener: function (type) {
            return this._evtDispatcher.hasEventListener(type);
        },
        
        /**
         * @param {Event} type The Event object
         * @param {Object} optionalParams Optional parameters to assign to the event object.
         * return {boolean} True if dispatch is successful, false if not.
         */
        dispatchEvent: function (event, optionalParams) {
            return this._evtDispatcher.dispatchEvent(event, optionalParams);
        }
    };
    

    /**
     * @property I2CBase.I2C_REQUEST
     * @static
     */
    I2CBase.I2C_REQUEST = 0x76;
    /**
     * @property I2CBase.I2C_REPLY
     */
    I2CBase.I2C_REPLY = 0x77;
    /**
     * @property I2CBase.I2C_CONFIG
     * @static
     */
    I2CBase.I2C_CONFIG = 0x78;

    /**
     * @property I2CBase.WRITE
     * @static
     */
    I2CBase.WRITE = 0;
    /**
     * @property I2CBase.READ
     * @static
     */
    I2CBase.READ = 1;
    /**
     * @property I2CBase.READ_CONTINUOUS
     * @static
     */
    I2CBase.READ_CONTINUOUS = 2;
    /**
     * @property I2CBase.STOP_READING
     * @static
     */
    I2CBase.STOP_READING = 3;

    return I2CBase;

}());
JSUTILS.namespace('BO.PhysicalInputBase');

BO.PhysicalInputBase = (function () {

    var PhysicalInputBase;

    // Dependencies
    var EventDispatcher = JSUTILS.EventDispatcher;

    /**
     * A base class for physical input objects. Extend this class to
     * create new digital or analog input objects. Treat this class as
     * an abstract base class. It should not be instantiated directly.
     *
     * @class PhysicalInputBase
     * @constructor
     * @uses JSUTILS.EventDispatcher
     */
    PhysicalInputBase = function () {

        this.name = "PhysicalInputBase";

        this._evtDispatcher = new EventDispatcher(this);
    };

    PhysicalInputBase.prototype = {

        constructor: PhysicalInputBase,
        
        // Implement EventDispatcher
        
        /**
         * @param {String} type The event type
         * @param {Function} listener The function to be called when the event is fired
         */
        addEventListener: function (type, listener) {
            this._evtDispatcher.addEventListener(type, listener);
        },
        
        /**
         * @param {String} type The event type
         * @param {Function} listener The function to be called when the event is fired
         */
        removeEventListener: function (type, listener) {
            this._evtDispatcher.removeEventListener(type, listener);
        },
        
        /**
         * @param {String} type The event type
         * return {boolean} True is listener exists for this type, false if not.
         */
        hasEventListener: function (type) {
            return this._evtDispatcher.hasEventListener(type);
        },
        
        /**
         * @param {Event} type The Event object
         * @param {Object} optionalParams Optional parameters to assign to the event object.
         * return {boolean} True if dispatch is successful, false if not.
         */     
        dispatchEvent: function (event, optionalParams) {
            return this._evtDispatcher.dispatchEvent(event, optionalParams);
        }           
    };

    return PhysicalInputBase;

}());

JSUTILS.namespace('BO.io.Stepper');

BO.io.Stepper = (function () {
    "use strict";

    var Stepper;
    var instanceCounter = 0;

    // private static constants
    var STEPPER = 0x72,
        CONFIG = 0,
        STEP = 1,
        MAX_STEPS = 2097151, // 21 bits (2^21 - 1)
        MAX_SPEED = 16383; // 14 bits (2^14 - 1)

    // dependencies
    var Pin = BO.Pin,
        EventDispatcher = JSUTILS.EventDispatcher,
        Event = JSUTILS.Event,
        IOBoardEvent = BO.IOBoardEvent;

    /**
     * Creates an interface to a Stepper motor. Use this object to set
     * the direction and number of steps for the motor to rotate. See
     * [Breakout/examples/actuators/stepper\_2wire.html](https://github.com/soundanalogous/Breakout/blob/master/examples/actuators/stepper_2wire.html), 
     * [stepper\_4wire.html](https://github.com/soundanalogous/Breakout/blob/master/examples/actuators/stepper_4wire.html), 
     * [stepper\_easydriver.html](https://github.com/soundanalogous/Breakout/blob/master/examples/actuators/stepper_easydriver.html) 
     * and [stepper\_simple.html](https://github.com/soundanalogous/Breakout/blob/master/examples/actuators/stepper_simple.html) for example applications.
     *
     * @class Stepper
     * @constructor
     * @uses JSUTILS.EventDispatcher
     * @param {IOBoard} board A reference to the IOBoard instance that the 
     * stepper is attached to.
     * @param {Number} driverType. The type of driver (`Stepper.DRIVER`, 
     * `Stepper.TWO_WIRE`, or `Stepper.FOUR_WIRE`).
     * @param {Number} numStepsPerRev The number of steps to make 1 revolution. 
     * @param {Pin} directionPin If dirver interface, the pin used to control 
     * the direction.
     * If 2-wire or 4-wire interface, the 1st moter pin.
     * @param {Pin} stepPin If dirver interface, the pin used to control the 
     * steps.
     * If 2-wire or 4-wire interface, the 2nd moter pin.
     * @param {Pin} motorPin3 [optional] Only required for a 4-wire interface.
     * @param {Pin} motorPin4 [optional] Only required for a 4-wire interface.
     *
     * @example
     *     var Stepper = BO.io.Stepper,
     *         Event = JSUTILS.Event;
     *
     *     var stepper,
     *         stepsPerRev = 200,           // update this for your stepper
     *         numSteps = stepsPerRev * 10, // 10 revolutions (+ CW, - CCW)
     *         speed = 15.0,                // rad/sec (RPM = speed * 9.55)
     *         acceleration = 20.0,         // rad/sec^2
     *         deceleration = 20.0;         // rad/sec^2
     *
     *     stepper = new Stepper(arduino,
     *                  Stepper.TWO_WIRE, // or Stepper.DRIVER or Stepper.FOUR_WIRE
     *                  stepsPerRev,
     *                  arduino.getDigitalPin(2),
     *                  arduino.getDigitalPin(3));
     *
     *     stepper.addEventListener(Event.COMPLETE, onStepperComplete);
     *
     *     // acceleration and deceleration parameters are optional
     *     stepper.step(numSteps, speed, acceleration, deceleration);
     *
     *     function onStepperComplete(event) {
     *         // each stepper is assigned a read-only id value when instantiated
     *         console.log("stepper " + event.target.id + " sequence complete");
     *     }
     */
    Stepper = function (board, driverType, numStepsPerRev, directionPin, stepPin, motorPin3, motorPin4) {
        
        // create a new id each time a new instance is created
        this._id = instanceCounter++;
        if (this._id > 5) {
            console.log("Warning: A maximum of 6 Stepper instances can be created");
            return;
        }

        this.name = "Stepper";
        this._board = board;
        this._evtDispatcher = new EventDispatcher(this);

        var numStepsPerRevLSB = numStepsPerRev & 0x007F,
            numStepsPerRevMSB = (numStepsPerRev >> 7) & 0x007F,
            silent = true;

        // Setup pin mode but don't send set pin mode command to Firmata since
        // Firmata sets pin modes automatically in the Stepper implementation.
        this._board.setDigitalPinMode(directionPin.number, Pin.DOUT, silent);
        this._board.setDigitalPinMode(stepPin.number, Pin.DOUT, silent);

        this._board.addEventListener(IOBoardEvent.SYSEX_MESSAGE, this.onSysExMessage.bind(this));
        
        switch (driverType) {
        case Stepper.DRIVER:
        case Stepper.TWO_WIRE:
            // configure the stepper motor
            this._board.sendSysex(STEPPER,
                [CONFIG,
                this._id,
                driverType,
                numStepsPerRevLSB, 
                numStepsPerRevMSB,
                directionPin.number,
                stepPin.number]);
            break;
        case Stepper.FOUR_WIRE:
            this._board.setDigitalPinMode(motorPin3.number, Pin.DOUT, silent);
            this._board.setDigitalPinMode(motorPin4.number, Pin.DOUT, silent);

            // configure the stepper motor
            this._board.sendSysex(STEPPER,
                [CONFIG,
                this._id,
                driverType,
                numStepsPerRevLSB, 
                numStepsPerRevMSB,
                directionPin.number,
                stepPin.number,
                motorPin3.number,
                motorPin4.number]);
            break;
        }

    };

    Stepper.prototype = {

        constructor: Stepper,

        /**
         * Move the stepper a given number of steps at the specified
         * speed (rad/sec), acceleration (rad/sec^2) and deceleration (rad/sec^2).
         * The accel and decel parameters are optional but if using, both values
         * must be passed to the function.
         *
         * @method step
         * @param {Number} numSteps The number ofsteps to move the motor (max = +/-2097151 (21 bits)).
         * Positive value is clockwise, negative value is counter clockwise.
         * @param {Number} speed Max speed in rad/sec (1 rad/sec = 9.549 RPM)
         * (max precision of 2 decimal places)
         * @param {Number} accel [optional] Acceleration in rad/sec^2 (max precision of 2 decimal places)
         * @param {Number} decel [optional] Deceleration in rad/sec^2 (max precision of 2 decimal places)
         */      
        step: function (numSteps, speed, accel, decel) {
            var steps,
                speedLSB,
                speedMSB,
                accelLSB,
                accelMSB,
                decelLSB,
                decelMSB,
                direction = Stepper.CLOCKWISE;

            if (numSteps > MAX_STEPS) {
                numSteps = MAX_STEPS;
                console.log("Warning: Maximum number of steps (2097151) exceeded. Setting to step number to 2097151");
            }
            if (numSteps < -MAX_STEPS) {
                numSteps = -MAX_STEPS;
                console.log("Warning: Maximum number of steps (-2097151) exceeded. Setting to step number to -2097151");
            }

            if (numSteps > 0) {
                direction = Stepper.COUNTER_CLOCKWISE;
            }

            steps = [
                Math.abs(numSteps) & 0x0000007F,
                (Math.abs(numSteps) >> 7) & 0x0000007F,
                (Math.abs(numSteps) >> 14) & 0x0000007F
            ];

            // the stepper interface expects decimal expressed an an integer
            speed = Math.floor(speed.toFixed(2) * 100);

            if (speed > MAX_SPEED) {
                speed = MAX_SPEED;
                console.log("Warning: Maximum speed (163.83 rad/sec) exceeded. Setting speed to 163.83 rad/sec");
            }                   

            speedLSB = speed & 0x007F;
            speedMSB = (speed >> 7) & 0x007F;

            // make sure both accel and decel are defined
            if (accel !== undefined && decel !== undefined) {
                // the stepper interface expects decimal expressed an an integer
                accel = Math.floor(accel.toFixed(2) * 100);
                decel = Math.floor(decel.toFixed(2) * 100);

                accelLSB = accel & 0x007F;
                accelMSB = (accel >> 7) & 0x007F;

                decelLSB = decel & 0x007F;
                decelMSB = (decel >> 7) & 0x007F;               
                            
                this._board.sendSysex(STEPPER, 
                    [STEP,
                    this._id,
                    direction,
                    steps[0],
                    steps[1],
                    steps[2],
                    speedLSB,
                    speedMSB,
                    accelLSB,
                    accelMSB,
                    decelLSB,
                    decelMSB
                    ]);
            } else {
                // don't send accel and decel values
                this._board.sendSysex(STEPPER, 
                    [STEP,
                    this._id,
                    direction,
                    steps[0],
                    steps[1],
                    steps[2],
                    speedLSB,
                    speedMSB
                    ]);             
            }
        },

        /**
         * Listen for stepping complete event
         *
         * @private
         * @method onSysExMessage
         */
        onSysExMessage: function (event) {
            var message = event.message;

            if (message[0] !== STEPPER) {
                return;
            } else if (message[1] !== this._id) {
                return;
            } else {
                this.dispatchEvent(new Event(Event.COMPLETE));
            }
        },

        /**
         * [read-only] The id of the Stepper object instance. Each stepper motor
         * is given a unique id upon initialization.
         * @property id
         * @type Number
         */
        get id() {
            return this._id;
        },

        /* implement EventDispatcher */
        
        /**
         * @param {String} type The event type
         * @param {Function} listener The function to be called when the event is fired
         */
        addEventListener: function (type, listener) {
            this._evtDispatcher.addEventListener(type, listener);
        },
        
        /**
         * @param {String} type The event type
         * @param {Function} listener The function to be called when the event is fired
         */
        removeEventListener: function (type, listener) {
            this._evtDispatcher.removeEventListener(type, listener);
        },
        
        /**
         * @param {String} type The event type
         * return {boolean} True is listener exists for this type, false if not.
         */
        hasEventListener: function (type) {
            return this._evtDispatcher.hasEventListener(type);
        },
        
        /**
         * @param {Event} type The Event object
         * @param {Object} optionalParams Optional parameters to assign to the event object.
         * return {boolean} True if dispatch is successful, false if not.
         */     
        dispatchEvent: function (event, optionalParams) {
            return this._evtDispatcher.dispatchEvent(event, optionalParams);
        }           
    
    };

    /**
     * @property Stepper.CLOCKWISE
     * @static
     */
    Stepper.CLOCKWISE = 0;
    /**
     * @property Stepper.COUNTER_CLOCKWISE
     * @static
     */
    Stepper.COUNTER_CLOCKWISE = 1;
    /**
     * @property Stepper.DRIVER
     * @static
     */
    Stepper.DRIVER = 1;
    /**
     * @property Stepper.TWO_WIRE
     * @static
     */
    Stepper.TWO_WIRE = 2;
    /**
     * @property Stepper.FOUR_WIRE
     * @static
     */
    Stepper.FOUR_WIRE = 4;              

    return Stepper;

})();

JSUTILS.namespace('BO.io.BlinkM');

BO.io.BlinkM = (function () {

    var BlinkM;

    // dependencies
    var I2CBase = BO.I2CBase;

    /**
     * Creates an interface to a BlinkM RGB Led module. This
     * object allows you to change the color of the led, fade between
     * colors and run preprogrammed light scripts.
     * See [Breakout/examples/actuators/blinkM.html](https://github.com/soundanalogous/Breakout/blob/master/examples/actuators/blinkM.html) for an example application.
     *
     * @class BlinkM
     * @constructor
     * @extends BO.I2CBase 
     * @param {IOBoard} board The IOBoard instance
     * @param {Number} address The i2c address of the BlinkM module
     */
    BlinkM = function (board, address) {

        address = address || 0x09;  // default i2c address for BlinkM

        this.name = "BlinkM";
        
        // call super class
        I2CBase.call(this, board, address);
        

    };

    BlinkM.prototype = JSUTILS.inherit(I2CBase.prototype);
    BlinkM.prototype.constructor = BlinkM;


    /**
     * Sets the BlinkM to the specified RGB color immediately.
     *
     * @method goToRGBColorNow
     * @param {Number{}} color An array containing the RGB values. 
     * color[0] = R, color[1] = G, color[2] = B
     */
    BlinkM.prototype.goToRGBColorNow = function (color) {
        this.sendI2CRequest([I2CBase.WRITE, this.address, 0x6E, color[0], color[1], color[2]]);
    };
    
    /**
     * Fades to the specified RGB color in the specified time duration. 
     * The fade speed range is from 1 to 255, where 1 is the slowest time and
     * 255 is the fastest.
     *
     * @method fadeToRGBColor
     * @param {Number[]} color An array containing the RGB values.
     * color[0] = R, color[1] = G, color[2] = B
     * @param {Number} speed The fade speed. Default value is 15.
     */
    BlinkM.prototype.fadeToRGBColor = function (color, speed) {
        var fadeSpeed = speed || -1;
        if (fadeSpeed >= 0) {
            this.sendI2CRequest([I2CBase.WRITE, this.address, 0x66, fadeSpeed]);
        }
        this.sendI2CRequest([I2CBase.WRITE, this.address, 0x63, color[0], color[1], color[2]]);
    };

    /**
     * Fade to a random RGB color.
     * The fade speed range is from 1 to 255, where 1 is the slowest time and
     * 255 is the fastest.
     *
     * @method fadeToRandomRGBColor
     * @param {Number[]} colorRange An array containing a range for each color
     * value.
     * colorRange[0] = range for Red (0-255), colorRange[1] = range for Green, etc.
     * @param {Number} speed The fade speed. Default value is 15.
     */
    BlinkM.prototype.fadeToRandomRGBColor = function (colorRange, speed) {
        var fadeSpeed = speed || -1;
        if (fadeSpeed >= 0) {
            this.sendI2CRequest([I2CBase.WRITE, this.address, 0x66, fadeSpeed]);
        }
        this.sendI2CRequest([I2CBase.WRITE, this.address, 0x43, colorRange[0], colorRange[1], colorRange[2]]);
    };

    /**
     * Fades to the specified HSB color in the specified time duration. 
     * The fade speed range is from 1 to 255, where 1 is the slowest time and
     * 255 is the fastest.
     *
     * @method fadeToHSBColor
     * @param {Number[]} color An array containing the HSB values.
     * color[0] = H, color[1] = S, color[2] = B
     * @param {Number} speed The fade speed. Default value is 15.
     */
    BlinkM.prototype.fadeToHSBColor = function (color, speed) {
        var fadeSpeed = speed || -1;
        if (fadeSpeed >= 0) {
            this.sendI2CRequest([I2CBase.WRITE, this.address, 0x66, fadeSpeed]);
        }
        this.sendI2CRequest([I2CBase.WRITE, this.address, 0x68, color[0], color[1], color[2]]);
    };
    
    /**
     * Fade to a random HSB color.
     * The fade speed range is from 1 to 255, where 1 is the slowest time and
     * 255 is the fastest.
     *
     * @method fadeToRandomHSBColor
     * @param {Number[]} colorRange An array containing a range for each color
     * value.
     * colorRange[0] = range for Hue (0-255), colorRange[1] = range for
     * Saturation, etc.
     * @param {Number} speed The fade speed. Default value is 15.
     */ 
    BlinkM.prototype.fadeToRandomHSBColor = function (colorRange, speed) {
        var fadeSpeed = speed || -1;
        if (fadeSpeed >= 0) {
            this.sendI2CRequest([I2CBase.WRITE, this.address, 0x66, fadeSpeed]);
        }
        this.sendI2CRequest([I2CBase.WRITE, this.address, 0x48, colorRange[0], colorRange[1], colorRange[2]]);
    };

    /**
     * Set the rate at which color fading happens. The range is from 1 to 255,
     * where 1 is the slowest and 255 is the fastest (immediate).
     *
     * @method setFadeSpeed
     * @param {Number} speed
     */
    BlinkM.prototype.setFadeSpeed = function (speed) {
        this.sendI2CRequest([I2CBase.WRITE, this.address, 0x66, speed]);
    };
    
    /**
     * Play a predefined light script. See the BlinkM datasheet page 20 for a
     * list and description of the predefined scripts.
     *
     * @method playLightScript
     * @param {Number} scriptId The id of the light script (from 0 to 18).
     * @param {Number} theNumberOfRepeats The number of times the script should
     * repeat.
     * @param {Number} lineNumber The line number to begin the script from.
     */
    BlinkM.prototype.playLightScript = function (scriptId, theNumberOfRepeats, lineNumber) {
        var numOfRepeats = theNumberOfRepeats || 1;
        this.sendI2CRequest([I2CBase.WRITE, this.address, 0x70, scriptId, numOfRepeats, lineNumber]);
    };

    /**
     * Stop the currently playing predefined light script.
     * @method stopScript
     */
    BlinkM.prototype.stopScript = function () {
        //self.sendI2CRequest([I2CBase.WRITE, this.address, 'o'.charCodeAt(0)]);
        this.sendI2CRequest([I2CBase.WRITE, this.address, 0x6F]);
    };

    /**
     * @private
     * @method handleI2C
     */
    BlinkM.prototype.handleI2C = function (data) {
        // TODO: implement if needed
        console.log("BlinkM: " + data);
    };

    return BlinkM;

}());

JSUTILS.namespace('BO.io.CompassEvent');

BO.io.CompassEvent = (function () {

    var CompassEvent;

    // dependencies
    var Event = JSUTILS.Event;

    /**
     * An Event object to be dispatched (fired) by a Compass object.
     * @class CompassEvent
     * @constructor
     * @extends JSUTILS.Event
     * @param {String} type The event type   
     */
    CompassEvent = function (type) {

        Event.call(this, type);

        this.name = "CompassEvent";

    };

    /**
     * @property CompassEvent.UPDATE 
     * @static
     */
    CompassEvent.UPDATE = "update";
    

    CompassEvent.prototype = JSUTILS.inherit(Event.prototype);
    CompassEvent.prototype.constructor = CompassEvent;

    return CompassEvent;

}());

JSUTILS.namespace('BO.io.CompassHMC6352');

BO.io.CompassHMC6352 = (function () {

    var CompassHMC6352;

    // dependencies
    var I2CBase = BO.I2CBase,
        CompassEvent = BO.io.CompassEvent;

    /**
     * Creates an interface to an HMC6352 Digital Compass module.
     * Use the compass to obtain a heading. You must hold the sensor flat
     * to obtain the most accurate heading value (just like an analog compass).
     * The compass is also useful in obtaining a rotation value in relation
     * to a fixed position. See [Breakout/examples/sensors/hmc6352.html](https://github.com/soundanalogous/Breakout/blob/master/examples/sensors/hmc6352.html) and
     * [Breakout/examples/processing\_js/compass.html](https://github.com/soundanalogous/Breakout/blob/master/examples/processing_js/compass.html) for example applications.
     *
     * @class CompassHMC6352
     * @constructor
     * @extends BO.I2CBase
     * @param {IOBoard} board The IOBoard instance
     * @param {Number} address The i2c address of the compass module
     */
    CompassHMC6352 = function (board, address) {

        address = address || 0x21;
        this._heading = 0;
        this._lastHeading = 0;

        this.name = "CompassHMC6352";
        
        I2CBase.call(this, board, address);
            
        // 0x51 = 10 Hz measurement rate, Query mode
        this.sendI2CRequest([I2CBase.WRITE, this.address, 0x47, 0x74, 0x51]);
        this.sendI2CRequest([I2CBase.WRITE, this.address, 0x41]);
        
        this.startReading();

    };

    CompassHMC6352.prototype = JSUTILS.inherit(I2CBase.prototype);
    CompassHMC6352.prototype.constructor = CompassHMC6352;

    /**
     * [read-only] The heading in degrees.
     * @property heading
     * @type Number
     */      
    CompassHMC6352.prototype.__defineGetter__("heading", function () {return this._heading; });
    
    /**
     * @private
     * @method handleI2C
     */
    CompassHMC6352.prototype.handleI2C = function (data) {

        // data[0] = register
        this._heading = Math.floor(((data[1] << 8) | data[2]) / 10.0);
        
        if (this._heading != this._lastHeading) {
            this.dispatchEvent(new CompassEvent(CompassEvent.UPDATE));
        }
        this._lastHeading = this._heading;
    };
    
    /**
     * Start continuous reading of the sensor.
     * @method startReading
     */
    CompassHMC6352.prototype.startReading = function () {
        this.sendI2CRequest([I2CBase.READ_CONTINUOUS, this.address, 0x7F, 0x02]);
    };
    
    /**
     * Stop continuous reading of the sensor
     * @method stopReading
     */
    CompassHMC6352.prototype.stopReading = function () {
        this.sendI2CRequest([I2CBase.STOP_READING, this.address]);
    };


    // document events

    /**
     * The update event is dispatched when the compass heading is updated.
     * @type BO.io.CompassEvent.UPDATE
     * @event update
     * @param {BO.io.CompassHMC6352} target A reference to the CompassHMC6352 object.
     */     

    return CompassHMC6352;

}());
JSUTILS.namespace('BO.io.ButtonEvent');

BO.io.ButtonEvent = (function () {

    var ButtonEvent;

    // Dependencies
    var Event = JSUTILS.Event;

    /**
     * An Event object to be dispatched (fired) by a Button
     * object.
     * @class ButtonEvent
     * @constructor
     * @extends JSUTILS.Event
     * @param {String} type The event type   
     */
    ButtonEvent = function (type) {

        this.name = "ButtonEvent";

        Event.call(this, type);
    };

    /**
     * @property ButtonEvent.PRESS
     * @static
     */
    ButtonEvent.PRESS = "pressed";
    /**
     * @property ButtonEvent.RELEASE
     * @static
     */
    ButtonEvent.RELEASE = "released";
    /**
     * @property ButtonEvent.LONG_PRESS
     * @static
     */
    ButtonEvent.LONG_PRESS = "longPress";
    /**
     * @property ButtonEvent.SUSTAINED_PRESS
     * @static
     */
    ButtonEvent.SUSTAINED_PRESS = "sustainedPress";

    ButtonEvent.prototype = JSUTILS.inherit(Event.prototype);
    ButtonEvent.prototype.constructor = ButtonEvent;

    return ButtonEvent;

}());

JSUTILS.namespace('BO.io.Button');

BO.io.Button = (function () {

    var Button;

    // dependencies
    var PhysicalInputBase = BO.PhysicalInputBase,
        PinEvent = BO.PinEvent,
        Pin = BO.Pin,
        ButtonEvent = BO.io.ButtonEvent;

    /**
     * Creates and interface to a physical button. The Button object
     * dispatches events on state changes such as Pressed, Released and 
     * Sustained Press. The Button object also handles debouncing.
     *
     * The advantage of using the Button class over listening for pin change
     * events on a Pin object, is that the Button class handles debouncing and
     * provides helpful button events: Pressed, Released, Long Press and
     * Sustained Press
     *
     * <p>`PULL_UP` vs `PULL_DOWN`. If the other end of the resistor connected to
     * the button is connected to ground, configuration is `PULL_DOWN`, if the 
     * resistor is connected to power, then the configuration is `PULL_UP`.</p>
     *
     * @class Button
     * @constructor
     * @extends BO.PhysicalInputBase
     * @param {IOBoard} board A reference to the IOBoard instance
     * @param {Pin} pin A reference to the Pin the button is connected to.
     * @param {Number} buttonMode The mode of the button (either 
     * `Button.PULL_DOWN` or `Button.PULL_UP` if wired with external resistors or 
     * `Button.INTERNAL_PULL_UP` if using the internal pull-up resistors. Default
     * is `PULL_DOWN`.
     * @param {Number} sustainedPressInterval The delay time in milliseconds 
     * before a sustained press event is fired.
     */
    Button = function (board, pin, buttonMode, sustainedPressInterval) {
        "use strict";
        
        PhysicalInputBase.call(this);

        this.name = "Button";
        this._pin = pin;

        var pinNumber = pin.number;
        
        this.buttonMode = buttonMode || Button.PULL_DOWN;
        this._sustainedPressInterval = sustainedPressInterval || 1000;

        this._debounceInterval = 20;
        this._repeatCount = 0;
        this._timer = null;
        this._timeout = null;
        
        this._board = board;
        board.setDigitalPinMode(pinNumber, Pin.DIN);

        if (this.buttonMode === Button.INTERNAL_PULL_UP) {
            // Enable internal pull up resistor
            board.enablePullUp(pinNumber);
            // Set value to high to avoid initial change event
            this._pin.value = Pin.HIGH;
        } else if (this.buttonMode === Button.PULL_UP) {
            // Set value to high to avoid initial change event
            this._pin.value = Pin.HIGH;
        }
        this._pin.addEventListener(PinEvent.CHANGE, this.onPinChange.bind(this));   
    };

    Button.prototype = JSUTILS.inherit(PhysicalInputBase.prototype);
    Button.prototype.constructor = Button;

    /**
     * @private
     * @method onPinChange
     */
    Button.prototype.onPinChange = function (evt) {
        
        var btnVal = evt.target.value;
        var stateHandler;
                
        if (this.buttonMode === Button.PULL_DOWN) {
            if (btnVal === 1) {
                stateHandler = this.pressed;
            } else {
                stateHandler = this.released;
            }
        } else if (this.buttonMode === Button.PULL_UP || this.buttonMode === Button.INTERNAL_PULL_UP) {
            if (btnVal === 1) {
                stateHandler = this.released;
            } else {
                stateHandler = this.pressed;
            }
        }
        
        if (this._timeout === null) {
            this._timeout = setTimeout(stateHandler.bind(this), this._debounceInterval);
        } else {
            clearTimeout(this._timeout);
            this._timeout = setTimeout(stateHandler.bind(this), this._debounceInterval);
        }
    };
    
    /**
     * @private
     * @method pressed
     */
    Button.prototype.pressed = function () {
        this._timeout = null;

        this.dispatchEvent(new ButtonEvent(ButtonEvent.PRESS));
        
        this._timer = setInterval(this.sustainedPress.bind(this), this._sustainedPressInterval);
    };
    
    /**
     * @private
     * @method released
     */ 
    Button.prototype.released = function () {
        this._timeout = null;
        this.dispatchEvent(new ButtonEvent(ButtonEvent.RELEASE));
        
        if (this._timer !== null) {
            clearInterval(this._timer);
            this._timer = null;
        }
        
        this._repeatCount = 0;
    };
    
    /**
     * @private
     * @method sustainedPress
     */
    Button.prototype.sustainedPress = function () {
        if (this._repeatCount > 0) {
            this.dispatchEvent(new ButtonEvent(ButtonEvent.SUSTAINED_PRESS));
        } else {
            this.dispatchEvent(new ButtonEvent(ButtonEvent.LONG_PRESS));
        }
        
        this._repeatCount++;
    };
    
    /**
     * The debounce time interval in milliseconds.
     * @property debounceInterval
     * @type Number
     */ 
    Button.prototype.__defineGetter__("debounceInterval", function () { return this._debounceInterval; });
    Button.prototype.__defineSetter__("debounceInterval", function (interval) { this._debounceInterval = interval; });
    
    /**
     * The delay time (in milliseconds) the button must be held before a
     * sustained press event is fired.
     * @property sustainedPressInterval
     * @type Number
     */ 
    Button.prototype.__defineGetter__("sustainedPressInterval", function () { return this._sustainedPressInterval; });
    Button.prototype.__defineSetter__("sustainedPressInterval", function (intervalTime) { this._sustainedPressInterval = intervalTime; });

    /**
     * [read-only] The pin number of the pin the button is attached to.
     * @property pinNumber
     * @type Number
     */
    Button.prototype.__defineGetter__("pinNumber", function () { return this._pin.number; });    

    /**
     * @property Button.PULL_DOWN
     * @static
     */
    Button.PULL_DOWN = 0;
    /**
     * @property Button.PULL_UP
     * @static
     */
    Button.PULL_UP = 1;
    /**
     * @property Button.INTERNAL_PULL_UP
     * @static
     */
    Button.INTERNAL_PULL_UP = 2;


    // Document events

    /**
     * The pressed event is dispatched when the button is pressed.
     * @type BO.io.ButtonEvent.PRESS
     * @event pressed
     * @param {BO.io.Button} target A reference to the Button object
     */ 

    /**
     * The released event is dispatched when the button is released.
     * @type BO.io.ButtonEvent.RELEASE
     * @event released
     * @param {BO.io.Button} target A reference to the Button object
     */ 
     
    /**
     * The longPress event is dispatched once when the button has been held for
     * the time duration specified by the sustainedPressInterval property.
     * @type BO.io.ButtonEvent.LONG_PRESS
     * @event longPress
     * @param {BO.io.Button} target A reference to the Button object
     */ 
     
    /**
     * The sustainedPress event is dispatched continuously at the rate 
     * specified by the sustainedPressInterval property while the button is
     * held.
     * @type BO.io.ButtonEvent.SUSTAINED_PRESS
     * @event sustainedPress
     * @param {BO.io.Button} target A reference to the Button object
     */              

    return Button;

}());

JSUTILS.namespace('BO.io.PotEvent');

BO.io.PotEvent = (function () {

    var PotEvent;

    // Dependencies
    var Event = JSUTILS.Event;

    /**
     * An Event object to be dispatched (fired) by a Potentiometer
     * object.
     * @class PotEvent
     * @constructor
     * @extends JSUTILS.Event
     * @param {String} type The event type
     */
    PotEvent = function (type) {

        this.name = "PotEvent";
        
        // Call the super class
        // 2nd parameter is passed to EventDispatcher constructor
        Event.call(this, type);
    };

    // Events
    /**
     * @property PotEvent.CHANGE
     * @static
     */
    PotEvent.CHANGE = "potChange";  

    PotEvent.prototype = JSUTILS.inherit(Event.prototype);
    PotEvent.prototype.constructor = PotEvent;

    return PotEvent;

}());

JSUTILS.namespace('BO.io.Potentiometer');

BO.io.Potentiometer = (function () {

    var Potentiometer;

    // Dependencies
    var Pin = BO.Pin,
        PhysicalInputBase = BO.PhysicalInputBase,
        Scaler = BO.filters.Scaler,
        Convolution = BO.filters.Convolution,
        PinEvent = BO.PinEvent,
        PotEvent = BO.io.PotEvent;

    /**
     * Creates an interface to an analog input sensor. This may be a
     * potentiometer (dial) or any other analog input that is connected to a
     * single analog pin.
     *
     * @class Potentiometer
     * @constructor
     * @extends BO.PhysicalInputBase    
     * @param {IOBoard} board A reference to the IOBoard instance that the
     * servo is attached to.
     * @param {Pin} pin A reference to the Pin the potentiometer is connected
     * to.
     * @param {Boolean} enableSmoothing True to enable smoothing, false to
     * disable. Default is false.
     */
    Potentiometer = function (board, pin, enableSmoothing) {
        "use strict";

        PhysicalInputBase.call(this);
        
        this.name = "Potentiometer";
        this._pin = pin;

        enableSmoothing = enableSmoothing || false;

        var analogPinNumber = this._pin.analogNumber;
        board.enableAnalogPin(analogPinNumber);

        if (enableSmoothing) {
            this._pin.addFilter(new Convolution(Convolution.MOVING_AVERAGE));
        }

        this._pin.addEventListener(PinEvent.CHANGE, this.onPinChange.bind(this));
    };

    Potentiometer.prototype = JSUTILS.inherit(PhysicalInputBase.prototype);
    Potentiometer.prototype.constructor = Potentiometer;
    
    /**
     * [read-only] The current value of the potentiometer.
     * @property value
     * @type Number
     */ 
    Potentiometer.prototype.__defineGetter__("value", function () { return this._pin.value; });

    /**
     * [read-only] Get the (pre-filtered) average value of the potentiometer.
     * @property average
     * @type Number
     */ 
    Potentiometer.prototype.__defineGetter__("average", function () { return this._pin.average; });

    /**
     * [read-only] Get the value of the potentiometer before filters are
     * applied.
     * @property preFilterValue
     * @type Number
     */ 
    Potentiometer.prototype.__defineGetter__("preFilterValue", function () { return this._pin.preFilterValue; });

    /**
     * [read-only] Get the (pre-filtered) minimum value read by the
     * potentiometer.
     * @property minimum
     * @type Number
     */ 
    Potentiometer.prototype.__defineGetter__("minimum", function () { return this._pin.minimum; });

    /**
     * [read-only] Get the (pre-filtered) maximum value read by the
     * potentiometer.
     * @property maximum
     * @type Number
     */ 
    Potentiometer.prototype.__defineGetter__("maximum", function () { return this._pin.maximum; });

    /**
     * Resets the minimum, maximum, and average values.
     * @method clear
     */
    Potentiometer.prototype.clear = function () {
        this._pin.clear();
    };

    /**
     * Scale from the minimum and maximum input values to 0.0 -> 1.0. This is
     * useful for sensors such as a flex sensor that may not return the full
     * range of 0 to 1. 
     *
     * @method setRange
     * @param {Number} minimum The new minimum range (must be less than the maximum).
     * @param {Number} maximum The new maximum range.
     */
    Potentiometer.prototype.setRange = function (minimum, maximum) {
        minimum = minimum || 0;
        maximum = maximum || 1;
        this._pin.addFilter(new Scaler(minimum, maximum, 0, 1, Scaler.LINEAR));
    };

    /**
     * @private
     * @method onPinChange
     */
    Potentiometer.prototype.onPinChange = function (event) {
        this.dispatchEvent(new PotEvent(PotEvent.CHANGE));
    };

    // Document events

    /**
     * The change event is dispatched when the potentiometer value changes.
     * @example
     *     pot.addEventListener(PotEvent.CHANGE, onValueChange);
     *
     *     function onValueChange(event) {
     *         console.log("value = " + event.target.value);  
     *     }
     *
     * @type BO.io.PotEvent.CHANGE
     * @event change
     * @param {BO.Potentiometer} target A reference to the Potentiometer object
     */

    return Potentiometer;

}());

JSUTILS.namespace('BO.io.AccelerometerEvent');

BO.io.AccelerometerEvent = (function () {

    var AccelerometerEvent;

    // dependencies
    var Event = JSUTILS.Event;

    /**
     * An Event object to be dispatched (fired) by an Accelerometer object.
     * @class AccelerometerEvent
     * @constructor
     * @extends JSUTILS.Event
     * @param {String} type The event type   
     */
    AccelerometerEvent = function (type) {

        Event.call(this, type);

        this.name = "AccelerometerEvent";

    };

    /**
     * @property AccelerometerEvent.UPDATE 
     * @static
     */
    AccelerometerEvent.UPDATE = "update";
    

    AccelerometerEvent.prototype = JSUTILS.inherit(Event.prototype);
    AccelerometerEvent.prototype.constructor = AccelerometerEvent;

    return AccelerometerEvent;

}());

JSUTILS.namespace('BO.io.AnalogAccelerometer');

BO.io.AnalogAccelerometer = (function () {
    "use strict";

    var AnalogAccelerometer;

    // private static constants
    var RAD_TO_DEG = 180 / Math.PI;

        // dependencies
    var PhysicalInputBase = BO.PhysicalInputBase,
        PinEvent = BO.PinEvent,
        AccelerometerEvent = BO.io.AccelerometerEvent,
        Scaler = BO.filters.Scaler,
        Convolution = BO.filters.Convolution;

    /**
     * Creates an interface to an analog accelerometer. Use the
     * accelerometer to read the acceleration along the x, y, and z axis of an 
     * object it is attached to. You can also obtain the pitch and roll. This
     * object should interface with most analog accelerometers. See
     * [Breakout/examples/sensors/analog\_accelerometer.html](https://github.com/soundanalogous/Breakout/blob/master/examples/sensors/analog_accelerometer.html) and 
     * [Breakout/examples/three\_js/accelerometer.html](https://github.com/soundanalogous/Breakout/blob/master/examples/three_js/accelerometer.html) for example applications.
     *
     * @class AnalogAccelerometer
     * @constructor
     * @extends BO.PhysicalInputBase    
     * @param {IOBoard} board A reference to the IOBoard instance
     * @param {Pin} xPin A reference to the Pin connected to the x axis of the
     * accelerometer
     * @param {Pin} yPin A reference to the Pin connected to the y axis of the
     * accelerometer
     * @param {Pin} zPin A reference to the Pin connected to the z axis of the
     * accelerometer
     * @param {Number} dynamicRange The range of the acceleromter in Gs
     * (typically 2 or 3 for an 
     * analog accelerometer). See the datasheet for the acceleromter to get
     * the exact value.
     * @param {Boolean} enableSmoothing True to enable smoothing, false to
     * disable. Default is false.
     */
    AnalogAccelerometer = function (board, xPin, yPin, zPin, dynamicRange, enableSmoothing) {

        // Call the super class
        PhysicalInputBase.call(this);

        this.name = "AnalogAccelerometer";

        // Enable the analog pins
        board.enableAnalogPin(xPin.analogNumber);
        board.enableAnalogPin(yPin.analogNumber);
        board.enableAnalogPin(zPin.analogNumber);       

        this._enableSmoothing = enableSmoothing || false;
        this._xPin = xPin || null;
        this._yPin = yPin || null;
        this._zPin = zPin || null;

        // Common accelerometer interface values:
        this._dynamicRange = dynamicRange || 1;
        this._x = 0;
        this._y = 0;
        this._z = 0;

        if (this._xPin !== null) {
            this._xPin.addEventListener(PinEvent.CHANGE, this.xAxisChanged.bind(this));
        }

        if (this._yPin !== null) {
            this._yPin.addEventListener(PinEvent.CHANGE, this.yAxisChanged.bind(this));
        }
        
        if (this._zPin !== null) {
            this._zPin.addEventListener(PinEvent.CHANGE, this.zAxisChanged.bind(this));
        }
        
    };

    AnalogAccelerometer.prototype = JSUTILS.inherit(PhysicalInputBase.prototype);
    AnalogAccelerometer.prototype.constructor = AnalogAccelerometer;

    // Implement Acceleromter interface:

    /**
     * [read-only] The current range setting of the accelerometer in units 
     * of gravity (9.8 m/sec2).
     * @property dynamicRange
     * @type Number
     */ 
    AnalogAccelerometer.prototype.__defineGetter__("dynamicRange", function () { return this._dynamicRange; });

    /**
     * [read-only] The x axis of the accelerometer in units 
     * of gravity (9.8 m/sec2).
     * @property x
     * @type Number
     */ 
    AnalogAccelerometer.prototype.__defineGetter__("x", function () { return this._x; });

    /**
     * [read-only] The y axis of the accelerometer in units 
     * of gravity (9.8 m/sec2).
     * @property y
     * @type Number
     */ 
    AnalogAccelerometer.prototype.__defineGetter__("y", function () { return this._y; });

    /**
     * [read-only] The z axis of the accelerometer in units 
     * of gravity (9.8 m/sec2).
     * @property z
     * @type Number
     */ 
    AnalogAccelerometer.prototype.__defineGetter__("z", function () { return this._z; });

    /**
     * [read-only] The pitch value in degrees.
     * @property pitch
     * @type Number
     */ 
    AnalogAccelerometer.prototype.__defineGetter__("pitch", function () { 
        // -180 to 180
        //return Math.atan2(this._x, this._z) * RAD_TO_DEG;
        // -90 to 90
        return Math.atan2(this._x, Math.sqrt(this._y * this._y + this._z * this._z)) * RAD_TO_DEG;
    });
    
    /**
     * [read-only] The roll value in degrees.
     * @property roll
     * @type Number
     */ 
    AnalogAccelerometer.prototype.__defineGetter__("roll", function () { 
        // -180 to 180
        //return Math.atan2(this._y, this._z) * RAD_TO_DEG;
        // -90 to 90
        return Math.atan2(this._y, Math.sqrt(this._x * this._x + this._z * this._z)) * RAD_TO_DEG;
    }); 

    // Methods specific to this Accelerometer type:

    AnalogAccelerometer.prototype.__defineGetter__("xPin", function () { 
        return this._xPin;
    });

    AnalogAccelerometer.prototype.__defineGetter__("yPin", function () { 
        return this._yPin;
    }); 
    
    AnalogAccelerometer.prototype.__defineGetter__("zPin", function () { 
        return this._zPin;
    });         
    
    /**
     * Scale the range for the specified axis (from 0 to 1) to (minimum to 
     * maximum).
     *
     * @method setRangeFor 
     * @param axis the axis to set new range (AnalogAccelerometer.X_AXIS, 
     * AnalogAccelerometer.Y_AXIS or AnalogAccelerometer.Z_AXIS).
     * @param {Number} minimum The new minimum value
     * @param {Number} maximum The new maximum value
     */
    AnalogAccelerometer.prototype.setRangeFor = function (axis, minimum, maximum) {
        var range = this._dynamicRange;

        if (axis === AnalogAccelerometer.X_AXIS) {
            if (this._xPin !== null) {
                this._xPin.filters = [new Scaler(minimum, maximum, -range, range, Scaler.LINEAR)];
                if (this._enableSmoothing) {
                    this._xPin.addFilter(new Convolution(Convolution.MOVING_AVERAGE));
                }
            }
        } else if (axis === AnalogAccelerometer.Y_AXIS) {
            if (this._yPin !== null) {
                this._yPin.filters = [new Scaler(minimum, maximum, -range, range, Scaler.LINEAR)];
                if (this._enableSmoothing) {
                    this._yPin.addFilter(new Convolution(Convolution.MOVING_AVERAGE));
                }
            }
        } else if (axis === AnalogAccelerometer.Z_AXIS) {
            if (this._zPin !== null) {
                this._zPin.filters = [new Scaler(minimum, maximum, -range, range, Scaler.LINEAR)];
                if (this._enableSmoothing) {
                    this._zPin.addFilter(new Convolution(Convolution.MOVING_AVERAGE));
                }
            }
        }
    };

    // Calibration:
    // For each axis, calculate variance from -1 and 1
    // assume zero g = supply voltage/2 and sensitivity is supply voltage / 10 per g
    // at -1 g, voltage should be (supply voltage/2) - (supply voltage / 10)
    // at 1 g, voltage should be (supply voltage/2) + (supply voltage / 10)

    /**
     * Use this method to get the minimum and maximum range values for an axis.
     * Create a new object to store the return value and then pass obj.min
     * and obj.max along with the respective axis identifier to the setRangeFor
     * method.
     * 
     * @method getCalibratedRange
     * @param {Number} minVoltage The minimum value reported on the axis
     * @param {Number} maxVoltage The maximum value reported on the axis
     * @param {Number} supplyVoltage The supply voltage of the Acceleromter
     * (enter as 3.3, 3.0, 5.0, etc).
     * @return {Object} An object containing the min and max range values to be
     * passed to the setRangeFor method.
     */
    AnalogAccelerometer.prototype.getCalibratedRange = function (minVoltage, maxVoltage, supplyVoltage) {
        var range = {min: 0, max: 0};
        
        var mVPerG = (maxVoltage - minVoltage) / 2;
        
        // Find zero G (average of min and max)
        var zeroG = (minVoltage + maxVoltage) / 2;
        
        range.min = (zeroG - (mVPerG * this._dynamicRange)) / supplyVoltage;
        range.max = (zeroG + (mVPerG * this._dynamicRange)) / supplyVoltage;
        
        return range;
    };      

    /**
     * @private
     * @method xAxisChanged
     */
    AnalogAccelerometer.prototype.xAxisChanged = function (event) {
        this._x = event.target.value;
        this.dispatchEvent(new AccelerometerEvent(AccelerometerEvent.UPDATE));
    };

    /**
     * @private
     * @method yAxisChanged
     */
    AnalogAccelerometer.prototype.yAxisChanged = function (event) {
        this._y = event.target.value;
        this.dispatchEvent(new AccelerometerEvent(AccelerometerEvent.UPDATE));
    };
    
    /**
     * @private
     * @method zAxisChanged
     */
    AnalogAccelerometer.prototype.zAxisChanged = function (event) {
        this._z = event.target.value;
        this.dispatchEvent(new AccelerometerEvent(AccelerometerEvent.UPDATE));
    };      

    /**
     * @property AnalogAccelerometer.X_AXIS
     * @static
     */
    AnalogAccelerometer.X_AXIS = 0;
    /**
     * @property AnalogAccelerometer.Y_AXIS
     * @static
     */
    AnalogAccelerometer.Y_AXIS = 1;
    /**
     * @property AnalogAccelerometer.Z_AXIS
     * @static
     */
    AnalogAccelerometer.Z_AXIS = 2;


    // Document events

    /**
     * The update event is dispatched when the accelerometer values are updated.
     * @type BO.io.AccelerometerEvent.UPDATE
     * @event update
     * @param {BO.io.AnalogAccelerometer} target A reference to the 
     * AnalogAccelerometer object.
     */     

    return AnalogAccelerometer;

}());

JSUTILS.namespace('BO.io.AccelerometerADXL345');

/**
 * @namespace BO.io
 */
BO.io.AccelerometerADXL345 = (function () {
    "use strict";

    var AccelerometerADXL345;

    // private static constants
    var RAD_TO_DEG = 180 / Math.PI,
        POWER_CTL = 0x2D,
        DATAX0 = 0x32,
        DATA_FORMAT = 0x31,
        OFSX = 0x1E,
        OFSY = 0x1F,
        OFSZ = 0x20,
        ALL_AXIS =  DATAX0 | 0x80,
        NUM_BYTES = 6;  

    // dependencies
    var I2CBase = BO.I2CBase,
        AccelerometerEvent = BO.io.AccelerometerEvent;

    /**
     * Creates an interface to an ADXL345 3-axis accelerometer. Use the
     * accelerometer to read the acceleration along the x, y, and z axis of an 
     * object it is attached to. You can also obtain the pitch and roll. See the
     * example in [Breakout/examples/sensors/adxl345.html](https://github.com/soundanalogous/Breakout/blob/master/examples/sensors/adxl345.html).
     *
     * @class AccelerometerADXL345
     * @constructor
     * @extends BO.I2CBase
     * @param {IOBoard} board The IOBoard instance
     * @param {Number} range The dynamic range selection in Gs (options `RANGE_2G`, `RANGE_4G`, 
     * `RANGE_8G`, `RANGE_16G`). Default is `RANGE_2G`.    
     * @param {Number} address The i2c address of the accelerometer (default is 0x53)
     */
    AccelerometerADXL345 = function (board, range, address) {

        address = address || AccelerometerADXL345.DEVICE_ID;
        I2CBase.call(this, board, address);

        this.name = "AccelerometerADXL345";

        this._dynamicRange = range || AccelerometerADXL345.RANGE_2G;
        
        this._sensitivity = {
            x: AccelerometerADXL345.DEFAULT_SENSITIVITY,
            y: AccelerometerADXL345.DEFAULT_SENSITIVITY,
            z: AccelerometerADXL345.DEFAULT_SENSITIVITY,
        };

        this._offset = {x: 0, y: 0, z: 0};

        this._isReading = false;
        this._debugMode = BO.enableDebugging;

        this._x = 0;
        this._y = 0;
        this._z = 0;
        this._rawX = 0;
        this._rawY = 0;
        this._rawZ = 0;

        // initiate the device
        this.powerOn();

        // sets the dynamic range and sets teh full_res bit
        this.setRangeAndFullRes(this._dynamicRange);

    };

    AccelerometerADXL345.prototype = JSUTILS.inherit(I2CBase.prototype);
    AccelerometerADXL345.prototype.constructor = AccelerometerADXL345;


    // Implement Acceleromter interface:

    /**
     * [read-only] the accelerometer dynamic range in Gs (either 2G, 4G, 8G, or 16G for this sensor)..
     * @property dynamicRange
     * @type Number
     */      
    AccelerometerADXL345.prototype.__defineGetter__("dynamicRange", function () { return this._dynamicRange; });

    /**
     * [read-only] The acceleration value in Gs (9.8m/sec^2) along the x-axis.
     * @property x
     * @type Number
     */      
    AccelerometerADXL345.prototype.__defineGetter__("x", function () { return this._x; });

    /**
     * [read-only] The acceleration value in Gs (9.8m/sec^2) along the y-axis.
     * @property y
     * @type Number
     */      
    AccelerometerADXL345.prototype.__defineGetter__("y", function () { return this._y; });
    
    /**
     * [read-only] The acceleration value in Gs (9.8m/sec^2) along the z-axis.
     * @property z
     * @type Number
     */      
    AccelerometerADXL345.prototype.__defineGetter__("z", function () { return this._z; });
    
    /**
     * [read-only] The pitch value in degrees 
     * @property pitch
     * @type Number
     */ 
    AccelerometerADXL345.prototype.__defineGetter__("pitch", function () { 
        // -180 to 180
        //return Math.atan2(this._x, this._z) * RAD_TO_DEG;
        // -90 to 90
        return Math.atan2(this._x, Math.sqrt(this._y * this._y + this._z * this._z)) * RAD_TO_DEG;
    });
    
    /**
     * [read-only] The roll value in degrees 
     * @property roll
     * @type Number
     */ 
    AccelerometerADXL345.prototype.__defineGetter__("roll", function () { 
        // -180 to 180
        //return Math.atan2(this._y, this._z) * RAD_TO_DEG;
        // -90 to 90
        return Math.atan2(this._y, Math.sqrt(this._x * this._x + this._z * this._z)) * RAD_TO_DEG;
    });
    
    // Methods specific to this Accelerometer type:     

    /**
     * The raw value of the x axis
     * @property rawX
     * @type Number
     */      
    AccelerometerADXL345.prototype.__defineGetter__("rawX", function () { return this._rawX; });

    /**
     * The raw value of the y axis
     * @property rawY
     * @type Number
     */      
    AccelerometerADXL345.prototype.__defineGetter__("rawY", function () { return this._rawY; });
    
    /**
     * The raw value of the z axis
     * @property rawZ
     * @type Number
     */      
    AccelerometerADXL345.prototype.__defineGetter__("rawZ", function () { return this._rawZ; });

    /**
     * [read-only] The state of continuous read mode. True if continuous read mode
     * is enabled, false if it is disabled.
     * @property isRunning
     * @type Boolean
     */      
    AccelerometerADXL345.prototype.__defineGetter__("isRunning", function () { return this._isReading; });   
    
    /**
     * The sensitivity value for the x axis (default value = 0.0390625).
     * @property sensitivityX
     * @type Number
     */      
    AccelerometerADXL345.prototype.__defineGetter__("sensitivityX", function () { return this._sensitivity.x; });
    AccelerometerADXL345.prototype.__defineSetter__("sensitivityX", function (val) { this._sensitivity.x = val; });

    /**
     * The sensitivity value for the y axis (default value = 0.0390625).
     * @property sensitivityY
     * @type Number
     */      
    AccelerometerADXL345.prototype.__defineGetter__("sensitivityY", function () { return this._sensitivity.y; });
    AccelerometerADXL345.prototype.__defineSetter__("sensitivityY", function (val) { this._sensitivity.y = val; });
    
    /**
     * The sensitivity value for the z axis (default value = 0.0390625).
     * @property sensitivityZ
     * @type Number
     */      
    AccelerometerADXL345.prototype.__defineGetter__("sensitivityZ", function () { return this._sensitivity.z; });
    AccelerometerADXL345.prototype.__defineSetter__("sensitivityZ", function (val) { this._sensitivity.z = val; });          

    /**
     * @private
     * @method setRangeAndFullRes
     */
    AccelerometerADXL345.prototype.setRangeAndFullRes = function (range) {
            
        var setting;
        
        switch (range) {
        case 2:
            setting = 0x00;
            break;
        case 4:
            setting = 0x01;
            break;
        case 8:
            setting = 0x02;
            break;
        case 16:
            setting = 0x03;
            break;
        default:
            setting = 0x00;
            break;
        }
        
        // set full scale bit (3) and range bits (0 - 1)
        setting |= (0x08 & 0xEC);
        this.sendI2CRequest([I2CBase.WRITE, this._address, DATA_FORMAT, setting]);
    };   
    
    /**
     * @private
     * @method handleI2C
     */
    AccelerometerADXL345.prototype.handleI2C = function (data) {
        switch (data[0]) {
        case ALL_AXIS:
            this.readAccel(data);
            break;
        case OFSX:
            this.debug("offset x = " + data[2]);
            break;
        case OFSY:
            this.debug("offset y = " + data[2]);
            break;
        case OFSZ:
            this.debug("offset z = " + data[2]);
            break;
        }
    };
    
    /**
     * Start continuous reading of the sensor.
     * @method startReading
     */
    AccelerometerADXL345.prototype.startReading = function () {
        if (!this._isReading) {
            this._isReading = true;
            this.sendI2CRequest([I2CBase.READ_CONTINUOUS, this.address, ALL_AXIS, NUM_BYTES]);
        }
    };
    
    /**
     * Stop continuous reading of the sensor.
     * @method stopReading
     */
    AccelerometerADXL345.prototype.stopReading = function () {
        this._isReading = false;
        this.sendI2CRequest([I2CBase.STOP_READING, this.address]);
    };

    /**
     * Offset the x, y, or z axis output by the respective input value.
     * @method setAxisOffset
     */     
    AccelerometerADXL345.prototype.setAxisOffset = function (xVal, yVal, zVal) {
        // store values so we can retrieve via getAxisOffset
        this._offset.x = xVal;
        this._offset.y = yVal;
        this._offset.z = zVal;
        
        this.sendI2CRequest([I2CBase.WRITE, this.address, OFSX, xVal]);
        this.sendI2CRequest([I2CBase.WRITE, this.address, OFSY, yVal]);
        this.sendI2CRequest([I2CBase.WRITE, this.address, OFSZ, zVal]);
    };
    
    /**
     * Get the value of the x, y, and z axis offset.
     * @method getAxisOffset
     */
    AccelerometerADXL345.prototype.getAxisOffset = function () {
        // will trace values if debug mode is enabled
        this.sendI2CRequest([I2CBase.READ, this.address, OFSX, 1]);
        this.sendI2CRequest([I2CBase.READ, this.address, OFSY, 1]);
        this.sendI2CRequest([I2CBase.READ, this.address, OFSZ, 1]);
        
        // return the locally stored values because it is not possible
        // without a more elaborate design to get i2c read values
        // in a single call
        return this._offset;
    };

    /** 
     * Sends read request to accelerometer and updates accelerometer values.
     * @method update
     */
    AccelerometerADXL345.prototype.update = function () {
        if (this._isReading) {
            this.stopReading(); 
        }
        // read data: contents of X, Y, and Z registers
        this.sendI2CRequest([I2CBase.READ, this.address, ALL_AXIS, NUM_BYTES]);
    };

    /**
     * @private
     * @method powerOn
     */
    AccelerometerADXL345.prototype.powerOn = function () {

        // standby mode
        this.sendI2CRequest([I2CBase.WRITE, this.address, POWER_CTL, 0]);
        
        // set measure bit
        this.setRegisterBit(POWER_CTL, 3, true);
    };
    
    /**
     * @private
     * @method setRegisterBit
     */
    AccelerometerADXL345.prototype.setRegisterBit = function (regAddress, bitPos, state) {
        var value;
        
        if (state) {
            value |= (1 << bitPos);
        } else {
            value &= ~(1 << bitPos);
        }

        this.sendI2CRequest([I2CBase.WRITE, this.address, regAddress, value]);
    };

    /**
     * @private
     * @method readAccel
     */
    AccelerometerADXL345.prototype.readAccel = function (data) {
        
        var x_val,
            y_val,
            z_val;

        if (data.length != NUM_BYTES + 1) {
            throw new Error("Incorrect number of bytes returned");
        }
        
        x_val = (data[2] << 8) | (data[1]);
        y_val = (data[4] << 8) | (data[3]);
        z_val = (data[6] << 8) | (data[5]);
        
        if (x_val >> 15) {
            this._rawX = ((x_val ^ 0xFFFF) + 1) * -1;
        } else {
            this._rawX = x_val;
        }
        if (y_val >> 15) {
            this._rawY = ((y_val ^ 0xFFFF) + 1) * -1;
        } else {
            this._rawY = y_val;
        }
        if (z_val >> 15) {
            this._rawZ = ((z_val ^ 0xFFFF) + 1) * -1;
        } else {
            this._rawZ = z_val;
        }

        this._x = this._rawX * this._sensitivity.x;
        this._y = this._rawY * this._sensitivity.y;
        this._z = this._rawZ * this._sensitivity.z;
        
        this.dispatchEvent(new AccelerometerEvent(AccelerometerEvent.UPDATE));          
    };
    
    /**
     * for debugging
     * @private
     */
    AccelerometerADXL345.prototype.debug = function (str) {
        if (this._debugMode) {
            console.log(str); 
        }
    };
        
    // public static constants
    
    /**
     * @property AccelerometerADXL345.RANGE_2G 
     * @static
     */
    AccelerometerADXL345.RANGE_2G = 2;
    /**
     * @property AccelerometerADXL345.RANGE_4G 
     * @static
     */
    AccelerometerADXL345.RANGE_4G = 4;
    /**
     * @property AccelerometerADXL345.RANGE_8G 
     * @static
     */
    AccelerometerADXL345.RANGE_8G = 8;
    /**
     * @property AccelerometerADXL345.RANGE_16G 
     * @static
     */
    AccelerometerADXL345.RANGE_16G = 16;
    /**
     * @property AccelerometerADXL345.DEVICE_ID 
     * @static
     */
    AccelerometerADXL345.DEVICE_ID = 0x53;
    /**
     * @property AccelerometerADXL345.DEFAULT_SENSITIVITY 
     * @static
     */
    AccelerometerADXL345.DEFAULT_SENSITIVITY = 0.00390625;
    
    // document events

    /**
     * The update event is dispatched when the accelerometer values are updated.
     * @type BO.io.AccelerometerEvent.UPDATE
     * @event update
     * @param {BO.io.AccelerometerADXL345} target A reference to the AccelerometerADXL345 object.
     */                     

    return AccelerometerADXL345;

}());
JSUTILS.namespace('BO.io.GyroEvent');

BO.io.GyroEvent = (function () {

    var GyroEvent;

    // dependencies
    var Event = JSUTILS.Event;

    /**
     * An Event object to be dispatched (fired) by a Gyroscope
     * object.
     * @class GyroEvent
     * @constructor
     * @extends JSUTILS.Event
     * @param {String} type The event type   
     */
    GyroEvent = function (type) {

        Event.call(this, type);

        this.name = "GyroEvent";

    };

    /**
     * @property GyroEvent.GYRO_READY
     * @static
     */
    GyroEvent.GYRO_READY = "gyroReady";
    /**
     * @property GyroEvent.UPDATE
     * @static
     */
    GyroEvent.UPDATE = "update";
    

    GyroEvent.prototype = JSUTILS.inherit(Event.prototype);
    GyroEvent.prototype.constructor = GyroEvent;

    return GyroEvent;

}());

JSUTILS.namespace('BO.io.GyroITG3200');

BO.io.GyroITG3200 = (function () {
    "use strict";

    var GyroITG3200;

    // private static constants
    var STARTUP_DELAY = 70,
        SMPLRT_DIV = 0x15,
        DLPF_FS = 0x16,
        INT_CFG = 0x17,
        GYRO_XOUT = 0x1D,
        GYRO_YOUT = 0x1F,
        GYRO_ZOUT = 0x21,
        PWR_MGM = 0x3E,
        NUM_BYTES = 6;  

    // dependencies
    var I2CBase = BO.I2CBase,
        Event = JSUTILS.Event,
        GyroEvent = BO.io.GyroEvent;

    /**
     * Creates an interface to an ITG3200 3-axis gyroscope. This gyro measures
     * angular acceleration around the x, y, and z axis. This object provides
     * the angular velocity of each axis. Proper calibration is required for an
     * accurate reading. See [Breakout/examples/sensors/itg3200.html](https://github.com/soundanalogous/Breakout/blob/master/examples/sensors/itg3200.html) and 
     * [Breakout/examples/processing\_js/gyro.html](https://github.com/soundanalogous/Breakout/blob/master/examples/processing_js/gyro.html) for example applications.
     *
     * @class GyroITG3200
     * @constructor
     * @extends BO.I2CBase
     * @param {IOBoard} board The IOBoard instance
     * @param {Boolean} autoStart True if read continuous mode should start automatically upon instantiation (default is true)
     * @param {Number} address The i2c address of the accelerometer. If pin 9 (AD0) of the module is tied to VDD, then use
     * `GyroITG3200.ID_AD0_DVV` (0x69), if pin 9 (AD0) is tied to GND, then use `GyroITG3200.ID_AD0_GND`. 
     * Default = `GyroITG3200.ID_AD0_VDD`
     */
    GyroITG3200 = function (board, autoStart, address) {

        if (autoStart === undefined) {
            autoStart = true;
        }
        address = address || GyroITG3200.ID_AD0_VDD;
        
        I2CBase.call(this, board, address);

        this.name = "GyroITG3200";

        // private properties
        this._autoStart = autoStart;        
        this._isReading = false;
        this._tempOffsets = {};
        this._startupTimer = null;      
        this._debugMode = BO.enableDebugging;
        
        this._x = 0;
        this._y = 0;
        this._z = 0;

        this._gains = {x: 1.0, y: 1.0, z: 1.0};
        this._offsets = {x: 0.0, y: 0.0, z: 0.0};
        this._polarities = {x: 0, y: 0, z: 0};

        this.setRevPolarity(false, false, false);

        this.init();

    };

    GyroITG3200.prototype = JSUTILS.inherit(I2CBase.prototype);
    GyroITG3200.prototype.constructor = GyroITG3200;

    /**
     * [read-only] The state of continuous read mode. True if continuous read mode
     * is enabled, false if it is disabled.
     * @property isRunning
     * @type Boolean
     */      
    GyroITG3200.prototype.__defineGetter__("isRunning", function () { return this._isReading; });

    /**
     * [read-only] The x axis output value in degrees.
     * @property x
     * @type Number
     */      
    GyroITG3200.prototype.__defineGetter__("x", function () { 
        return this._x / 14.375 * this._polarities.x * this._gains.x + this._offsets.x; 
    });

    /**
     * [read-only] The y axis output value in degrees.
     * @property y
     * @type Number
     */      
    GyroITG3200.prototype.__defineGetter__("y", function () { 
        return this._y / 14.375 * this._polarities.y * this._gains.y + this._offsets.y;
    });
    
    /**
     * [read-only] The z axis output value in degrees.
     * @property z
     * @type Number
     */      
    GyroITG3200.prototype.__defineGetter__("z", function () { 
        return this._z / 14.375 * this._polarities.z * this._gains.z + this._offsets.z;
    }); 

    /**
     * The raw x axis output value from the sensor.
     * @property rawX
     * @type Number
     */      
    GyroITG3200.prototype.__defineGetter__("rawX", function () { return this._rawX; });

    /**
     * The raw y axis output value from the sensor.
     * @property rawY
     * @type Number
     */      
    GyroITG3200.prototype.__defineGetter__("rawY", function () { return this._rawY; });
    
    /**
     * The raw z axis output value from the sensor.
     * @property rawZ
     * @type Number
     */      
    GyroITG3200.prototype.__defineGetter__("rawZ", function () { return this._rawZ; });      
    
    /**
     * Set the polarity of the x, y, and z output values.
     *
     * @method setRevPolarity
     * @param {Boolean} xPol Polarity of the x axis
     * @param {Boolean} yPol Polarity of the y axis
     * @param {Boolean} zPol Polarity of the z axis
     */
    GyroITG3200.prototype.setRevPolarity = function (xPol, yPol, zPol) {
        this._polarities.x = xPol ? -1 : 1;
        this._polarities.y = yPol ? -1 : 1;
        this._polarities.z = zPol ? -1 : 1;
    };
    
    /**
     * Offset the x, y, or z output by the respective input value.
     *
     * @method setOffsets
     * @param {Number} xOffset
     * @param {Number} yOffset
     * @param {Number} zOffset
     */
    GyroITG3200.prototype.setOffsets = function (xOffset, yOffset, zOffset) {
        this._offsets.x = xOffset;
        this._offsets.y = yOffset;
        this._offsets.z = zOffset;
    };
    
    /**
     * Set the gain value for the x, y, or z output.
     *
     * @method setGains
     * @param {Number} xGain
     * @param {Number} yGain
     * @param {Number} zGain
     */
    GyroITG3200.prototype.setGains = function (xGain, yGain, zGain) {
        this._gains.x = xGain;
        this._gains.y = yGain;
        this._gains.z = zGain;
    };      

    /**
     * Start continuous reading of the sensor.
     * @method startReading
     */
    GyroITG3200.prototype.startReading = function () {
        if (!this._isReading) {
            this._isReading = true;
            this.sendI2CRequest([I2CBase.READ_CONTINUOUS, this.address, GYRO_XOUT, NUM_BYTES]);
        }
    };
    
    /**
     * Stop continuous reading of the sensor.
     * @method stopReading
     */
    GyroITG3200.prototype.stopReading = function () {
        this._isReading = false;
        this.sendI2CRequest([I2CBase.STOP_READING, this.address]);
    };


    /** 
     * Sends read request to accelerometer and updates accelerometer values.
     * @method update
     */
    GyroITG3200.prototype.update = function () {

        if (this._isReading) {
            this.stopReading(); 
        }
        // read data: contents of X, Y, and Z registers
        this.sendI2CRequest([I2CBase.READ, this.address, GYRO_XOUT, NUM_BYTES]);
    };  

    /**
     * @private
     * @method init
     */ 
    GyroITG3200.prototype.init = function () {           
        // set fast sample rate divisor = 0
        this.sendI2CRequest([I2CBase.WRITE, this.address, SMPLRT_DIV, 0x00]);
        
        // set range to +-2000 degrees/sec and low pass filter bandwidth to 256Hz and internal sample rate to 8kHz
        this.sendI2CRequest([I2CBase.WRITE, this.address, DLPF_FS, 0x18]);
        
        // use internal oscillator
        this.sendI2CRequest([I2CBase.WRITE, this.address, PWR_MGM, 0x00]);
        
        // enable ITG ready bit and raw data ready bit
        // note: this is probably not necessary if interrupts aren't used
        this.sendI2CRequest([I2CBase.WRITE, this.address, INT_CFG, 0x05]);
        

        this._startupTimer = setTimeout(this.onGyroReady.bind(this), STARTUP_DELAY);
    };

    /**
     * @private
     * @method onGyroReady
     */
    GyroITG3200.prototype.onGyroReady = function () {
        this._startupTimer = null;

        this.dispatchEvent(new GyroEvent(GyroEvent.GYRO_READY));
        if (this._autoStart) {
            this.startReading();
        }
    };

    /**
     * @private
     * @method setRegisterBit
     */
    GyroITG3200.prototype.setRegisterBit = function (regAddress, bitPos, state) {
        var value;
        
        if (state) {
            value |= (1 << bitPos);
        } else {
            value &= ~(1 << bitPos);
        }
        this.sendI2CRequest([I2CBase.WRITE, this.address, regAddress, value]);
    };  


    /**
     * @private
     * @method handleI2C
     */
    GyroITG3200.prototype.handleI2C = function (data) {

        switch (data[0]) {
        case GYRO_XOUT:
            this.readGyro(data);
            break;
        default:
            this.debug("Got unexpected register data");
            break;
        }
    };

    /**
     * @private
     * @method readGyro
     */
    GyroITG3200.prototype.readGyro = function (data) {
        
        var x_val, 
            y_val, 
            z_val;
        
        if (data.length != NUM_BYTES + 1) {
            throw new Error("Incorrecte number of bytes returned");
        }
        
        x_val = (data[1] << 8) | (data[2]);
        y_val = (data[3] << 8) | (data[4]);
        z_val = (data[5] << 8) | (data[6]);
        
        if (x_val >> 15) {
            this._x = ((x_val ^ 0xFFFF) + 1) * -1;
        } else {
            this._x = x_val;
        }
        if (y_val >> 15) {
            this._y = ((y_val ^ 0xFFFF) + 1) * -1;
        } else {
            this._y = y_val;
        }
        if (z_val >> 15) {
            this._z = ((z_val ^ 0xFFFF) + 1) * -1;
        } else {
            this._z = z_val;
        }
        
        this.dispatchEvent(new GyroEvent(GyroEvent.UPDATE));    
    };
    
    /**
     * for debugging
     * @private
     */
    GyroITG3200.prototype.debug = function (str) {
        if (this._debugMode) {
            console.log(str); 
        }
    };
        
    // public static constants

    /** 
     * ID = 0x69 if sensor pin 9 (AD0) is tied to Power.
     * @property GyroITG3200.ID_AD0_VDD
     * @static
     */
    GyroITG3200.ID_AD0_VDD = 0x69;

    /** 
     * ID = 0x68 if sensor pin 9 (AD0) is tied to Ground.
     * @property GyroITG3200.ID_AD0_VDD
     * @static
     */    
    GyroITG3200.ID_AD0_GND = 0x68;


    // document events

    /**
     * The update event is dispatched when the accelerometer values are updated.
     * @type BO.io.GyroEvent.UPDATE
     * @event update
     * @param {BO.io.GyroITG3200} target A reference to the GyroITG3200 object.
     */     
            
    return GyroITG3200;

}());
JSUTILS.namespace('BO.io.MagnetometerEvent');

BO.io.MagnetometerEvent = (function () {

    var MagnetometerEvent;

    // dependencies
    var Event = JSUTILS.Event;

    /**
     * An Event object to be dispatched (fired) by a Magnetometer
     * object.
     * @class MagnetometerEvent
     * @constructor
     * @extends JSUTILS.Event
     * @param {String} type The event type   
     */
    MagnetometerEvent = function (type) {

        Event.call(this, type);

        this.name = "MagnetometerEvent";

    };

    /**
     * @property MagnetometerEvent.UPDATE
     * @static
     */
    MagnetometerEvent.UPDATE = "update";
    

    MagnetometerEvent.prototype = JSUTILS.inherit(Event.prototype);
    MagnetometerEvent.prototype.constructor = MagnetometerEvent;

    return MagnetometerEvent;

}());

JSUTILS.namespace('BO.io.MagnetometerHMC5883');

BO.io.MagnetometerHMC5883 = (function () {

    var MagnetometerHMC5883;

        // private static constants
    var RAD_TO_DEG = 180 / Math.PI,
        DEG_TO_RAD = Math.PI / 180,
        ADDRESS = 0x1E,
        CRA = 0x00,
        CRB = 0x01,
        MODE = 0x02,
        DATAX0 = 0x03,
        NUM_BYTES = 6;

    // dependencies
    var I2CBase = BO.I2CBase,
        MagnetometerEvent = BO.io.MagnetometerEvent;

    /**
     * Creates an interface to an HMC5883 3-axis magnetometer. Use the
     * magnetometer to obtain a compass heading or rotation in relation to
     * a fixed point. See [Breakout/examples/sensors/hmc5883.html](https://github.com/soundanalogous/Breakout/blob/master/examples/sensors/hmc5883.html) for an example
     * application.
     *
     * @class MagnetometerHMC5883
     * @constructor
     * @extends BO.I2CBase
     * @param {IOBoard} board The IOBoard instance
     * @param {Number} address The i2c address of the compass module
     * @param {Number} numSamples The number of samples averaged per 
     * measurement output. Options are: `MagnetometerHMC5883.SAMPLES_1`,
     * `MagnetometerHMC5883.SAMPLES_2`, `MagnetometerHMC5883.SAMPLES_4`
     * `MagnetometerHMC5883.SAMPLES_8` (default = `MagnetometerHMC5883.SAMPLES_1`)
     * @param {Number} outputRate The data output rate in Hz 
     * (default = `MagnetometerHMC5883.HZ_30`)
     */
    MagnetometerHMC5883 = function (board, address, numSamples, outputRate) {
        address = address || MagnetometerHMC5883.DEVICE_ID;
        numSamples = numSamples || MagnetometerHMC5883.SAMPLES_1;
        outputRate = outputRate || MagnetometerHMC5883.HZ_30;

        I2CBase.call(this, board, address);

        this._x = 0;
        this._y = 0;
        this._z = 0;

        // To do: scale is currently fixed. allow user to change this value?
        this._scale = 0.92; // mG/LSb

        this._isReading = false;
        this._debugMode = BO.enableDebugging;

        this.name = "MagnetometerHMC5883";
        
        var measurement = 0x00;
        var CRAVal = (numSamples << 5) | (outputRate << 2)  | measurement;
            
        // 1 sample, continuous measurement rate 30 Hz, normal measurement config
        this.sendI2CRequest([I2CBase.WRITE, this.address, CRA, CRAVal]);
        // startup in continuous measurement mode
        this.sendI2CRequest([I2CBase.WRITE, this.address, MODE, 0x00]);
        
        this.startReading();

    };

    MagnetometerHMC5883.prototype = JSUTILS.inherit(I2CBase.prototype);
    MagnetometerHMC5883.prototype.constructor = MagnetometerHMC5883;

    /**
     * [read-only] The heading in degrees.
     * @property heading
     * @type Number
     */      
    MagnetometerHMC5883.prototype.__defineGetter__("heading", function () {
        return this.getHeading(this._x, this._y);
    });

    /**
     * [read-only] The x-axis measurement
     * @property x
     * @type Number
     */      
    MagnetometerHMC5883.prototype.__defineGetter__("x", function () { return this._x; });

    /**
     * [read-only] The y-axis measurement
     * @property y
     * @type Number
     */      
    MagnetometerHMC5883.prototype.__defineGetter__("y", function () { return this._y; });
    
    /**
     * [read-only] The z-axis measurement
     * @property z
     * @type Number
     */      
    MagnetometerHMC5883.prototype.__defineGetter__("z", function () { return this._z; });    
    
    /**
     * @private
     * @method handleI2C
     */
    MagnetometerHMC5883.prototype.handleI2C = function (data) {
        var xVal,
            yVal,
            zVal;

        // data[0] = register
        if (data[0] === DATAX0) {
            xVal = (data[1] << 8) | data[2];
            zVal = (data[3] << 8) | data[4];
            yVal = (data[5] << 8) | data[6];

            // correct for negative number
            if (xVal >> 15) {
                this._x = ((xVal ^ 0xFFFF) + 1) * -1;
            } else {
                this._x = xVal;
            }
            if (yVal >> 15) {
                this._y = ((yVal ^ 0xFFFF) + 1) * -1;
            } else {
                this._y = yVal;
            }
            if (zVal >> 15) {
                this._z = ((zVal ^ 0xFFFF) + 1) * -1;
            } else {
                this._z = zVal;
            }

            // a value of -4096 indicates an ADC overflow or underflow
        
            this.dispatchEvent(new MagnetometerEvent(MagnetometerEvent.UPDATE));
        } else {
            console.log("Warning: MagnetometerHMC5883 received data from unknown register");
        }
    };

    /**
     * @private
     * @method getHeading
     */
    MagnetometerHMC5883.prototype.getHeading = function (x, y) {
        var heading = 0.0;

        // algorithm from Applications of Magnetoresistive Sensors in Navigation Systems
        // by Michael J. Caruso of Honeywell Inc.
        if (y > 0) {
            heading = 90.0 - Math.atan(x / y) * 180 / Math.PI;
        } else if (y < 0) {
            heading = 270.0 - Math.atan(x / y) * 180 / Math.PI;
        } else if (y === 0 && x < 0) {
            heading = 180.0;
        } else if (y === 0 && x > 0) {
            heading = 0.0;
        }

        // alternate algorithm
        // heading = Math.atan2(y, x);
        // if (heading < 0) heading += 2*Math.PI;
        // if (heading > 2*Math.PI) heading -= 2*Math.PI;
        // return heading * RAD_TO_DEG; 

        return heading;
    };

    /**
     * Get a tilt-compensated heading. Pitch and roll values from an accelerometer
     * must be passed to this method.
     *
     * Note: this method is not working properly. Marking it private until resolved
     * @private
     * @method getTiltCompensatedHeading
     * @param {Number} pitch The pitch value (supplied by an accelerometer)
     * @param {Number} roll The roll value (supplied by an accelerometer)
     * @return {Number} tilt-compensated heading direction
     */
    MagnetometerHMC5883.prototype.getTiltCompensatedHeading = function (pitch, roll) {

        pitch = pitch * DEG_TO_RAD;
        roll = roll * DEG_TO_RAD;

        //var xH = this._x * Math.cos(pitch) + this._z * Math.sin(pitch);
        //var yH = this._x * Math.sin(roll) * Math.sin(pitch) + this._y * Math.cos(roll) - this._z * Math.sin(roll) * Math.cos(pitch);
        //var zH = -this._x * Math.cos(roll) * Math.sin(pitch) + this._y * Math.sin(roll) + this._z * Math.cos(roll) * Math.cos(pitch);

        // algorithm from: Applications of Magnetoresistive Sensors in Navigation Systems
        // by Michael J. Caruso, Honeywell Inc.
        var xH = this._x * Math.cos(pitch) + this._y * Math.sin(roll) * Math.sin(pitch) - this._z * Math.cos(roll) * Math.sin(pitch);
        var yH = this._y * Math.cos(roll) + this._z * Math.sin(roll);

        return this.getHeading(xH, yH);

    };
    
    /**
     * Start continuous reading of the sensor.
     * @method startReading
     */
    MagnetometerHMC5883.prototype.startReading = function () {
        if (!this._isReading) {
            this._isReading = true;
            this.sendI2CRequest([I2CBase.READ_CONTINUOUS, this.address, DATAX0, 6]);
        }
    };
    
    /**
     * Stop continuous reading of the sensor.
     * @method stopReading
     */
    MagnetometerHMC5883.prototype.stopReading = function () {
        this._isReading = false;
        this.sendI2CRequest([I2CBase.STOP_READING, this.address]);
        // set idle mode?
        //this.sendI2CRequest([I2CBase.WRITE, this.address, MODE, 0x03]);
    };

    /** 
     * Sends read request to magnetometer and updates magnetometer values.
     * @method update
     */
    MagnetometerHMC5883.prototype.update = function () {
        if (this._isReading) {
            this.stopReading(); 
        }
        // read data: contents of X, Y, and Z registers
        this.sendI2CRequest([I2CBase.READ, this.address, DATAX0, NUM_BYTES]);
    };

    /**
     * for debugging
     * @private
     */
    MagnetometerHMC5883.prototype.debug = function (str) {
        if (this._debugMode) {
            console.log(str); 
        }
    };  

    // public static constants

    /**
     * @property MagnetometerHMC5883.DEVICE_ID
     * @static
     */
    MagnetometerHMC5883.DEVICE_ID = 0x1E;   
    
    /**
     * @property MagnetometerHMC5883.SAMPLES_1
     * @static
     */
    MagnetometerHMC5883.SAMPLES_1 = 0;
    /**
     * @property MagnetometerHMC5883.SAMPLES_2
     * @static
     */
    MagnetometerHMC5883.SAMPLES_2 = 1;
    /**
     * @property MagnetometerHMC5883.SAMPLES_4
     * @static
     */
    MagnetometerHMC5883.SAMPLES_4 = 2;
    /**
     * @property MagnetometerHMC5883.SAMPLES_8
     * @static
     */
    MagnetometerHMC5883.SAMPLES_8 = 3;  
    
    /** 0.75 Hz
     * @property MagnetometerHMC5883.HZ_0_75
     * @static 
     */
    MagnetometerHMC5883.HZ_0_75 = 0x00;
    /** 1.5 Hz 
     * @property MagnetometerHMC5883.HZ_1_5
     * @static 
     */
    MagnetometerHMC5883.HZ_1_5 = 0x01;
    /** 3 Hz 
     * @property MagnetometerHMC5883.HZ_3
     * @static 
     */
    MagnetometerHMC5883.HZ_3 = 0x02;
    /** 7.5 Hz 
    * @property MagnetometerHMC5883.HZ_7_5
     * @static 
    */
    MagnetometerHMC5883.HZ_7_5 = 0x03;
    /** 15 Hz 
    * @property MagnetometerHMC5883.HZ_15
     * @static 
    */
    MagnetometerHMC5883.HZ_15 = 0x04;
    /** 30 Hz 
     * @property MagnetometerHMC5883.HZ_30
     * @static 
     */
    MagnetometerHMC5883.HZ_30 = 0x05;
    /** 75 Hz 
     * @property MagnetometerHMC5883.HZ_75
     * @static 
     */
    MagnetometerHMC5883.HZ_75 = 0x06;       


    // document events

    /**
     * The update event is dispatched when the compass heading is updated.
     * @type BO.io.MagnetometerEvent.UPDATE
     * @event update
     * @param {BO.io.MagnetometerHMC5883} target A reference to the MagnetometerHMC5883 object.
     */     

    return MagnetometerHMC5883;

}());
JSUTILS.namespace('BO.io.Servo');

BO.io.Servo = (function () {

    var Servo;

    // dependencies
    var Pin = BO.Pin;

    /**
     * Creates an interface to a Servo motor. Use this object to set
     * the angle of the servo head. You can simply specify and angle between
     * 0 and 180 degrees and the servo head will rotate to that angle. See
     * [Breakout/examples/actuators/servo.html](https://github.com/soundanalogous/Breakout/blob/master/examples/actuators/servo.html) for an example application.
     * You can also use this with a continuous rotation servo. See the
     * description for the angle property for use with a continuous rotation
     * servo.
     *
     * @class Servo
     * @constructor
     * @param {IOBoard} board A reference to the IOBoard instance that the 
     * servo is attached to.
     * @param {Pin} servoPin A reference to the Pin the servo is connected to.
     * @param {Number} minAngle The minimum angle the server can rotate to
     * (default = 0).
     * @param {Number} maxAngle The maximum angle the server can rotate to
     * (default = 180).
     */
    Servo = function (board, servoPin, minAngle, maxAngle) {
        "use strict";
        
        this.name = "Servo";

        this._pin = servoPin;
        this._angle = undefined;
        this._minAngle = minAngle || 0;
        this._maxAngle = maxAngle || 180;

        var pinNumber = servoPin.number;
        
        // sendServoAttach will set the pin mode to Pin.SERVO
        board.sendServoAttach(pinNumber);
    };

    Servo.prototype = {

        constructor: Servo,

        /**
         * Set the angle (in degrees) to rotate the server head to.
         *
         * <p>If you are using a continuous rotation servo, a value of 90
         * will stop the servo. A value of 0 (or < 90 depending on the servo) 
         * will cause continous clockwise rotation and a value of 180 (or > 90)
         * will cause continuous counter-clockwise rotation. If your motor
         * does not come to a full stop when setting 90 degrees, you will need
         * to adjust the servo (there is typically a screw on the motor) to
         * adjust</p>
         * 
         * @property angle
         * @type Number
         */ 
        set angle(value) {
            if (this._pin.getType() === Pin.SERVO) {
                this._angle = value;
                //this._pin.value = this._angle;
                this._pin.value = Math.max(0, Math.min(1, (this._angle - this._minAngle) / 
                                (this._maxAngle - this._minAngle) * Servo.COEF_TO_0_180));

            }
        },
        get angle() {
            if (this._pin.getType() === Pin.SERVO) {
                return this._angle;
            }
        }       
    };

    /**
     * The scale to convert 0-1 (0-255 in 8bit) to 0-0.706 (0-180 in 8bit).
     * @property Servo.COEF_TO_0_180
     * @static
     */
    Servo.COEF_TO_0_180 = 180 / 255;

    return Servo;

}());

JSUTILS.namespace('BO.io.DCMotor');

BO.io.DCMotor = (function () {

    var DCMotor;

    // Dependencies
    var Pin = BO.Pin;

    /**
     * Creates an interface to an H-bridge to control the direction of rotation
     * of a motor shaft. You can rotate forward (clockwise), reverse or apply a
     * brake. See [Breakout/examples/actuators/dcmotor.html](https://github.com/soundanalogous/Breakout/blob/master/examples/actuators/dcmotor.html) for an example
     * application.
     *
     * <p>Tested successfully with the following H-bridge: SN754410<br>
     * Should also be compatible with the following:<br>
     * SN754410<br>
     * L293NE<br>
     * TA7291P<br>
     * TB6612FNG<br>
     * BD621F</p>
     *
     * @class DCMotor
     * @constructor
     * @param {IOBoard} board A reference to the IOBoard instance that the
     * servo is attached to.
     * @param {Pin} forwardPin A reference to the Pin connected to the forward
     * control of the H-bridge.
     * @param {Pin} reversePin A reference to the Pin connected to the reverse
     * control of the H-bridge.
     * @param {Pin} pwmPin A reference to the Pin connected to the pwm control
     * of the H-bridge.
     * @param {Number} minVoltage The minimum voltage (default = 1).
     * @param {Number} maxVoltage The maximum voltage (default = 9).
     * @param {Number} supplyVoltage The supply voltage (default = 9).
     */
    DCMotor = function (board, forwardPin, reversePin, pwmPin, minVoltage, maxVoltage, supplyVoltage) {
        "use strict";
        
        this.name = "DCMotor";

        minVoltage = minVoltage || 1;
        maxVoltage = maxVoltage || 9;
        supplyVoltage = supplyVoltage || 9;
        if (pwmPin === undefined) {
            pwmPin = null;
        }    

        this._value = 0;
        this._offset = 0;
        this._range = 0;

        this._forwardPin = forwardPin;
        this._reversePin = reversePin;
        this._pwmPin = pwmPin;

        if (this._pwmPin !== null) {
            if (this._pwmPin.getCapabilities()[Pin.PWM]) {
                board.setDigitalPinMode(this._pwmPin.number, Pin.PWM);
            } else {
                console.log("warning: PWM is not available for the PWM pin");
                board.setDigitalPinMode(this._pwmPin.number, Pin.DOUT);
            }           
        }

        if (this._forwardPin.getCapabilities()[Pin.PWM]) {
            board.setDigitalPinMode(this._forwardPin.number, Pin.PWM);
        } else {
            console.log("warning: PWM is not available for the forward pin");
            board.setDigitalPinMode(this._forwardPin.number, Pin.DOUT);         
        }

        if (this._reversePin.getCapabilities()[Pin.PWM]) {
            board.setDigitalPinMode(this._reversePin.number, Pin.PWM);          
        } else {
            console.log("warning: PWM is not available for the reverse pin");
            board.setDigitalPinMode(this._reversePin.number, Pin.DOUT);
        }

        this._offset = (minVoltage / supplyVoltage);
        this._range = (maxVoltage - minVoltage) / supplyVoltage;

        this.despin(false);

    };

    DCMotor.prototype = {

        constructor: DCMotor,

        /**
         * The value of the motor speed (-1.0 to 1.0). A speed of zero stops
         * the motor.
         * @property value
         * @type Number
         */ 
        set value(val) {
            this._value = Math.max(-1, Math.min(1, val));

            if (val > 0) {
                this.forward(this._value);
            } else if (val < 0) {
                this.reverse(-this._value);
            } else {
                this.despin();
            }
        },
        get value() {
            return this._value;
        },
        
        /**
         * @method despin
         * @param {Boolean} useBrake Default = true
         */
        despin: function (useBrake) {
            if (useBrake === undefined) {
                useBrake = true;
            }

            if (useBrake) {
                if (this._pwmPin === null) {
                    this._forwardPin.value = 1;
                    this._reversePin.value = 1;
                } else {
                    this._forwardPin.value = 1;
                    this._reversePin.value = 1;
                    this._pwmPin.value = 1;
                }
            } else {
                if (this._pwmPin === null) {
                    this._forwardPin.value = 0;
                    this._reversePin.value = 0;
                } else {
                    this._forwardPin.value = 0;
                    this._reversePin.value = 0;
                    this._pwmPin.value = 0;
                }
            }
            this._value = 0;
        },
        
        /**
         * @method forward
         * @param {Number} val The new voltage to set (0.0 to 1.0)
         */     
        forward: function (val) {
            val = val || 1;
            this._value = Math.max(0, Math.min(1, val));

            if (this._pwmPin === null) {
                this._forwardPin.value = Math.max(0, Math.min(1, this._value * this._range + this._offset));
                this._reversePin.value = 0;
            } else {
                this._forwardPin.value = 1;
                this._reversePin.value = 0;
                this._pwmPin.value = Math.max(0, Math.min(1, this._value * this._range + this._offset));
            }
        },

        /**
         * @method reverse
         * @param {Number} val The new voltage to set (-1.0 to 0.0)
         */
        reverse: function (val) {
            val = val || 1;
            this._value = Math.max(0, Math.min(1, val)) * -1;

            if (this._pwmPin === null) {
                this._forwardPin.value = 0;
                this._reversePin.value =  Math.max(0, Math.min(1, (this._value * this._range) * -1 + this._offset));
            } else {
                this._forwardPin.value = 0;
                this._reversePin.value = 1;
                this._pwmPin.value = Math.max(0, Math.min(1, (this._value * this._range) * -1 + this._offset));
            }
        }       
            
    };

    return DCMotor;

}());

JSUTILS.namespace('BO.io.LED');

BO.io.LED = (function () {

    var LED;

    // Dependencies
    var Pin = BO.Pin;
    var Oscillator = BO.generators.Oscillator;

    /**
     * Creates an interface to an LED. This object provides helpful
     * methods for blinking and fading LEDs. To use the fading methods, the
     * LED must be connected to a PWM pin on the I/O board.
     *
     * <p>PLEASE NOTE: To use the fade methods, or to use an waveform other 
     * than `Oscillator.SQUARE` the LED must be connected to a PWM pin.</p>
     *
     * <p>`SOURCE_DRIVE` vs `SYNC_DRIVE`. If the Anode (longer LED pin) is
     * connected to the microcontroller pin, then it is `SOURCE_DRIVE`. If the
     * Cathode is connected to the microcontroller pin, then it is 
     * `SYNC_DRIVE`.</p>
     *
     * @class LED
     * @constructor
     * @param {IOBoard} board A reference to the IOBoard the LED is attached to.
     * @param {Pin} ledPin A reference to the Pin the LED is connected to.
     * @param {Number} driveMode The drive mode of the LED. Must be set to
     * `LED.SOURCE_MODE` or `LED.SYNC_MODE`. `SOURCE_MODE` is default.
     */
    LED = function (board, ledPin, driveMode) {
        "use strict";
        
        this.name = "LED";

        this._driveMode = driveMode || LED.SOURCE_DRIVE;
        this._pin = ledPin;
        this._onValue = 1;
        this._offValue = 0;
        this._supportsPWM = undefined;

        if (this._driveMode === LED.SOURCE_DRIVE) {
            this._onValue = 1;
            this._offValue = 0;
        } else if (this._driveMode === LED.SYNC_DRIVE) {
            this._onValue = 0;
            this._offValue = 1;
        } else {
            throw "driveMode should be LED.SOURCE_DRIVE or LED.SYNC_DRIVE";
        }

        // If the pin supports PWM, set PWM mode else set DOUT mode
        if (this._pin.getCapabilities()[Pin.PWM]) {
            board.setDigitalPinMode(this._pin.number, Pin.PWM);
            this._supportsPWM = true;
        } else {
            board.setDigitalPinMode(this._pin.number, Pin.DOUT);
            this._supportsPWM = false;
        }

        // Start in the off state
        this.off();
    };

    LED.prototype = {

        constructor: LED,

        /**
         * Get or set the current value (intensity) of the LED.
         * @property intensity
         * @type Number
         */ 
        get intensity() {
            return this._pin.value;
        },
        set intensity(val) {
            // If the pin does not support PWM, force the value to 1 or 0
            if (!this._supportsPWM) {
                if (val < 0.5) {
                    val = 0;
                } else {
                    val = 1;
                }
            }

            if (this._driveMode === LED.SOURCE_DRIVE) {
                this._pin.value = val;
            } else if (this._driveMode === LED.SYNC_DRIVE) {
                this._pin.value = 1 - val;
            }
        },
        
        /**
         * Turn the LED on.
         * @method on
         */
        on: function () {
            this._pin.value = this._onValue;
        },

        /**
         * Turn the LED off.
         * @method off
         */
        off: function () {
            this._pin.value = this._offValue;
        },

        /**
         * Check if the LED is on.
         * @method isOn
         * @return {Boolean} True if the LED is on, false if it is off.
         */
        isOn: function () {
            return this._pin.value === this._onValue;
        },

        /**
         * Toggle the LED on or off.
         * @method toggle
         */
        toggle: function () {
            this._pin.value = 1 - this._pin.value;
        },

        /**
         * @method blink
         * @param {Number} interval The time interval to blink the LED.
         * @param {Number} times The number of times the LED should blink.
         * A value of 0 will blink forever.
         * @param {Function} wave The waveform to apply (default is Oscillator.SQUARE)
         * @see BO.generator.Oscillator
         */
        blink: function (interval, times, wave) {
            var freq = 1000 / interval;
            times = times || 0;
            wave = wave || Oscillator.SQUARE;

            if (!this._supportsPWM && wave !== Oscillator.SQUARE) {
                console.log("warning: Only Oscillator.SQUARE may be used on a non-PWM pin.");
                console.log("debug: Setting wave to Oscillator.SQUARE.");
                wave = Oscillator.SQUARE;
            }

            //var osc = new Oscillator(wave, freq, 1, 0, 0, times);
            this._pin.addGenerator(new Oscillator(wave, freq, 1, 0, 0, times));
            //osc.start();
            this._pin.generator.start();
        },

        /**
         * Stop the LED blink cycle.
         * @method stopBlinking
         */
        stopBlinking: function () {
            if (this._pin.generator !== null) {
                this._pin.generator.stop();
            }
            this.off();
        },

        /**
         * The LED must be connected to a PWM pin to use this method.
         *
         * @method fadeIn
         * @param {Number} time The fade-in time (in milliseconds).
         */
        fadeIn: function (time) {
            this.fadeTo(this._onValue, time);
        },

        /**
         * The LED must be connected to a PWM pin to use this method.
         *
         * @method fadeOut
         * @param {Number} time The fade-out time (in milliseconds).
         */
        fadeOut: function (time) {
            this.fadeTo(this._offValue, time);
        },

        /**
         * The LED must be connected to a PWM pin to use this method.
         *
         * @method fadeTo
         * @param {Number} to The new intensity value to fade to.
         * @param {Number} time The fade time (in milliseconds).
         */
        fadeTo: function (to, time) {

            if (!this._supportsPWM) {
                console.log("warning: Fade methods can only be used for LEDs connected to PWM pins.");
                return;
            }

            if (this._driveMode === LED.SYNC_DRIVE) {
                to = 1 - to;
            }

            time = time || 1000;
            var freq = 1000 / time;
            if (this._pin.value !== to) {
                this._pin.addGenerator(new Oscillator(Oscillator.LINEAR, freq, to - this._pin.value, this._pin.value, 0, 1));
                this._pin.generator.start();
            } else {
                this._pin.removeGenerator();
            }       
        }   
    };

    /**
     * @property LED.SOURCE_DRIVE
     * @static
     */
    LED.SOURCE_DRIVE = 0;
    /**
     * @property LED.SYNC_DRIVE
     * @static
     */
    LED.SYNC_DRIVE = 1;

    return LED;
}());

JSUTILS.namespace('BO.io.RGBLED');

BO.io.RGBLED = (function () {

    var RGBLED;

    // Dependencies
    var Pin = BO.Pin,
        LED = BO.io.LED;

    /**
     * Creates an interface to an RGB LED. This interface is for the
     * type of RGB LED with 4 legs. One leg is connected to power or ground 
     * (depending on the type of LED - common anode or common cathode) and the
     * other 3 legs are connected to PWM pins on the I/O board. See 
     * [Breakout/examples/schematics.pdf](http://breakoutjs.com/examples/schematics.pdf) for wiring diagrams. See 
     * [Breakout/examples/actuators/rgb\_led.html](https://github.com/soundanalogous/Breakout/blob/master/examples/actuators/rgb_led.html) for an example application.
     *
     * <p>The RGB pins of the RGB LED must be connected to PWM pins on the
     * IOBoard.</p>
     *
     * <p>`COMMON_ANODE` vs `COMMON_CATHODE`. You can determine if your RGB LED is 
     * common anode or common cathode by reading the datasheet. To wire a 
     * common cathode RGB LED, connect the cathode to ground and the 3 anode
     * pins to the IOBoard PWM pins via 330 ohm resistors. For a common anode
     * LED, the anode is connected to power and the 3 cathode pins are connected
     * to the IOBoard PWM pins via 330 ohm resistors.</p>
     *
     * @class RGBLED
     * @constructor
     * @param {IOBoard} board A reference to the IOBoard instance that the
     * servo is attached to.
     * @param {Pin} redLEDPin A reference to the IOBoard Pin the red LED pin
     * is connected to.
     * @param {Pin} greenLEDPin A reference to the IOBoard Pin the green LED
     * pin is connected to.
     * @param {Pin} blueLEDPin A reference to the IOBoard Pin the blue LED pin
     * is connected to.  
     * @param {Number} driveMode The drive mode of the RGBLED. Must be set to
     * RGBLED.COMMON_ANODE or RGBLED.COMMON_CATHODE. RGBLED.COMMON_ANODE is
     * default.
     */
    RGBLED = function (board, redLEDPin, greenLEDPin, blueLEDPin, driveMode) {
        "use strict";
        
        this.name = "RGBLED";

        if (driveMode === undefined) {
            driveMode = RGBLED.COMMON_ANODE;
        }

        this._redLED = new LED(board, redLEDPin, driveMode);
        this._greenLED = new LED(board, greenLEDPin, driveMode);
        this._blueLED = new LED(board, blueLEDPin, driveMode);
    };

    RGBLED.prototype = {

        constructor: RGBLED,

        /**
         * Set the RGBLED color.
         *
         * @method setColor
         * @param {Number} red The red value (0 - 255)
         * @param {Number} green The green value (0 - 255)
         * @param {Number} blue The blue value (0 - 255)
         */
        setColor: function (red, green, blue) {
            red = red / 255;
            green = green / 255;
            blue = blue / 255;

            this._redLED.intensity = red;
            this._greenLED.intensity = green;
            this._blueLED.intensity = blue;
        },

        /**
         * Fade in the RGBLED from the off state.
         *
         * @method fadeIn
         * @param {Number} time The time of the fade (in milliseconds)
         */
        fadeIn: function (time) {
            time = time || 1000;
            this._redLED.fadeTo(1, time);
            this._greenLED.fadeTo(1, time);
            this._blueLED.fadeTo(1, time);
        },

        /**
         * Fade out the RGBLED from the on state.
         *
         * @method fadeOut
         * @param {Number} time The time of the fade (in milliseconds)
         */
        fadeOut: function (time) {
            time = time || 1000;
            this._redLED.fadeTo(0, time);
            this._greenLED.fadeTo(0, time);
            this._blueLED.fadeTo(0, time);          
        },

        /**
         * Fade from the current color to the new color.
         *
         * @method fadeTo
         * @param {Number} red The red value to fade to (0 - 255)
         * @param {Number} green The green value to fade to (0 - 255)
         * @param {Number} blue The blue value to fade to (0 - 255)
         * @param {Number} time The time of the fade (in milliseconds)       
         */     
        fadeTo: function (red, green, blue, time) {
            red = red / 255;
            green = green / 255;
            blue = blue / 255;
            time = time || 1000;

            this._redLED.fadeTo(red, time);
            this._greenLED.fadeTo(green, time);
            this._blueLED.fadeTo(blue, time);
        }
    };

    /**
     * @property RGBLED.COMMON_ANODE
     * @static
     */
    RGBLED.COMMON_ANODE = LED.SYNC_DRIVE;
    /**
     * @property RGBLED.COMMON_CATHODE
     * @static
     */
    RGBLED.COMMON_CATHODE = LED.SOURCE_DRIVE;               

    return RGBLED;

}());

JSUTILS.namespace('BO.io.BiColorLED');

BO.io.BiColorLED = (function () {

    var BiColorLED;

    // Dependencies
    var Pin = BO.Pin,
        LED = BO.io.LED;

    /**
     * Creates an interface to an bi-color LED. This interface
     * is for the type of bi-color LED with 3 legs. One leg is connected
     * to power or ground (depending on the type of LED - common anode
     * or common cathode) and the other 2 legs are connected to PWM pins
     * on the I/O board.
     * See [Breakout/examples/schematics.pdf](http://breakoutjs.com/examples/schematics.pdf)
     * for wiring diagrams.
     * See [Breakout/examples/actuators/bi\_color\_led.html](https://github.com/soundanalogous/Breakout/blob/master/examples/actuators/bi_color_led.html)
     * for an example application.
     *
     * <p>`COMMON_ANODE` vs `COMMON_CATHODE`. You can determine if your
     * LED is common anode or common cathode by reading the datasheet. 
     * To wire a common cathode LED, connect the cathode to ground
     * and the 2 anode pins to the IOBoard PWM pins via resistors. For
     * a common anode LED, the anode is connected to power and the 2 
     * cathode pins are connected to the IOBoard PWM pins via two 
     * resistors.</p>
     *
     * @class BiColorLED
     * @constructor
     * @param {IOBoard} board A reference to the IOBoard instance that
     * the LED is attached to.
     * @param {Pin} color1LEDPin A reference to the IOBoard Pin the
     * first color LED pin is connected to.
     * @param {Pin} color2LEDPin A reference to the IOBoard Pin the
     * second color LED pin is connected to.
     * @param {Number} driveMode The drive mode of the LED. Must be
     * set to `BiColorLED.COMMON_ANODE` or `BiColorLED.COMMON_CATHODE`.
     * `BiColorLED.COMMON_ANODE` is default.
     */
    BiColorLED = function (board, color1LEDPin, color2LEDPin, driveMode) {
        "use strict";
        
        this.name = "BiColorLED";

        if (driveMode === undefined) {
            driveMode = BiColorLED.COMMON_ANODE;
        }

        this._color1LED = new LED(board, color1LEDPin, driveMode);
        this._color2LED = new LED(board, color2LEDPin, driveMode);
    };

    BiColorLED.prototype = {
    
        constructor: BiColorLED,

        /**
         * Set the bi-color LED color.
         * 
         * @method setColor
         * @param {Number} color1 The value (0 - 255) of the first color
         * @param {Number} color2 The value (0 - 255) of the second
         * color
         */
        setColor: function (color1, color2) {
            color1 = color1 / 255;
            color2 = color2 / 255;

            this._color1LED.intensity = color1;
            this._color2LED.intensity = color2;
        },

        /**
         * Fade in the bi-color LED from the off state.
         * 
         * @method fadeIn
         * @param {Number} time The time of the fade (in milliseconds)
         */
        fadeIn: function (time) {
            time = time || 1000;
            this._color1LED.fadeTo(1, time);
            this._color2LED.fadeTo(1, time);
        },

        /**
         * Fade out the bi-color LED from the on state.
         * 
         * @method fadeOut
         * @param {Number} time The time of the fade (in milliseconds)
         */
        fadeOut: function (time) {
            time = time || 1000;
            this._color1LED.fadeTo(0, time);
            this._color2LED.fadeTo(0, time);
        },

        /**
         * Fade from the current color to the new color.
         * 
         * @method fadeTo
         * @param {Number} color1 The value of the first color to fade
         * to (0 - 255)
         * @param {Number} color2 The value of the second color to fade
         * to (0 - 255)
         * @param {Number} time The time of the fade (in milliseconds)       
         */     
        fadeTo: function (color1, color2, time) {
            color1 = color1 / 255;
            color2 = color2 / 255;
            time = time || 1000;

            this._color1LED.fadeTo(color1, time);
            this._color2LED.fadeTo(color2, time);
        }
    };

    /**
     * @property BiColorLED.COMMON_ANODE
     * @static
     */
    BiColorLED.COMMON_ANODE = LED.SYNC_DRIVE;
    /**
     * @property BiColorLED.COMMON_CATHODE
     * @static
     */
    BiColorLED.COMMON_CATHODE = LED.SOURCE_DRIVE;               

    return BiColorLED;

}());

JSUTILS.namespace('BO.io.SoftPotEvent');

BO.io.SoftPotEvent = (function () {

    var SoftPotEvent;

    // Dependencies
    var Event = JSUTILS.Event;

    /**
     * An Event object to be dispatched (fired) by a SoftPot
     * @exports An Event object to be dispatched (fired) by a SoftPot
     * object.
     * @class SoftPotEvent
     * @constructor
     * @extends JSUTILS.Event
     * @param {String} type The event type
     * @param {Number} touchPoint The value where the softpot was touched    
     */
    SoftPotEvent = function (type, touchPoint) {

        this.name = "SoftPotEvent";

        Event.call(this, type);
        this._touchPoint = touchPoint;
    };

    /**
     * @property SoftPotEvent.PRESS
     * @static
     */
    SoftPotEvent.PRESS = "softPotPressed";
    /**
     * @property SoftPotEvent.RELEASE
     * @static
     */
    SoftPotEvent.RELEASE = "softPotRelease";
    /**
     * @property SoftPotEvent.DRAG
     * @static
     */
    SoftPotEvent.DRAG = "softPotDrag";
    /**
     * @property SoftPotEvent.FLICK_UP
     * @static
     */
    SoftPotEvent.FLICK_UP = "softPotFlickUp";
    /**
     * @property SoftPotEvent.FLICK_DOWN
     * @static
     */
    SoftPotEvent.FLICK_DOWN = "softPotFlickDown";
    /**
     * @property SoftPotEvent.TAP
     * @static
     */
    SoftPotEvent.TAP = "softPotTap";        

    SoftPotEvent.prototype = JSUTILS.inherit(Event.prototype);
    SoftPotEvent.prototype.constructor = SoftPotEvent;

    /**
     * The value of the softpot.
     * @property value
     * @type Number
     */ 
    SoftPotEvent.prototype.__defineGetter__("value", function () { return this._touchPoint; });  
    SoftPotEvent.prototype.__defineSetter__("value", function (val) { this._touchPoint = val; });

    return SoftPotEvent;

}());

JSUTILS.namespace('BO.io.SoftPot');

BO.io.SoftPot = (function () {

    var SoftPot;

    // private static constants:
    var TAP_TIMEOUT             = 200,
        FLICK_TIMEOUT           = 200,
        PRESS_TIMER_INTERVAL    = 10,
        MIN_VALUE               = 0.01,
        DEBOUNCE_TIMEOUT        = 20;   

    // dependencies
    var PhysicalInputBase = BO.PhysicalInputBase,
        Pin = BO.Pin,
        PinEvent = BO.PinEvent,
        Scaler = BO.filters.Scaler,
        Timer = JSUTILS.Timer,
        TimerEvent = JSUTILS.TimerEvent,
        SoftPotEvent = BO.io.SoftPotEvent;

    /**
     * Creates an interface to a SoftPot sensor. A softpot is a type of
     * analog resistive sensor that acts as a type of slider input. There are 
     * straight and curved variations. This object provides a number of useful 
     * events such as Press, Release, Drag, Tap and capturing Flick gestures.
     * See [Breakout/examples/sensors/softpot.html](https://github.com/soundanalogous/Breakout/blob/master/examples/sensors/softpot.html) for an example application.
     *
     * @class SoftPot
     * @constructor
     * @extends BO.PhysicalInputBase
     * @param {IOBoard} board A reference to the IOBoard instance
     * @param {Pin} pin A reference to the Pin the softpot is connected to.
     * @param {Number} softPotLength The length of the softpot in mm. 
     * Default = 100. 
     */
    SoftPot = function (board, pin, softPotLength) {
        "use strict";
        
        PhysicalInputBase.call(this);

        this.name = "SoftPot";
        this._pin = pin;

        softPotLength = softPotLength || 100;

        this._isDrag = false;
        this._flickDistance = 0;
        this._touchPoint = 0;
        this._lastMovePoint = 0;
        this._isTouched = false;
        this._distanceFromPressed = 0;
        this._minFlickMovement = 1.0 / softPotLength * 2.5;
        this._minDragMovement = 1.0 / softPotLength * 1.0;
        this._tapTimeout = TAP_TIMEOUT;
        this._minValue = MIN_VALUE;
        
        this._board = board;
        board.enableAnalogPin(this._pin.analogNumber);

        this._debugMode = BO.enableDebugging;
                        
        this._pin.addEventListener(PinEvent.CHANGE, this.onPinChange.bind(this));

        this._pressTimer = new Timer(PRESS_TIMER_INTERVAL, 0);
        this._flickTimer = new Timer(FLICK_TIMEOUT, 1);
    };


    SoftPot.prototype = JSUTILS.inherit(PhysicalInputBase.prototype);
    SoftPot.prototype.constructor = SoftPot;

    /**
     * @private
     * @method onPinChange
     * @param {Event} evt PinEvent.CHANGE
     */
    SoftPot.prototype.onPinChange = function (evt) {
        var val = evt.target.value;

        // _minValue is the minimum value required to set the release state
        // should be as close to zero as possible
        if (this._isTouched && val < this._minValue) {
            this.onRelease();
        } else if (val >= this._minValue) {
            if (!this._isTouched) {
                this.startTouch(val);
                this._lastMovePoint = val;
            } else {
                this.onMove(val);
            }
        }
    };

    /**
     * @private
     * @method setMinFlickMovement
     * @param {Number} touchPoint The value where the touch is occuring on the
     * strip
     */
    SoftPot.prototype.setMinFlickMovement = function (num) {
        this._minFlickMovement = num;   
    };
    
    /**
     * @private
     * @method startTouch
     */
    SoftPot.prototype.startTouch = function (touchPoint) {
        
        this._pressTimer.reset();
        this._pressTimer.start();
        
        // where we pressed
        this._touchPoint = touchPoint;
        this.dispatch(SoftPotEvent.PRESS);
        
        this._isTouched = true;
        this._isDrag = false;   
    };

    /**
     * @private
     * @method onRelease
     */
    SoftPot.prototype.onRelease = function () {      

        var dispatchedFlick = false; 
        
        // discard unintentional touch / noise
        if (this._pressTimer.currentCount > DEBOUNCE_TIMEOUT / PRESS_TIMER_INTERVAL) {
            // must meet minimum time requirement for flick  
            if (this._flickTimer.running) {
                if (this._flickDir > 0) {
                    this.dispatch(SoftPotEvent.FLICK_DOWN);
                } else {
                    this.dispatch(SoftPotEvent.FLICK_UP);
                }   
                dispatchedFlick = true; 
                
            } 
                        
            if (!dispatchedFlick) {
                // Check for presses  
                if (this._pressTimer.running) {
            
                    // If less than tap timeout, then it is a tap 
                    if (!this._isDrag && this._pressTimer.currentCount <= this._tapTimeout / PRESS_TIMER_INTERVAL) {
                        this.dispatch(SoftPotEvent.TAP);
                    }
                } 
            }
        }

        this.dispatch(SoftPotEvent.RELEASE);

        this.resetForNext(); 
    };
    
    /**
     * @private
     * @method onMove
     * @param {Number} touchPoint The value where the touch is occuring on the
     * strip
     */
    SoftPot.prototype.onMove = function (touchPoint) {       
    
        this._touchPoint = touchPoint;      
        // Save current point
        var curMovePoint = touchPoint;
        
        // Flick handeling 
        this._flickDistance = Math.abs(curMovePoint - this._lastMovePoint);
        
        if (!this._isDrag && this._flickDistance > this._minFlickMovement) {
            this._flickTimer.reset(); 
            this._flickTimer.start(); 
            
            if (curMovePoint - this._lastMovePoint > 0) {
                this._flickDir = 1;
            } else {
                this._flickDir = -1;
            }
            
            this._isDrag = false; 
        }           
        
        var dragDistance = Math.abs(curMovePoint - this._lastMovePoint);                

        // Dragging handler 
        // Don't check when flick timer is running
        //console.log("min drag = " + this._minDragMovement);
        if ((dragDistance > this._minDragMovement) && (this._flickTimer.running === false)) {
            this._isDrag = true; 
        }
        
        if (this._isDrag) {
            this.dispatch(SoftPotEvent.DRAG);
            this._distanceFromPressed = curMovePoint - this._lastMovePoint;
        }
                                
        this.debug("SoftPot: distance traveled flick is " + this._flickDistance); 
        this.debug("SoftPot: distance traveled drag is " + dragDistance); 

        // Reuse for next 
        this._lastMovePoint = curMovePoint; 
    };

    /**
     * Scale from the minimum and maximum input values to 0.0 -> 1.0.
     *
     * @method setRange
     * @param {Number} minimum The minimum value
     * @param {Number} maximum The maximum value
     */
    SoftPot.prototype.setRange = function (minimum, maximum) {
        this._pin.removeAllFilters();
        this._pin.addFilter(new Scaler(minimum, maximum, 0, 1, Scaler.LINEAR)); 
    };

    /**
     * @private
     * @method dispatch
     * @type {Event} type The event type
     */
    SoftPot.prototype.dispatch = function (type) {
        this.debug("SoftPot dispatch " + type);
        this.dispatchEvent(new SoftPotEvent(type, this._touchPoint));   
    };

    /**
     * Reset whenever you need the next Touch point.
     * @private
     * @method resetForNext
     */
    SoftPot.prototype.resetForNext = function () {
        this._flickTimer.stop();
        this._pressTimer.stop();
        this._isTouched = false;
        this._isDrag = false;
    };

    /**
     * For debugging.
     * 
     * @private
     */
    SoftPot.prototype.debug = function (str) {
        if (this._debugMode) {
            console.log(str); 
        }
    };  
    
    /**
     * The current value.
     * @property value
     * @type Number
     */ 
    SoftPot.prototype.__defineGetter__("value", function () { return this._touchPoint; });
    
    /**
     * The current distance from the press point.
     * @property distanceFromPressed
     * @type Number
     */ 
    SoftPot.prototype.__defineGetter__("distanceFromPressed", function () { return this._distanceFromPressed; });
    
    /**
     * The minimum distance required to trigger a flick event. Change this
     * value to fine tune the flick gesture.
     * @property minFlickMovement
     * @type Number
     */ 
    SoftPot.prototype.__defineGetter__("minFlickMovement", function () { return this._minFlickMovement; });  
    SoftPot.prototype.__defineSetter__("minFlickMovement", function (min) { this._minFlickMovement = min; });        
    
    /**
     * The minimum distance required to trigger a drag event. Change this
     * value to fine tune the drag response.
     * @property minDragMovement
     * @type Number
     */ 
    SoftPot.prototype.__defineGetter__("minDragMovement", function () { return this._minDragMovement; });    
    SoftPot.prototype.__defineSetter__("minDragMovement", function (min) { this._minDragMovement = min; });

    /**
     * The maximum time (in milliseconds) between a press and release in
     * order to trigger a TAP event.
     * @property tapTimeout
     * @type Number
     */ 
    SoftPot.prototype.__defineGetter__("tapTimeout", function () { return this._tapTimeout; });  
    SoftPot.prototype.__defineSetter__("tapTimeout", function (t) { this._tapTimeout = t; });

    /**
     * The minimum value required to set the Release state. This number should
     * be as close to zero as possible. Increase this value if you are noticing
     * fluttering between the Pressed and Released states. Default value = 0.01;
     * @property minValue
     * @type Number
     */ 
    SoftPot.prototype.__defineGetter__("minValue", function () { return this._minValue; });  
    SoftPot.prototype.__defineSetter__("minValue", function (val) { this._minValue = val; });    


    // Document events

    /**
     * The softPotPressed event is dispatched when pressure is applied to 
     * the softpot surface.
     * @type BO.io.SoftPotEvent.PRESS
     * @event softPotPressed
     * @param {BO.io.SoftPot} target A reference to the SoftPot object
     */

    /**
     * The softPotReleased event is dispatched when pressure is released from 
     * the softpot surface.
     * @type BO.io.SoftPotEvent.RELEASE
     * @event softPotReleased
     * @param {BO.io.SoftPot} target A reference to the SoftPot object
     */ 
     
    /**
     * The softPotDrag event is dispatched when a drag is detected along 
     * the length of the softpot sensor.
     * @type BO.io.SoftPotEvent.DRAG
     * @event softPotDrag
     * @param {BO.io.SoftPot} target A reference to the SoftPot object
     */ 
     
    /**
     * The softPotFlickUp event is dispatched when a flick gesture is detected
     * in the direction of the sensor pins.
     * @type BO.io.SoftPotEvent.FLICK_UP
     * @event softPotFlickUp
     * @param {BO.io.SoftPot} target A reference to the SoftPot object
     */ 
     
    /**
     * The softPotFlickDown event is dispatched when a flick gesture is 
     * detected in the direction away from the sensor pins.
     * @type BO.io.SoftPotEvent.FLICK_DOWN
     * @event softPotFlickDown
     * @param {BO.io.SoftPot} target A reference to the SoftPot object
     */
     
    /**
     * The softPotTap event is dispatched when a press and release occurs
     * in in less than the duration specified by the tapTimeout property.
     * @type BO.io.SoftPotEvent.TAP
     * @event softPotTap
     * @param {BO.io.SoftPot} target A reference to the SoftPot object
     */                  

    return SoftPot;

}());

JSUTILS.namespace('BO.IOBoard');

BO.IOBoard = (function () {

    var IOBoard;

    // Private static constants:

    // Message command bytes (128-255/0x80-0xFF)
    var DIGITAL_MESSAGE         = 0x90,
        ANALOG_MESSAGE          = 0xE0,
        REPORT_ANALOG           = 0xC0,
        REPORT_DIGITAL          = 0xD0,
        SET_PIN_MODE            = 0xF4,
        REPORT_VERSION          = 0xF9,
        SYSEX_RESET             = 0xFF,
        START_SYSEX             = 0xF0,
        END_SYSEX               = 0xF7;
    
    // Extended command set using sysex (0-127/0x00-0x7F)
    var SERVO_CONFIG            = 0x70,
        STRING_DATA             = 0x71,
        SHIFT_DATA              = 0x75,
        I2C_REQUEST             = 0x76,
        I2C_REPLY               = 0x77,
        I2C_CONFIG              = 0x78,
        EXTENDED_ANALOG         = 0x6F,
        PIN_STATE_QUERY         = 0x6D,
        PIN_STATE_RESPONSE      = 0x6E,
        CAPABILITY_QUERY        = 0x6B,
        CAPABILITY_RESPONSE     = 0x6C,
        ANALOG_MAPPING_QUERY    = 0x69,
        ANALOG_MAPPING_RESPONSE = 0x6A,
        REPORT_FIRMWARE         = 0x79,
        SAMPLING_INTERVAL       = 0x7A,
        SYSEX_NON_REALTIME      = 0x7E,
        SYSEX_REALTIME          = 0x7F;

    var MIN_SAMPLING_INTERVAL   = 10,
        MAX_SAMPLING_INTERVAL   = 100,
        MULTI_CLIENT = "multiClient";


    // Dependencies
    var Pin = BO.Pin,
        EventDispatcher = JSUTILS.EventDispatcher,
        PinEvent = BO.PinEvent,
        IOBoardEvent = BO.IOBoardEvent;

    /**
     * Creates an interface to the I/O board. The IOBoard object brokers
     * the communication between your application and the physical I/O board.
     * Currently you can only connect to a single I/O board per computer.
     * However you could connect to multiple I/O boards if they are attached to
     * multiple computers on your network. In that case you would create a
     * separate IOBoard instance for each board you are connecting to in your
     * network.
     *
     * @class IOBoard
     * @constructor
     * @uses JSUTILS.EventDispatcher
     * @param {String} host The host address of the web server.
     * @param {Number} port The port to connect to on the web server.
     * Default = false.
     * @param {String} protocol [optional] The websockt protocol definition 
     * (if necessary).
     */
    IOBoard = function (host, port, protocol) {
        "use strict";
        
        this.name = "IOBoard";
                        
        // Private properties
        this._socket = null;
        this._inputDataBuffer = [];
        this._digitalPort = [];
        this._numPorts = 0;
        this._analogPinMapping = [];
        this._digitalPinMapping = [];
        this._i2cPins = [];
        this._ioPins = [];
        this._totalPins = 0;
        this._totalAnalogPins = 0;
        this._samplingInterval = 19; // Default sampling interval
        this._isReady = false;
        this._firmwareName = "";
        this._firmwareVersion = 0;
        this._evtDispatcher = null;
        this._isMultiClientEnabled = false;
        this._isConfigured = false;
        this._capabilityQueryResponseReceived = false;
        this._debugMode = BO.enableDebugging;
        this._numPinStateRequests = 0;
        
        this._evtDispatcher = new EventDispatcher(this);

        // bind event handlers to this
        this.initialVersionResultHandler = this.onInitialVersionResult.bind(this);
        this.sendOutHandler = this.sendOut.bind(this);
        this.socketConnectionHandler = this.onSocketConnection.bind(this);
        this.socketMessageHandler = this.onSocketMessage.bind(this);
        this.socketClosedHandler = this.onSocketClosed.bind(this);

        this._socket = new BO.WSocketWrapper(host, port, protocol);
        this._socket.addEventListener(BO.WSocketEvent.CONNECTED, this.socketConnectionHandler);
        this._socket.addEventListener(BO.WSocketEvent.MESSAGE, this.socketMessageHandler);
        this._socket.addEventListener(BO.WSocketEvent.CLOSE, this.socketClosedHandler);

    };

    IOBoard.prototype = {

        constructor: IOBoard,

        // Private methods:

        /**
         * A websocket connection has been established.
         * @private
         * @method onSocketConnection
         */
        onSocketConnection: function (event) {
            this.debug("debug: Socket Status: (open)");
            this.dispatchEvent(new IOBoardEvent(IOBoardEvent.CONNECTED));
            this.begin();
        },

        /**
         * A websocket message has been received.
         * @param {Object} event The message property is an array of one or
         * more stringified bytes from the board or a config string from
         * the server.
         * @private
         * @method onSocketMessage
         */
        onSocketMessage: function (event) {
            var message = event.message,
                data = [],
                len;

            if (message.length > 1) {
                data = message.split(",");

                len = data.length;
                for (var i = 0; i < len; i++) {
                    this.parseInputMessage(data[i]);
                }
            } else {
                this.parseInputMessage(message);
            }
        },

        /**
         * Determine if the incoming data is a config message or a byte.
         * @param {String} data A string representing a config message or
         * an 8-bit unsigned integer.
         * @private
         * @method parseInputMessage
         */
        parseInputMessage: function (data) {
            var pattern = /config/,
                message = "";

            // Check for config messages from the server
            if (data.match(pattern)) {
                // to do: update servers to send a JSON string
                // then parse the string here
                message = data.substr(data.indexOf(':') + 2);
                this.processStatusMessage(message);
            } else {
                // We have data from the IOBoard
                this.processInput(parseInt(data, 10));
            }
        },

        /**
         * Report that the websocket connection has been closed.
         * @private
         * @method onSocketClosed
         */
        onSocketClosed: function (event) {
            this.debug("debug: Socket Status: " + this._socket.readyState + " (Closed)");
            this.dispatchEvent(new IOBoardEvent(IOBoardEvent.DISCONNECTED));
        },

        /**
         * Request the firmware version from the IOBoard.
         * @private
         * @method begin
         */
        begin: function () {
            this.addEventListener(IOBoardEvent.FIRMWARE_NAME, this.initialVersionResultHandler);
            this.reportFirmware();
        },

        /**
         * On startup, Firmata reports its version. Make sure the version is
         * 2.3 or greater before proceeding. If the Firmata version is < 2.3
         * report this to the user (to do: throw appropriate error?).
         *
         * @private
         * @method onInitialVersionResult
         */
        onInitialVersionResult: function (event) {
            var version = event.version * 10,
                name = event.name,
                self = this;

            this.removeEventListener(IOBoardEvent.FIRMWARE_NAME, this.initialVersionResultHandler);

            this.debug("debug: Firmware name = " + name + ", Firmware version = " + event.version);
            
            // Make sure the user has uploaded StandardFirmata 2.3 or greater
            if (version >= 23) {

                if (!this._isMultiClientEnabled) {
                    // reset IOBoard to its default state
                    this.systemReset();

                    // Delay to allow systemReset function to execute in StandardFirmata
                    setTimeout(function () {
                        self.queryCapabilities();
                        self.checkForQueryResponse();
                    }, 200);
                } else {
                    this.queryCapabilities();
                    this.checkForQueryResponse();
                }

            } else {
                var err = "error: You must upload StandardFirmata version 2.3 or greater from Arduino version 1.0 or higher";
                console.log(err);
                //throw err;
            }
        },

        /**
         * Check if a capability response was received. If not, assume that
         * a custom sketch was loaded to the IOBoard and fire a READY event.
         * @private
         * @method checkForQueryResponse
         */
        checkForQueryResponse: function () {
            var self = this;

            // If after 200ms a capability query response is not received,
            // assume that the user is running a custom sketch that does
            // not implement a capability query response.

            // 200ms is sufficient for an Arduino Mega (current longest
            // response time). Need to revisit when Arduino Due support is
            // added to Firmata.
            setTimeout(function () {
                if (self._capabilityQueryResponseReceived === false) {
                    self.startup();
                }
            }, 200);
        },

        /**
         * Process a status message from the websocket server
         * @private
         * @method processStatusMessage
         */
        processStatusMessage: function (message) {
            if (message === MULTI_CLIENT) {
                this.debug("debug: Multi-client mode enabled");
                this._isMultiClientEnabled = true;
            }
        },

        /**
         * Process input data from the IOBoard.
         * @param {Number} inputData Number as an 8-bit unsigned integer
         * @private
         * @method processInput
         */
        processInput: function (inputData) {
            var len;

            this._inputDataBuffer.push(inputData);
            len = this._inputDataBuffer.length;

            if (this._inputDataBuffer[0] >= 128 && this._inputDataBuffer[0] != START_SYSEX) {
                if (len === 3) {
                    this.processMultiByteCommand(this._inputDataBuffer);
                    // Clear buffer
                    this._inputDataBuffer = [];
                }
            } else if (this._inputDataBuffer[0] === START_SYSEX && this._inputDataBuffer[len - 1] === END_SYSEX) {
                this.processSysexCommand(this._inputDataBuffer);
                // Clear buffer
                this._inputDataBuffer = [];
            } else if (inputData >= 128 && this._inputDataBuffer[0] < 128) {
                // If for some reason we got a new command and there is already data
                // in the buffer, reset the buffer
                console.log("warning: Malformed input data... resetting buffer");
                this._inputDataBuffer = [];
                if (inputData !== END_SYSEX) {
                    this._inputDataBuffer.push(inputData);
                }
            }
        },

        /**
         * Incoming data is either multibyte or sysex. Route multibyte
         * data to the appropriate method.
         *
         * @private
         * @method processMultiByteCommand
         */
        processMultiByteCommand: function (commandData) {
            var command = commandData[0],
                channel;

            if (command < 0xF0) {
                command = command & 0xF0;
                channel = commandData[0] & 0x0F;
            }

            switch (command) {
            case DIGITAL_MESSAGE:
                this.processDigitalMessage(channel, commandData[1], commandData[2]); //(LSB, MSB)
                break;
            case REPORT_VERSION:
                this._firmwareVersion = commandData[1] + commandData[2] / 10;
                this.dispatchEvent(new IOBoardEvent(IOBoardEvent.FIRMWARE_VERSION), {version: this._firmwareVersion});
                break;
            case ANALOG_MESSAGE:
                this.processAnalogMessage(channel, commandData[1], commandData[2]);
                break;
            }
        },

        /**
         * Processing inmcoming digital data. Parse the port number and value
         * to determine if any digital input data has changed. Dispatch an
         * event if the value has changed.
         *
         * @param {Number} port Digital data is sent per port. This does not
         * align with the concept of a microcontroller port, but is a
         * collection of 8 pins on the microcontroller.
         *
         * @param {Number} bits0_6 Bits 0 - 6 of the port value.
         * @param {Number} bits7_13 Bits 7 - 13 of the port value.
         * @private
         * @method processDigitalMessage
         */
        processDigitalMessage: function (port, bits0_6, bits7_13) {
            var offset = port * 8,
                lastPin = offset + 8,
                portVal = bits0_6 | (bits7_13 << 7),
                pinVal,
                pin = {};
            
            if (lastPin >= this._totalPins) {
                lastPin = this._totalPins;
            }
            
            var j = 0;
            for (var i = offset; i < lastPin; i++) {
                pin = this.getDigitalPin(i);
                // Ignore data send on Firmata startup
                if (pin === undefined) {
                    return;
                }
                
                if (pin.getType() == Pin.DIN) {
                    pinVal = (portVal >> j) & 0x01;
                    if (pinVal != pin.value) {
                        pin.value = pinVal;
                        this.dispatchEvent(new IOBoardEvent(IOBoardEvent.DIGITAL_DATA), {pin: pin});
                    }
                }
                j++;
            }
        },

        /**
         * Process incoming analog data. The value is mapped from 0 - 1023 to
         * a floating point value between 0.0 - 1.0.
         *
         * TO DO: add a maxADCValue property to Pin or IOBoard to support
         * ADC values > 1023. maxADCValue could be set during the 
         * configuration routine if it's supported by Firmata in the future.
         *
         * @private
         * @method processAnalogMessage
         */
        processAnalogMessage: function (channel, bits0_6, bits7_13) {
            var analogPin = this.getAnalogPin(channel);

            // NOTE: Is there a better way to handle this? This issue is on
            // browser refresh the IOBoard board is still sending analog data
            // if analog reporting was set before the refresh. Analog reporting
            // won't be disabled by systemReset systemReset() is called. There
            // is not a way to call that method fast enough so the following
            // code is needed. An alternative would be to set a flag that
            // prevents critical operations before systemReset has completed.
            if (analogPin === undefined) {
                return;
            }

            analogPin.value = this.getValueFromTwo7bitBytes(bits0_6, bits7_13) / 1023;
            if (analogPin.value != analogPin.lastValue) {
                this.dispatchEvent(new IOBoardEvent(IOBoardEvent.ANALOG_DATA), {pin: analogPin});
            }
        },

        /**
         * Route the incoming sysex data to the appropriate method.
         * @private
         * @method processSysexCommand
         */
        processSysexCommand: function (sysexData) {
            // Remove the first and last element from the array
            // since these are the START_SYSEX and END_SYSEX 
            sysexData.shift();
            sysexData.pop();

            var command = sysexData[0];
            switch (command) {
            case REPORT_FIRMWARE:
                this.processQueryFirmwareResult(sysexData);
                break;
            case STRING_DATA:
                this.processSysExString(sysexData);
                break;
            case CAPABILITY_RESPONSE:
                this.processCapabilitiesResponse(sysexData);
                break;
            case PIN_STATE_RESPONSE:
                this.processPinStateResponse(sysexData);
                break;
            case ANALOG_MAPPING_RESPONSE:
                this.processAnalogMappingResponse(sysexData);
                break;
            default:
                // Custom sysEx message
                this.dispatchEvent(new IOBoardEvent(IOBoardEvent.SYSEX_MESSAGE), {message: sysexData});
                break;
            }
        },

        /**
         * Construct the firmware name and version from incoming ascii data.
         * @private
         * @method processQueryFirmwareResult
         */
        processQueryFirmwareResult: function (msg) {
            var data;
            for (var i = 3, len = msg.length; i < len; i += 2) {
                data = msg[i];
                data += msg[i + 1];
                this._firmwareName += String.fromCharCode(data);
            }
            this._firmwareVersion = msg[1] + msg[2] / 10;
            this.dispatchEvent(new IOBoardEvent(IOBoardEvent.FIRMWARE_NAME), {name: this._firmwareName, version: this._firmwareVersion});
        },
        
        /**
         * Construct a String from an incoming ascii data.
         * @private
         * @method processSysExString
         */
        processSysExString: function (msg) {
            var str = "",
                data,
                len = msg.length;

            for (var i = 1; i < len; i += 2) {
                data = msg[i];
                data += msg[i + 1];
                str += String.fromCharCode(data);                
            }
            this.dispatchEvent(new IOBoardEvent(IOBoardEvent.STRING_MESSAGE), {message: str});
        },

        /** 
         * Auto configure using capabilities response.
         * This creates a configuration for any board in the Firmata boards.h 
         * file.
         *
         * @private
         * @method processCapabilitiesResponse
         */
        processCapabilitiesResponse: function (msg) {
            // If running in multi-client mode and this client is already 
            // configured, ignore capabilities response
            if (this._isConfigured) {
                return;
            }

            var pinCapabilities = {},
                byteCounter = 1, // Skip 1st byte because it's the command
                pinCounter = 0,
                analogPinCounter = 0,
                len = msg.length,
                type,
                pin;

            this._capabilityQueryResponseReceived = true;    
                    
            // Create default configuration
            while (byteCounter <= len) {
                // 127 denotes end of pin's modes
                if (msg[byteCounter] == 127) {
                    
                    // Is digital pin mapping even necessary anymore?
                    this._digitalPinMapping[pinCounter] = pinCounter;
                    type = undefined;
                    
                    // Assign default types
                    if (pinCapabilities[Pin.DOUT]) {
                        // Map digital pins
                        type = Pin.DOUT;
                    }
                    
                    if (pinCapabilities[Pin.AIN]) {
                        type = Pin.AIN;
                        // Map analog input pins
                        this._analogPinMapping[analogPinCounter++] = pinCounter;
                    }
                    
                    pin = new Pin(pinCounter, type);
                    pin.setCapabilities(pinCapabilities);
                    this.managePinListener(pin);
                    this._ioPins[pinCounter] = pin;
                    
                    // Store the 2 i2c pin numbers if they exist
                    // To Do: allow for more than 2 i2c pins on a board?
                    // How to identify SDA-SCL pairs in that case?
                    if (pin.getCapabilities()[Pin.I2C]) {
                        this._i2cPins.push(pin.number);
                    }
                    
                    pinCapabilities = {};
                    pinCounter++;
                    byteCounter++;
                } else {
                    // Create capabilities object (mode: resolution) for each 
                    // mode supported by each pin
                    pinCapabilities[msg[byteCounter]] = msg[byteCounter + 1];
                    byteCounter += 2;
                }
            }
            
            this._numPorts = Math.ceil(pinCounter / 8);
            this.debug("debug: Num ports = " + this._numPorts);
            
            // Initialize port values
            for (var j = 0; j < this._numPorts; j++) {
                this._digitalPort[j] = 0;
            }
            
            this._totalPins = pinCounter;
            this._totalAnalogPins = analogPinCounter;
            this.debug("debug: Num pins = " + this._totalPins);

            // Map the analog pins to the board pins
            // This will map the IOBoard analog pin numbers (printed on IOBoard)
            // to their digital pin number equivalents
            this.queryAnalogMapping();
        },

        /**
         * Map map analog pins to board pin numbers. Need to do this because
         * the capability query does not provide the correct order of analog
         * pins.
         *
         * @private
         * @method processAnalogMappingResponse
         */
        processAnalogMappingResponse: function (msg) {
            // If running in multi-client mode and this client is 
            // already configured ignore analog mapping response
            if (this._isConfigured) {
                return;
            }

            var len = msg.length;
            for (var i = 1; i < len; i++) {
                if (msg[i] != 127) {
                    this._analogPinMapping[msg[i]] = i - 1;
                    this.getPin(i - 1).setAnalogNumber(msg[i]);
                }
            }
            
            if (!this._isMultiClientEnabled) {
                this.startup();
            } else {
                this.startupInMultiClientMode();
            }
        },
        
        /**
         * Single client mode is the default mode.
         * Checking the "Enable multi-client" box in the Breakout Server UI to
         * enable multi-client mode.
         * 
         * @private
         * @method startupInMultiClientMode
         */     
        startupInMultiClientMode: function () {
            var len = this.getPinCount();
            // Populate pins with the current IOBoard state
            for (var i = 0; i < len; i++) {
                this.queryPinState(this.getDigitalPin(i));
            }

            // Wait for the pin states to finish updating
            setTimeout(this.startup.bind(this), 500);
            this._isConfigured = true;
        },

        /**
         * The IOBoard is configured and ready to send and accept commands.
         * @private
         * @method startup
         */
        startup: function () {
            this.debug("debug: IOBoard ready");
            this._isReady = true;
            this.enableDigitalPins();
            this.dispatchEvent(new IOBoardEvent(IOBoardEvent.READY));
        },
        
        /**
         * Resets the board to its default state without physically resetting
         * the board.
         *
         * @private
         * @method systemReset
         */
        systemReset: function () {
            this.debug("debug: System reset");
            this.send(SYSEX_RESET);
        },

        /**
         * Reads the current configuration of the requested pin. The following
         * values are returned: 1: pin number, 2: pin type (0: DIN, 1: DOUT, 
         * 2: AIN, 3: AOUT / PWM, 4: SERVO, 5: SHIFT, 6: I2C), 3: pin state.
         * The pin state for output modes is the value previously written
         * to the pin. For input modes (AIN, DIN, etc) the state is typically
         * zero (it is not the value that was written to the pin). For digital
         * inputs the state is the status of the pullup resistor.
         *
         * @private
         * @method processPinStateResponse
         */
        processPinStateResponse: function (msg) {
            // Ignore requests that were not made by this client
            if (this._numPinStateRequests <= 0) {
                return;
            }
                        
            var len = msg.length,
                pinNumber = msg[1],
                pinType = msg[2],
                pinState,
                pin = this._ioPins[pinNumber];

            if (len > 4) {
                pinState = this.getValueFromTwo7bitBytes(msg[3], msg[4]);
            } else if (len > 3) {
                pinState = msg[3];
            }
            
            // update the pin type if it has changed
            // typically this only happens when multiple clients are connecting
            // to a single IOBoard. Each client (aside from the initial client) 
            // needs to get the current pin type
            if (pin.getType() != pinType) {
                pin.setType(pinType);
                this.managePinListener(pin);
            }

            pin.setState(pinState);
            
            this._numPinStateRequests--;
            if (this._numPinStateRequests < 0) {
                // should never happen, but just in case...
                this._numPinStateRequests = 0;
            }

            this.dispatchEvent(new IOBoardEvent(IOBoardEvent.PIN_STATE_RESPONSE), {pin: pin});
        },

        /**
         * Convert char to decimal value.
         * 
         * @private
         * @method toDec
         */
        toDec: function (ch) {
            ch = ch.substring(0, 1);
            var decVal = ch.charCodeAt(0);      
            return decVal;
        },
        
        /**
         * Called when ever a pin value is set via pin.value = someValue.
         * Sends digital or analog output pin and output values to the IOBoard.
         *
         * @private
         * @method sendOut
         * @param {Event} event A reference to the event object (Pin in this
         * case).
         */
        sendOut: function (event) {
            var type = event.target.getType(),
                pinNum = event.target.number,
                value = event.target.value;

            switch (type) {
            case Pin.DOUT:
                this.sendDigitalData(pinNum, value);
                break;
            case Pin.AOUT:
                this.sendAnalogData(pinNum, value);
                break;
            case Pin.SERVO:
                this.sendServoData(pinNum, value);
                break;
            }
        },

        /**
         * Ensure that event listeners are properly managed for pin objects 
         * as the pin type is changed during the execution of the program.
         *
         * @private
         * @method managePinListener
         */  
        managePinListener: function (pin) {
            if (pin.getType() == Pin.DOUT || pin.getType() == Pin.AOUT || pin.getType() == Pin.SERVO) {
                if (!pin.hasEventListener(PinEvent.CHANGE)) {
                    pin.addEventListener(PinEvent.CHANGE, this.sendOutHandler);
                }
            } else {
                if (pin.hasEventListener(PinEvent.CHANGE)) {
                    try {
                        pin.removeEventListener(PinEvent.CHANGE, this.sendOutHandler);
                    } catch (e) {
                        // Pin had reference to other handler, ignore
                        this.debug("debug: Caught pin removeEventListener exception");
                    }
                }
            }
        },

        /**
         * Sends an analog value up to 14 bits on an analog pin number between
         * 0 and 15. The value passed to this method should be in the range of
         * 0.0 to 1.0. It is multiplied by the maxPWMValue set for the pin.
         *
         * @param {Number} pin The analog pin number.
         * param {Number} value The value to send (0.0 to 1.0).
         * @private
         * @method sendAnalogData
         */
        sendAnalogData: function (pin, value) {
            var pwmMax = this.getDigitalPin(pin).maxPWMValue;
            value *= pwmMax;
            value = (value < 0) ? 0: value;
            value = (value > pwmMax) ? pwmMax : value;

            if (pin > 15 || value > Math.pow(2, 14)) {
                this.sendExtendedAnalogData(pin, value);
            } else {
                this.send([ANALOG_MESSAGE | (pin & 0x0F), value & 0x007F, (value >> 7) & 0x007F]);
            }
        },

        /**
         * Sends an analog value > 14 bits and/or send a value for a pin number
         * greater than 15.
         * @param {Number} pin The analog pin number (up to 128).
         * @param {Number} value The value to send (up to 16 bits).
         * @private
         * @method sendExtendedAnalogData
         */ 
        sendExtendedAnalogData: function (pin, value) {
            var analogData = [];
            
            // If > 16 bits
            if (value > Math.pow(2, 16)) {
                var err = "error: Extended Analog values > 16 bits are not currently supported by StandardFirmata";
                console.log(err);
                throw err;
            }
            
            analogData[0] = START_SYSEX;
            analogData[1] = EXTENDED_ANALOG;
            analogData[2] = pin;
            analogData[3] = value & 0x007F;
            analogData[4] = (value >> 7) & 0x007F;  // Up to 14 bits
                    
            // If > 14 bits
            if (value >= Math.pow(2, 14)) {
                analogData[5] = (value >> 14) & 0x007F;
            }

            analogData.push(END_SYSEX);
            this.send(analogData);
        },

        /**
         * Add the pin value to the appropriate digital port and send the 
         * updated digital port value.
         * 
         * @param {Number} pin The digital pin number.
         * @param {Number} value The value of the digital pin (0 or 1).
         * @private
         * @method sendDigitalData
         */
        sendDigitalData: function (pin, value) {
            var portNum = Math.floor(pin / 8);

            if (value == Pin.HIGH) {
                // Set the bit
                this._digitalPort[portNum] |= (value << (pin % 8));
            }
            else if (value == Pin.LOW) {
                // Clear the bit
                this._digitalPort[portNum] &= ~(1 << (pin % 8));
            }
            else {
                console.log("warning: Invalid value passed to sendDigital, value must be 0 or 1.");
                return; // Invalid value
            }
            
            this.sendDigitalPort(portNum, this._digitalPort[portNum]);  
        },

        /**
         * Send the servo angle.
         * @param {Number} pin The digital pin number the servo is attached to.
         * @param {Number} value The angle to rotate to (0.0 to 1.0 mapped to 0 - 180).
         * @private
         * @method sendServoData
         */ 
        sendServoData: function (pin, value) {
            var servoPin = this.getDigitalPin(pin);
            if (servoPin.getType() == Pin.SERVO && servoPin.lastValue != value) {
                this.sendAnalogData(pin, value);
            }   
        },
        
        /**
         * Query the cababilities and current state any board running Firmata.
         * 
         * @private
         * @method queryCapabilities
         */
        queryCapabilities: function () {
            this.send([START_SYSEX, CAPABILITY_QUERY, END_SYSEX]);
        },

        /**
         * Query which pins correspond to the analog channels
         *
         * @private
         * @method queryAnalogMapping
         */
        queryAnalogMapping: function () {
            this.send([START_SYSEX, ANALOG_MAPPING_QUERY, END_SYSEX]);
        },

        /**
         * Call this method to enable or disable analog input for the specified
         * pin.
         *
         * @private
         * @method setAnalogPinReporting
         * @param {Number} pin The pin connected to the analog input
         * @param {Number} mode Pin.ON to enable input or Pin.OFF to disable
         * input for the specified pin.
         */
        setAnalogPinReporting: function (pin, mode) {
            this.send([REPORT_ANALOG | pin, mode]);
            this.getAnalogPin(pin).setType(Pin.AIN);
        },

        /**
         * for debugging
         * @private
         */
        debug: function (str) {
            if (this._debugMode) {
                console.log(str); 
            }
        },

        // Getters and setters:

        /**
         * Get or set the sampling interval (how often to run the main loop on
         * the IOBoard). Normally the sampling interval should not be changed. 
         * Default = 19 (ms).
         *
         * @property samplingInterval
         * @type Number
         */
        get samplingInterval() { 
            return this._samplingInterval;
        },
        set samplingInterval(interval) {
            if (interval >= MIN_SAMPLING_INTERVAL && interval <= MAX_SAMPLING_INTERVAL) {
                this._samplingInterval = interval;
                this.send([START_SYSEX, SAMPLING_INTERVAL, interval & 0x007F, (interval >> 7) & 0x007F, END_SYSEX]);
            } else {
                // To Do: Throw error?
                console.log("warning: Sampling interval must be between " + MIN_SAMPLING_INTERVAL + " and " + MAX_SAMPLING_INTERVAL);
            }
        },
        
        /**
         * Set to true when the IOBoard is ready. This can be used in place of
         * listening for the IOBoardEvent.READY event when creating an app with
         * a draw loop (such as when using processing.js or three.js);
         *
         * @property isReady
         * @type Boolean
         */
        get isReady() { 
            return this._isReady;
        },


        // Public methods:

        /**
         * A utility class to assemble a single value from the 2 bytes returned
         * from the IOBoard (since data is passed in 7 bit Bytes rather than 
         * 8 bit it must be reassembled. This is to be used as a protected
         * method and should not be needed in any application level code.
         *
         * @private
         * @method getValueFromTwo7bitBytes
         * @param {Number} lsb The least-significant byte of the 2 values to
         * be concatentated
         * @param {Number} msb The most-significant byte of the 2 values to be
         * concatenated
         * @return {Number} The result of merging the 2 bytes
         */
        getValueFromTwo7bitBytes: function (lsb, msb) {
            return (msb << 7) | lsb;
        },
        
        /**
         * @method getSocket
         * @return {WSocketWrapper} A reference to the WebSocket
         */
        getSocket: function () { 
            return this._socket;
        },
            
        /**
         * Request the Firmata version implemented in the firmware (sketch)
         * running on the IOBoard.
         * Listen for the IOBoard.FIRMWARE_VERSION event to be notified of when 
         * the Firmata version is returned from the IOBoard.
         * @method reportVersion
         */ 
        reportVersion: function () {
            this.send(REPORT_VERSION);
        },

        /**
         * Request the name of the firmware (the sketch) running on the IOBoard.
         * Listen for the IOBoard.FIRMWARE_NAME event to be notified of when 
         * the name is returned from the IOBoard. The version number is also
         * returned.
         * @method reportFirmware
         */
        reportFirmware: function () {
            this.send([START_SYSEX, REPORT_FIRMWARE, END_SYSEX]);
        },
        
        /**
         * Disables digital pin reporting for all digital pins.
         * @method disableDigitalPins
         */
        disableDigitalPins: function () {
            for (var i = 0; i < this._numPorts; i++) {
                this.sendDigitalPortReporting(i, Pin.OFF);
            }
        },
        
        /**
         * Enables digital pin reporting for all digital pins. You must call
         * this before you can receive digital pin data from the IOBoard.
         * @method enableDigitalPins
         */
        enableDigitalPins: function () {
            for (var i = 0; i < this._numPorts; i++) {
                this.sendDigitalPortReporting(i, Pin.ON);
            }
        },

        /**
         * Enable or disable reporting of all digital pins for the specified
         * port.
         * @method sendDigitalPortReporting
         * @param {Number} mode Either Pin.On or Pin.OFF
         */
        sendDigitalPortReporting: function (port, mode) {
            this.send([(REPORT_DIGITAL | port), mode]);
        },
        
        /**
         * Call this method to enable analog input for the specified pin.
         * @method enableAnalogPin
         * @param {Number} pin The pin connected to the analog input
         */
        enableAnalogPin: function (pin) {
            this.setAnalogPinReporting(pin, Pin.ON);
        },

        /**
         * Call this method to disable analog input for the specified pin.
         * @method disableAnalogPin
         * @param {Number} pin The pin connected to the analog input
         */
        disableAnalogPin: function (pin) {
            this.setAnalogPinReporting(pin, Pin.OFF);
        },

        /**
         * Set the specified digital pin mode. 
         *
         * @method setDigitalPinMode
         * @param {Number} pin The number of the pin. When using and analog
         * pin as a digital pin, refer the datasheet for your board to obtain 
         * the digital pin equivalent of the analog pin number. For example on 
         * an Arduino UNO, analog pin 0 = digital pin 14.
         * @param {Number} mode Pin.DIN, Pin.DOUT, Pin.PWM, Pin.SERVO,
         * Pin.SHIFT, or Pin.I2c
         * @param {Boolean} silent [optional] Set to true to not send
         * SET_PIN_MODE command. Default = false.
         */
        setDigitalPinMode: function (pinNumber, mode, silent) {
            this.getDigitalPin(pinNumber).setType(mode);
            this.managePinListener(this.getDigitalPin(pinNumber));
            
            // sometimes we want to set up a pin without sending the set pin
            // mode command because the firmware handles the pin mode
            if (!silent || silent !== true) {
                this.send([SET_PIN_MODE, pinNumber, mode]);
            }
        },

        /**
         * Enable the internal pull-up resistor for the specified pin number.
         * @method enablePullUp
         * @param {Number} pinNum The number of the input pin to enable the
         * pull-up resistor.
         */
        enablePullUp: function (pinNum) {
            this.sendDigitalData(pinNum, Pin.HIGH);
        },

        /**
         * @method getFirmwareName
         * @return {String} The name of the firmware running on the IOBoard.
         */
        getFirmwareName: function () {
            // To Do: It seams that Firmata is reporting the Firmware
            // name malformed.
            return this._firmwareName;
        },
        
        /**
         * @method getFirmwareVersion
         * @return {String} The version of the firmware running on the
         * IOBoard.
         */
        getFirmwareVersion: function () {
            return this._firmwareVersion;
        },

        /**
         * Returns the capabilities for each pin on the IOBoard. The array is
         * indexed by pin number (beginning at pin 0). Each array element
         * contains an object with a property for each modes (input, output, 
         * pwm, servo, i2c, etc) supported by the pin. The mode value is the
         * resolution in bits.
         *
         * @method getPinCapabilities
         * @return {Array} The capabilities of the Pins on the IOBoard.
         */
        getPinCapabilities: function () {
            var capabilities = [],
                len,
                pinElements,
                pinCapabilities,
                hasCapabilities;

            var modeNames = {
                0: "input",
                1: "output",
                2: "analog",
                3: "pwm",
                4: "servo",
                5: "shift",
                6: "i2c",
                7: "onewire",
                8: "stepper"
            };

            len = this._ioPins.length;
            for (var i = 0; i < len; i++) {
                pinElements = {};
                pinCapabilities = this._ioPins[i].getCapabilities();
                hasCapabilities = false;

                for (var mode in pinCapabilities) {
                    if (pinCapabilities.hasOwnProperty(mode)) {
                        hasCapabilities = true;
                        if (mode >= 0) {
                            pinElements[modeNames[mode]] = this._ioPins[i].getCapabilities()[mode];
                        }
                    }
                }

                if (!hasCapabilities) {
                    capabilities[i] = {"not available": "0"};
                } else {
                    capabilities[i] = pinElements;
                }
                
            }

            return capabilities;
        },

        /**
         * Reads the current state of the requested pin. Listen for the
         * IOBoardEvent.PIN_STATE_RESPONSE event to get the response.
         * The response contains a reference to the pin object with its
         * state updated to match the current state of the pin on the IOBoard.
         *
         * You should not typically need to call this method since the pin
         * states are maintained client-side. Use the getAnalogPin or 
         * getDigitalPin to get the current state of a pin or getPins to
         * get an array of all Pin objects for the IOBoard.
         *
         * Cases for queryPinState are to update the pin state after a period
         * of inactivity. For example if multiple client applications are
         * using the same IOBoard (so multiple JavaScript apps connected to
         * the same Arduino). When a new client connection is made, 
         * queryPinState is called automatically to copy the IOBoard pin state
         * to the client. If for some reason you needed to copy the state of a
         * single or multiple Pins again, you could call queryPinState in your
         * application. In most cases however you should never need to call 
         * this method.
         *
         * @method queryPinState
         * @param {Pin} pin The pin object to query the pin state for.
         */      
        queryPinState: function (pin) {
            // To Do: Ensure that pin is a Pin object
            var pinNumber = pin.number;
            this.send([START_SYSEX, PIN_STATE_QUERY, pinNumber, END_SYSEX]);
            this._numPinStateRequests++;
        },

        /**
         * Send the digital values for a port. Making this private for now.
         *
         * @private
         * @method sendDigitalPort
         * @param {Number} portNumber The number of the port
         * @param {Number} portData A byte representing the state of the 8 pins
         * for the specified port
         */
        sendDigitalPort: function (portNumber, portData) {
            this.send([DIGITAL_MESSAGE | (portNumber & 0x0F), portData & 0x7F, portData >> 7]);
        },        

        /**
         * Send a string message to the IOBoard. This is useful if you have a
         * custom sketch running on the IOBoard rather than StandardFirmata
         * and want to communicate with your javascript message via string
         * messages that you then parse in javascript.
         * You can receive string messages as well.
         *
         * <p>To test, load the EchoString.pde example from Firmata->Examples
         * menu in the IOBoard Application, then use sendString("your string
         * message") to have it echoed back to your javascript application.</p>
         *
         * @method sendString
         * @param {String} str The string message to send to the IOBoard
         */
        sendString: function (str) {
            // Convert chars to decimal values
            var decValues = [];
            for (var i = 0, len = str.length; i < len; i++) {
                decValues.push(this.toDec(str[i]) & 0x007F);
                decValues.push((this.toDec(str[i]) >> 7) & 0x007F);
            }
            // Data > 7 bits in length must be split into 2 bytes and  
            // packed into an array before passing to the sendSysex
            // method
            this.sendSysex(STRING_DATA, decValues);
        },

        /**
         * Send a sysEx message to the IOBoard. This is useful for sending
         * custom sysEx data to the IOBoard, for example if you are not using
         * StandardFirmata. You would likely use it in a class rather than 
         * calling it from your main application.
         *
         * @private
         * @method sendSysex
         * @param {Number} command The sysEx command value (see firmata.org)
         * @param {Number[]} data A packet of data representing the sysEx
         * message to be sent
         * @see <a href="http://firmata.org/wiki/Protocol#Sysex_Message_Format">Firmata Sysex Message Format"</a>
         */
        sendSysex: function (command, data) {
            var sysexData = [];
            sysexData[0] = START_SYSEX;
            sysexData[1] = command;
            // This would be problematic since the sysEx message format does
            // not enforce splitting all bytes after the command byte
            //for (var i=0, len=data.length; i<len; i++) {
            //  sysexData.push(data[i] & 0x007F);
            //  sysexData.push((data[i] >> 7) & 0x007F);                
            //}
            
            for (var i = 0, len = data.length; i < len; i++) {
                sysexData.push(data[i]);            
            }
            sysexData.push(END_SYSEX);
            
            this.send(sysexData);      
        },

        /**
         * Call to associate a pin with a connected servo motor. See the
         * documentation for your servo motor for the minimum and maximum 
         * pulse width. If you can't find it, then the default values should
         * be close enough so call sendServoAttach(pin) omitting the min and
         * max values.
         *
         * @method sendServoAttach
         * @param {Number} pin The pin the server is connected to.
         * @param {Number} minPulse [optional] The minimum pulse width for the
         * servo. Default = 544.
         * @param {Number} maxPulse [optional] The maximum pulse width for the
         * servo. Default = 2400.
         */
        sendServoAttach: function (pin, minPulse, maxPulse) {
            var servoPin,
                servoData = [];

            minPulse = minPulse || 544;      // Default value = 544
            maxPulse = maxPulse || 2400;     // Default value = 2400
        
            servoData[0] = START_SYSEX;
            servoData[1] = SERVO_CONFIG;
            servoData[2] = pin;
            servoData[3] = minPulse % 128;
            servoData[4] = minPulse >> 7;
            servoData[5] = maxPulse % 128;
            servoData[6] = maxPulse >> 7;   
            servoData[7] = END_SYSEX;
            
            this.send(servoData);
        
            servoPin = this.getDigitalPin(pin);
            servoPin.setType(Pin.SERVO);
            this.managePinListener(servoPin);    
        },

        /**
         * @private
         * @method getPin
         * @return {Pin} An unmapped reference to the Pin object.
         */
        getPin: function (pinNumber) {
            return this._ioPins[pinNumber];
        },
        
        /**
         * @method getAnalogPin
         * @return {Pin} A reference to the Pin object (mapped to the IOBoard
         * board analog pin).
         */ 
        getAnalogPin: function (pinNumber) {
            return this._ioPins[this._analogPinMapping[pinNumber]];
        },
        
        /**
         * @method getDigitalPin
         * @return {Pin} A reference to the Pin object (mapped to the IOBoard
         * board digital pin).
         */ 
        getDigitalPin: function (pinNumber) {
            return this._ioPins[this._digitalPinMapping[pinNumber]];
        },

        /**
         * @method getPins
         * @return {Pin[]} An array containing all pins on the IOBoard
         */ 
        getPins: function () {
            return this._ioPins;
        },

        /**
         * Use this method to obtain the digital pin number equivalent 
         * for an analog pin.
         *
         * @example
         *     // set analog pin A3 on an Arduino Uno to digital input
         *     board.setDigitalPinMode(board.analogToDigital(3), Pin.DIN);
         *
         * <p>board.analogToDigital(3) returns 17 which is the digital
         * equivalent of the analog pin</p>
         *
         * @method analogToDigital
         * @return {Number} The digital pin number equivalent for the specified
         * analog pin number.
         */ 
        analogToDigital: function (analogPinNumber) {
            return this.getAnalogPin(analogPinNumber).number;  
        },
        
        /**
         * @method getPinCount
         * @return {Number} Total number of pins
         */
        getPinCount: function () {
            return this._totalPins;
        },

        /**
         * @method getAnalogPinCount
         * @return {Number} The total number of analog pins supported by this
         * IOBoard
         */
        getAnalogPinCount: function () {
            return this._totalAnalogPins;
        },
        
        /**
         * Returns undefined if the board does not have i2c pins.
         * @private
         * @method getI2cPins
         * @return {Number[]} The pin numbers of the i2c pins if the board has
         * i2c.
         */
        getI2cPins: function () {
            return this._i2cPins;
        },

        /**
         * Call this method to print the capabilities for all pins to 
         * the console.
         * @method reportCapabilities
         */
        reportCapabilities: function () {
            var capabilities = this.getPinCapabilities(),
                len = capabilities.length,
                resolution;

            for (var i = 0; i < len; i++) {
                console.log("Pin " + i + ":");
                for (var mode in capabilities[i]) {
                    if (capabilities[i].hasOwnProperty(mode)) {
                        resolution = capabilities[i][mode];
                        console.log("\t" + mode + " (" + resolution + (resolution > 1 ? " bits)" : " bit)"));
                    } 
                }
            }
        },

        /**
         * A wrapper for the send method of the WebSocket
         * I'm not sure there is a case for the user to call this method
         * So I'm making this private for now.
         *
         * @private
         * @method send
         * @param {Number[]} message Message data to be sent to the IOBoard
         */
        send: function (message) {
            this._socket.sendString(message);
        },
        
        /**
         * A wrapper for the close method of the WebSocket. Making this 
         * private until a use case arises.
         *
         * @private
         * @method close
         */
        close: function () {
            this._socket.close();
        },

        // Implement EventDispatcher
        
        /**
         * @param {String} type The event type
         * @param {Function} listener The function to be called when the event
         * is fired
         */
        addEventListener: function (type, listener) {
            this._evtDispatcher.addEventListener(type, listener);
        },
        
        /**
         * @param {String} type The event type
         * @param {Function} listener The function to be called when the event
         * is fired
         */
        removeEventListener: function (type, listener) {
            this._evtDispatcher.removeEventListener(type, listener);
        },
        
        /**
         * @param {String} type The event type
         * return {boolean} True is listener exists for this type, false if not.
         */
        hasEventListener: function (type) {
            return this._evtDispatcher.hasEventListener(type);
        },
        
        /**
         * @param {Event} type The Event object
         * @param {Object} optionalParams Optional parameters to assign to the
         * event object.
         * return {boolean} True if dispatch is successful, false if not.
         */     
        dispatchEvent: function (event, optionalParams) {
            return this._evtDispatcher.dispatchEvent(event, optionalParams);
        }

    };

    // Document events

    /**
     * The ioBoardReady event is dispatched when the board is ready to
     * send and receive commands. 
     * @type BO.IOBoardEvent.READY
     * @event ioBoardReady
     * @param {IOBoard} target A reference to the IOBoard
     */

    /**
     * The ioBoardConnected event is dispatched when the websocket 
     * connection is established.
     * @type BO.IOBoardEvent.CONNECTED
     * @event ioBoardConnected
     * @param {IOBoard} target A reference to the IOBoard
     */

    /**
     * The ioBoardDisconnected event is dispatched when the websocket
     * connection is closed.
     * @type BO.IOBoardEvent.DISCONNECTED
     * @event ioBoardDisconnected
     * @param {IOBoard} target A reference to the IOBoard
     */  
     
    /**
     * The stringMessage event is dispatched when a string is received
     * from the IOBoard.
     * @type BO.IOBoardEvent.STRING_MESSAGE
     * @event stringMessage
     * @param {IOBoard} target A reference to the IOBoard
     * @param {String} message The string message received from the IOBoard
     */

    /**
     * The sysexMessage event is dispatched when a sysEx message is 
     * received from the IOBoard.
     * @type BO.IOBoardEvent.SYSEX_MESSAGE
     * @event sysexMessage
     * @param {IOBoard} target A reference to the IOBoard
     * @param {Array} message The sysEx data
     */
     
    /**
     * The firmwareVersion event is dispatched when the firmware version
     * is received from the IOBoard.
     * @type BO.IOBoardEvent.FIRMWARE_VERSION
     * @event firmwareVersion
     * @param {IOBoard} target A reference to the IOBoard
     * @param {Number} version The firmware version (where Firmata 2.3 = 23)
     */
     
    /**
     * The firmwareName event is dispatched when the firmware name is
     * received from the IOBoard.
     * @type BO.IOBoardEvent.FIRMWARE_NAME
     * @event firmwareName
     * @param {IOBoard} target A reference to the IOBoard
     * @param {String} name The name of the firmware running on the IOBoard
     * @param {Number} version The firmware version (where Firmata 2.3 = 23)
     */ 
     
    /**
     * The pinStateResponse event is dispatched when the results of
     * a pin state query (via a call to: queryPinState()) is received.
     * @type BO.IOBoardEvent.PIN_STATE_RESPONSE
     * @event pinStateResponse
     * @param {IOBoard} target A reference to the IOBoard
     * @param {BO.Pin} pin A reference to the pin object.
     */

    /**
     * The analogData event is dispatched when analog data is received
     * from the IOBoard. Use thie event to be notified when any analog
     * pin value changes. Use Pin.CHANGE to be notified when a specific
     * pin value changes.
     * @type BO.IOBoardEvent.ANALOG_DATA
     * @event analogData
     * @param {IOBoard} target A reference to the IOBoard
     * @param {BO.Pin} pin A reference to the pin object.
     */
     
    /**
     * The digitalData event is dispatched when digital data is received
     * from the IOBoard. Use this event to be notified when any digital
     * pin value changes. Use Pin.CHANGE to be notified when a specific
     * pin value changes.
     * @type BO.IOBoardEvent.DIGITAL_DATA
     * @event digitalData
     * @param {IOBoard} target A reference to the IOBoard
     * @param {BO.Pin} pin A reference to the pin object.
     */
     
    return IOBoard;

}());
