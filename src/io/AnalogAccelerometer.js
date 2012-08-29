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

BO.io.AnalogAccelerometer = (function() {
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
	 * Creates a new Analog Accelerometer object
	 *
	 * @exports AnalogAccelerometer as BO.io.AnalogAccelerometer
	 * @class Creates an interface to an analog accelerometer. Use the
	 * accelerometer to read the acceleration along the x, y, and z axis of an 
	 * object it is attached to. You can also obtain the pitch and roll. This
	 * object should interface with most analog accelerometers.	See
	 * Breakout/examples/sensors/analog_accelerometer.html and 
	 * Breakout/examples/three_js/accelerometer.html for example applications. 
	 * @constructor
	 * @augments BO.PhysicalInputBase	 
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
	AnalogAccelerometer = function(board, xPin, yPin, zPin, dynamicRange, enableSmoothing) {

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
	 * 
	 * @name AnalogAccelerometer#dynamicRange
	 * @property
	 * @type Number
	 */ 
	AnalogAccelerometer.prototype.__defineGetter__("dynamicRange", function() { return this._dynamicRange; });

	/**
	 * [read-only] The x axis of the accelerometer in units 
	 * of gravity (9.8 m/sec2).
	 * 
	 * @name AnalogAccelerometer#x
	 * @property
	 * @type Number
	 */ 
	AnalogAccelerometer.prototype.__defineGetter__("x", function() { return this._x; });

	/**
	 * [read-only] The y axis of the accelerometer in units 
	 * of gravity (9.8 m/sec2).
	 * 
	 * @name AnalogAccelerometer#y
	 * @property
	 * @type Number
	 */ 
	AnalogAccelerometer.prototype.__defineGetter__("y", function() { return this._y; });

	/**
	 * [read-only] The z axis of the accelerometer in units 
	 * of gravity (9.8 m/sec2).
	 * 
	 * @name AnalogAccelerometer#z
	 * @property
	 * @type Number
	 */ 
	AnalogAccelerometer.prototype.__defineGetter__("z", function() { return this._z; });

	/**
	 * [read-only] The pitch value in degrees.
	 * 
	 * @name AnalogAccelerometer#pitch
	 * @property
	 * @type Number
	 */ 
	AnalogAccelerometer.prototype.__defineGetter__("pitch", function() { 
		// -180 to 180
		//return Math.atan2(this._x, this._z) * RAD_TO_DEG;
		// -90 to 90
		return Math.atan2(this._x, Math.sqrt(this._y * this._y + this._z * this._z)) * RAD_TO_DEG;
	});
	
	/**
	 * [read-only] The roll value in degrees.
	 * 
	 * @name AnalogAccelerometer#roll
	 * @property
	 * @type Number
	 */ 
	AnalogAccelerometer.prototype.__defineGetter__("roll", function() { 
		// -180 to 180
		//return Math.atan2(this._y, this._z) * RAD_TO_DEG;
		// -90 to 90
		return Math.atan2(this._y, Math.sqrt(this._x * this._x + this._z * this._z)) * RAD_TO_DEG;
	});	

	// Methods specific to this Accelerometer type:

	AnalogAccelerometer.prototype.__defineGetter__("xPin", function() { 
		return this._xPin;
	});

	AnalogAccelerometer.prototype.__defineGetter__("yPin", function() { 
		return this._yPin;
	});	
	
	AnalogAccelerometer.prototype.__defineGetter__("zPin", function() { 
		return this._zPin;
	});			
	
	/**
	 * Scale the range for the specified axis (from 0 to 1) to (minimum to 
	 * maximum).
	 * 
	 * @param axis the axis to set new range (AnalogAccelerometer.X_AXIS, 
	 * AnalogAccelerometer.Y_AXIS or AnalogAccelerometer.Z_AXIS).
	 * @param {Number} minimum The new minimum value
	 * @param {Number} maximum The new maximum value
	 */
	AnalogAccelerometer.prototype.setRangeFor = function(axis, minimum, maximum) {
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
	 * @param {Number} minVoltage The minimum value reported on the axis
	 * @param {Number} maxVoltage The maximum value reported on the axis
	 * @param {Number} supplyVoltage The supply voltage of the Acceleromter
	 * (enter as 3.3, 3.0, 5.0, etc).
	 * @return {Object} An object containing the min and max range values to be
	 * passed to the setRangeFor method.
	 */
	AnalogAccelerometer.prototype.getCalibratedRange = function(minVoltage, maxVoltage, supplyVoltage) {
		var range = {min:0, max:0};
		
		var mVPerG = (maxVoltage - minVoltage) / 2;
		
		// Find zero G (average of min and max)
		var zeroG = (minVoltage + maxVoltage) / 2;
		
		range.min = (zeroG - (mVPerG * this._dynamicRange))/supplyVoltage;
		range.max = (zeroG + (mVPerG * this._dynamicRange))/supplyVoltage;
		
		return range;
	};		

	/**
	 * @private
	 */
	AnalogAccelerometer.prototype.xAxisChanged = function(event) {
		this._x = event.target.value;
		this.dispatchEvent(new AccelerometerEvent(AccelerometerEvent.UPDATE));
	};

	/**
	 * @private
	 */
	AnalogAccelerometer.prototype.yAxisChanged = function(event) {
		this._y = event.target.value;
		this.dispatchEvent(new AccelerometerEvent(AccelerometerEvent.UPDATE));
	};
	
	/**
	 * @private
	 */
	AnalogAccelerometer.prototype.zAxisChanged = function(event) {
		this._z = event.target.value;
		this.dispatchEvent(new AccelerometerEvent(AccelerometerEvent.UPDATE));
	};		

	/** @constant */
	AnalogAccelerometer.X_AXIS = 0;
	/** @constant */
	AnalogAccelerometer.Y_AXIS = 1;
	/** @constant */
	AnalogAccelerometer.Z_AXIS = 2;


	// Document events

	/**
	 * The update event is dispatched when the accelerometer values are updated.
	 * @name AnalogAccelerometer#update
	 * @type BO.io.AccelerometerEvent.UPDATE
	 * @event
	 * @param {BO.io.AnalogAccelerometer} target A reference to the 
	 * AnalogAccelerometer object.
	 */		

	return AnalogAccelerometer;

}());
