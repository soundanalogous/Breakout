/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

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

    Object.defineProperties(SoftPot.prototype, {
        /**
         * The current value.
         * @property value
         * @type Number
         */
        value: {
            get: function () {
                return this._touchPoint;
            }
        },
        
        /**
         * The current distance from the press point.
         * @property distanceFromPressed
         * @type Number
         */
        distanceFromPressed: {
            get: function () {
                return this._distanceFromPressed;
            }
        },
        
        /**
         * The minimum distance required to trigger a flick event. Change this
         * value to fine tune the flick gesture.
         * @property minFlickMovement
         * @type Number
         */
        minFlickMovement: {
            get: function () {
                return this._minFlickMovement;
            },
            set: function (min) {
                this._minFlickMovement = min;
            }
        },
        
        /**
         * The minimum distance required to trigger a drag event. Change this
         * value to fine tune the drag response.
         * @property minDragMovement
         * @type Number
         */
        minDragMovement: {
            get: function () {
                return this._minDragMovement;
            },
            set: function (min) {
                this._minDragMovement = min;
            }
        },

        /**
         * The maximum time (in milliseconds) between a press and release in
         * order to trigger a TAP event.
         * @property tapTimeout
         * @type Number
         */
        tapTimeout: {
            get: function () {
                return this._tapTimeout;
            },
            set: function (t) {
                this._tapTimeout = t;
            }
        },

        /**
         * The minimum value required to set the Release state. This number should
         * be as close to zero as possible. Increase this value if you are noticing
         * fluttering between the Pressed and Released states. Default value = 0.01;
         * @property minValue
         * @type Number
         */
        minValue: {
            get: function () {
                return this._minValue;
            },
            set: function (val) {
                this._minValue = val;
            }
        }
    });
    
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
