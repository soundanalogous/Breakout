/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.io.AccelerometerADXL345');

BO.io.AccelerometerADXL345 = (function() {
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
		ALL_AXIS = 	DATAX0 | 0x80,
		NUM_BYTES = 6;	

	// dependencies
	var I2CBase = BO.I2CBase,
		AccelerometerEvent = BO.io.AccelerometerEvent;

	/**
	 * Analog Devices ADXL345 3-axis accelerometer
	 *
	 * @exports AccelerometerADXL345 as BO.io.AccelerometerADXL345
	 * @class Creates an interface to an ADXL345 3-axis accelerometer. Use the
	 * accelerometer to read the acceleration along the x, y, and z axis of an 
	 * object it is attached to. You can also obtain the pitch and roll. See the
	 * example in Breakout/examples/sensors/adxl345.html.
	 * @constructor
	 * @augments BO.I2CBase
	 * @param {IOBoard} board The IOBoard instance
	 * @param {Number} range The dynamic range selection in Gs (options RANGE_2G, RANGE_4G, 
	 * RANGE_8G, RANGE_16G). Default is RANGE_2G.	 
	 * @param {Number} address The i2c address of the accelerometer (default is 0x53)
	 */
	AccelerometerADXL345 = function(board, range, address) {

		address = address || AccelerometerADXL345.DEVICE_ID;
		I2CBase.call(this, board, address);

		this.name = "AccelerometerADXL345";

		this._dynamicRange = range || AccelerometerADXL345.RANGE_2G;
		
		this._sensitivity = {
			x: AccelerometerADXL345.DEFAULT_SENSITIVITY,
			y: AccelerometerADXL345.DEFAULT_SENSITIVITY,
			z: AccelerometerADXL345.DEFAULT_SENSITIVITY,
		};

		this._offset = {x:0, y:0, z:0};

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
	 * @name AccelerometerADXL345#dynamicRange
	 * @property
	 * @type Number
	 */ 	 
	AccelerometerADXL345.prototype.__defineGetter__("dynamicRange", function() { return this._dynamicRange; });

	/**
	 * [read-only] The acceleration value in Gs (9.8m/sec^2) along the x-axis.
	 * @name AccelerometerADXL345#x
	 * @property
	 * @type Number
	 */ 	 
	AccelerometerADXL345.prototype.__defineGetter__("x", function() { return this._x; });

	/**
	 * [read-only] The acceleration value in Gs (9.8m/sec^2) along the y-axis.
	 * @name AccelerometerADXL345#y
	 * @property
	 * @type Number
	 */ 	 
	AccelerometerADXL345.prototype.__defineGetter__("y", function() { return this._y; });
	
	/**
	 * [read-only] The acceleration value in Gs (9.8m/sec^2) along the z-axis.
	 * @name AccelerometerADXL345#z
	 * @property
	 * @type Number
	 */ 	 
	AccelerometerADXL345.prototype.__defineGetter__("z", function() { return this._z; });
	
	/**
	 * [read-only] The pitch value in degrees 
	 * @name AccelerometerADXL345#pitch
	 * @property
	 * @type Number
	 */ 
	AccelerometerADXL345.prototype.__defineGetter__("pitch", function() { 
		// -180 to 180
		//return Math.atan2(this._x, this._z) * RAD_TO_DEG;
		// -90 to 90
		return Math.atan2(this._x, Math.sqrt(this._y * this._y + this._z * this._z)) * RAD_TO_DEG;
	});
	
	/**
	 * [read-only] The roll value in degrees 
	 * @name AccelerometerADXL345#roll
	 * @property
	 * @type Number
	 */ 
	AccelerometerADXL345.prototype.__defineGetter__("roll", function() { 
		// -180 to 180
		//return Math.atan2(this._y, this._z) * RAD_TO_DEG;
		// -90 to 90
		return Math.atan2(this._y, Math.sqrt(this._x * this._x + this._z * this._z)) * RAD_TO_DEG;
	});
	
	// Methods specific to this Accelerometer type:		

	/**
	 * The raw value of the x axis
	 * @name AccelerometerADXL345#rawX
	 * @property
	 * @type Number
	 */ 	 
	AccelerometerADXL345.prototype.__defineGetter__("rawX", function() { return this._rawX; });

	/**
	 * The raw value of the y axis
	 * @name AccelerometerADXL345#rawY
	 * @property
	 * @type Number
	 */ 	 
	AccelerometerADXL345.prototype.__defineGetter__("rawY", function() { return this._rawY; });
	
	/**
	 * The raw value of the z axis
	 * @name AccelerometerADXL345#rawZ
	 * @property
	 * @type Number
	 */ 	 
	AccelerometerADXL345.prototype.__defineGetter__("rawZ", function() { return this._rawZ; });

	/**
	 * [read-only] The state of continuous read mode. True if continuous read mode
	 * is enabled, false if it is disabled.
	 * @name AccelerometerADXL345#isRunning
	 * @property
	 * @type Boolean
	 */ 	 
	AccelerometerADXL345.prototype.__defineGetter__("isRunning", function() { return this._isReading; });	
	
	/**
	 * The sensitivity value for the x axis (default value = 0.0390625).
	 * @name AccelerometerADXL345#sensitivityX
	 * @property
	 * @type Number
	 */ 	 
	AccelerometerADXL345.prototype.__defineGetter__("sensitivityX", function() { return this._sensitivity.x; });
	AccelerometerADXL345.prototype.__defineSetter__("sensitivityX", function(val) { this._sensitivity.x = val; });

	/**
	 * The sensitivity value for the y axis (default value = 0.0390625).
	 * @name AccelerometerADXL345#sensitivityY
	 * @property
	 * @type Number
	 */ 	 
	AccelerometerADXL345.prototype.__defineGetter__("sensitivityY", function() { return this._sensitivity.y; });
	AccelerometerADXL345.prototype.__defineSetter__("sensitivityY", function(val) { this._sensitivity.y = val; });
	
	/**
	 * The sensitivity value for the z axis (default value = 0.0390625).
	 * @name AccelerometerADXL345#sensitivityZ
	 * @property
	 * @type Number
	 */ 	 
	AccelerometerADXL345.prototype.__defineGetter__("sensitivityZ", function() { return this._sensitivity.z; });
	AccelerometerADXL345.prototype.__defineSetter__("sensitivityZ", function(val) { this._sensitivity.z = val; });			

	/**
	 * @private
	 */
	AccelerometerADXL345.prototype.setRangeAndFullRes = function(range) {
			
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
	 */
	AccelerometerADXL345.prototype.handleI2C = function(data) {
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
	 * Start continuous reading of the sensor
	 */
	AccelerometerADXL345.prototype.startReading = function() {
		if (!this._isReading) {
			this._isReading = true;
			this.sendI2CRequest([I2CBase.READ_CONTINUOUS, this.address, ALL_AXIS, NUM_BYTES]);
		}
	};
	
	/**
	 * Stop continuous reading of the sensor
	 */
	AccelerometerADXL345.prototype.stopReading = function() {
		this._isReading = false;
		this.sendI2CRequest([I2CBase.STOP_READING, this.address]);
	};

	/**
	 * offset the x, y, or z axis output by the respective input value
	 */		
	AccelerometerADXL345.prototype.setAxisOffset = function(xVal, yVal, zVal) {
		// store values so we can retrieve via getAxisOffset
		this._offset.x = xVal;
		this._offset.y = yVal;
		this._offset.z = zVal;
		
		this.sendI2CRequest([I2CBase.WRITE, this.address, OFSX, xVal]);
		this.sendI2CRequest([I2CBase.WRITE, this.address, OFSY, yVal]);
		this.sendI2CRequest([I2CBase.WRITE, this.address, OFSZ, zVal]);
	};
	
	/**
	 * get the value of the x, y, and z axis offset
	 */
	AccelerometerADXL345.prototype.getAxisOffset = function() {
		// will trace values if debug mode is enabled
		this.sendI2CRequest([I2CBase.READ, this.address, OFSX, 1]);
		this.sendI2CRequest([I2CBase.READ, this.address, OFSY, 1]);
		this.sendI2CRequest([I2cBase.READ, this.address, OFSZ, 1]);
		
		// return the locally stored values because it is not possible
		// without a more elaborate design to get i2c read values
		// in a single call
		return this._offset;
	};

	/** 
	 * Sends read request to accelerometer and updates accelerometer values.
	 */
	AccelerometerADXL345.prototype.update = function() {
		if (this._isReading) {
			this.stopReading();	
		}
		// read data: contents of X, Y, and Z registers
		this.sendI2CRequest([I2CBase.READ, this.address, ALL_AXIS, NUM_BYTES]);
	};

	/**
	 * @private
	 */
	AccelerometerADXL345.prototype.powerOn = function() {

		// standby mode
		this.sendI2CRequest([I2CBase.WRITE, this.address, POWER_CTL, 0]);
		
		// set measure bit
		this.setRegisterBit(POWER_CTL, 3, true);
	};
	
	/**
	 * @private
	 */
	AccelerometerADXL345.prototype.setRegisterBit = function(regAddress, bitPos, state) {
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
	 */
	AccelerometerADXL345.prototype.readAccel = function(data) {
		
		var x_val,
			y_val,
			z_val;

		if (data.length != NUM_BYTES + 1) {
			throw new Error("Incorrect number of bytes returned");
		}
		
		x_val = (data[2] << 8) | (data[1]);
		y_val = (data[4] << 8) | (data[3]);
		z_val = (data[6] << 8) | (data[5]);
		
		if(x_val >> 15) {
			this._rawX = ((x_val ^ 0xFFFF) + 1) * -1;
		} else this._rawX = x_val;
		if(y_val >> 15) {
			this._rawY = ((y_val ^ 0xFFFF) + 1) * -1;
		} else this._rawY = y_val;
		if(z_val >> 15) {
			this._rawZ = ((z_val ^ 0xFFFF) + 1) * -1;
		} else this._rawZ = z_val;

		this._x = this._rawX * this._sensitivity.x;
		this._y = this._rawY * this._sensitivity.y;
		this._z = this._rawZ * this._sensitivity.z;
		
		this.dispatchEvent(new AccelerometerEvent(AccelerometerEvent.UPDATE));			
	};
	
	/**
	 * for debugging
	 * @private
	 */
	AccelerometerADXL345.prototype.debug = function(str) {
		if (this._debugMode) {
			console.log(str); 
		}
	};
	 	
	// public static constants
	
	/** @constant */
	AccelerometerADXL345.RANGE_2G = 2;
	/** @constant */
	AccelerometerADXL345.RANGE_4G = 4;
	/** @constant */
	AccelerometerADXL345.RANGE_8G = 8;
	/** @constant */
	AccelerometerADXL345.RANGE_16G = 16;
	/** @constant */
	AccelerometerADXL345.DEVICE_ID = 0x53;
	/** @constant */
	AccelerometerADXL345.DEFAULT_SENSITIVITY = 0.00390625;
	
	// document events

	/**
	 * The update event is dispatched when the accelerometer values are updated.
	 * @name AccelerometerADXL345#update
	 * @type BO.io.AccelerometerEvent.UPDATE
	 * @event
	 * @param {BO.io.AccelerometerADXL345} target A reference to the AccelerometerADXL345 object.
	 */						

	return AccelerometerADXL345;

}());