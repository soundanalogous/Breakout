 /**
 * Based on Accelerometer.as originally written in as3.
 * Copyright (c) the Funnel development team
 * http://www.funnel.cc
 *
 * Ported to JavaScript by Jeff Hoefs
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 *
 * Released under the MIT license. See LICENSE file for details.
 */

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

    Object.defineProperties(AnalogAccelerometer.prototype, {
        // Properties that apply to any accelereomter

        /**
         * [read-only] the accelerometer dynamic range in Gs (either 2G, 4G, 8G, or 16G for this sensor)..
         * @property dynamicRange
         * @type Number
         */
        dynamicRange: {
            get: function () {
                return this._dynamicRange;
            }
        },

        /**
         * [read-only] The acceleration value in Gs (9.8m/sec^2) along the x-axis.
         * @property x
         * @type Number
         */
        x: {
            get: function () {
                return this._x;
            }
        },

        /**
         * [read-only] The acceleration value in Gs (9.8m/sec^2) along the y-axis.
         * @property y
         * @type Number
         */
        y: {
            get: function () {
                return this._y;
            }
        },

        /**
         * [read-only] The acceleration value in Gs (9.8m/sec^2) along the z-axis.
         * @property z
         * @type Number
         */
        z: {
            get: function () {
                return this._z;
            }
        },

        /**
         * [read-only] The pitch value in degrees 
         * @property pitch
         * @type Number
         */
        pitch: {
            get: function () {
                // -180 to 180
                //return Math.atan2(this._x, this._z) * RAD_TO_DEG;
                // -90 to 90
                return Math.atan2(this._x, Math.sqrt(this._y * this._y + this._z * this._z)) * RAD_TO_DEG;
            }
        },

        /**
         * [read-only] The roll value in degrees 
         * @property roll
         * @type Number
         */
        roll: {
            get: function () {
                // -180 to 180
                //return Math.atan2(this._y, this._z) * RAD_TO_DEG;
                // -90 to 90
                return Math.atan2(this._y, Math.sqrt(this._x * this._x + this._z * this._z)) * RAD_TO_DEG;
            }
        },

        // Properties specific to analog accelerometers:

        xPin: {
            get: function () {
                return this._xPin;
            }
        },

        yPin: {
            get: function () {
                return this._yPin;
            }
        },

        zPin: {
            get: function () {
                return this._zPin;
            }
        }
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
