/**
 * @author Jeff Hoefs
 */

BREAKOUT.namespace('BREAKOUT.AccelerometerI2CBase');

BREAKOUT.AccelerometerI2CBase = (function() {
	"use strict";

	var AccelerometerI2CBase;

		// dependencies
	var I2CBase = BREAKOUT.I2CBase;

	/**
	 * A base class for i2c accelerometers to help enforce a common
	 * interface for all accelerometer implementations.
	 *
	 * @exports AccelerometerI2CBase as BREAKOUT.AccelerometerI2CBase
	 * @constructor
	 * @augments BREAKOUT.I2CBase
	 * @param {IOBoard} board A reference to the IOBoard instance
	 * @param {Number} address The I2C address of the device
	 * @param {Number} delayUS The number of microseconds ...
	 */
	AccelerometerI2CBase = function(board, address, delayUS) {

		// call the super class
		I2CBase.call(this, board, address, delayUS);

		this.name = "AccelerometerI2CBase"; // for testing

		/** @protected */
		this._dynamicRange;
		/** @protected */
		this._x;
		/** @protected */
		this._y;
		/** @protected */
		this._z;

	};

	AccelerometerI2CBase.prototype = BREAKOUT.inherit(I2CBase);
	AccelerometerI2CBase.prototype.constructor = AccelerometerI2CBase;

	/**
	 * [read-only] The current range setting of the accelerometer in units 
	 * of gravity (9.8 m/sec2).
	 * @name AccelerometerI2CBase#dynamicRange
	 * @property
	 * @type Number
	 */ 
	AccelerometerI2CBase.prototype.__defineGetter__("dynamicRange", function() { return this._dynamicRange; });

	/**
	 * [read-only] The x axis of the accelerometer in units 
	 * of gravity (9.8 m/sec2).
	 * @name AccelerometerI2CBase#x
	 * @property
	 * @type Number
	 */ 
	AccelerometerI2CBase.prototype.__defineGetter__("x", function() { return this._x; });

	/**
	 * [read-only] The y axis of the accelerometer in units 
	 * of gravity (9.8 m/sec2).
	 * @name AccelerometerI2CBase#y
	 * @property
	 * @type Number
	 */ 
	AccelerometerI2CBase.prototype.__defineGetter__("y", function() { return this._y; });

	/**
	 * [read-only] The z axis of the accelerometer in units 
	 * of gravity (9.8 m/sec2).
	 * @name AccelerometerI2CBase#z
	 * @property
	 * @type Number
	 */ 
	AccelerometerI2CBase.prototype.__defineGetter__("z", function() { return this._z; });


	return AccelerometerI2CBase;

}());

