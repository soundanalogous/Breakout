/**
 * Copyright (c) 2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.io.MagnetometerHMC5883');

BO.io.MagnetometerHMC5883 = (function() {

	var MagnetometerHMC5883;

		// private static constants
	var RAD_TO_DEG = 180 / Math.PI,
		DEG_TO_RAD = Math.PI/180,
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
	 * HMC5883 3-axis magnetometer
	 *
	 * @exports MagnetometerHMC5883 as BO.io.MagnetometerHMC5883
	 * @class Creates an interface to an HMC5883 3-axis magnetometer. Use the
	 * magnetometer to obtain a compass heading or rotation in relation to
	 * a fixed point. See Breakout/examples/sensors/hmc5883.html for an example
	 * application.
	 * @constructor
	 * @augments BO.I2CBase
	 * @param {IOBoard} board The IOBoard instance
	 * @param {Number} address The i2c address of the compass module
	 * @param {Number} numSamples The number of samples averaged per 
	 * measurement output. Options are: MagnetometerHMC5883.SAMPLES_1,
	 * MagnetometerHMC5883.SAMPLES_2, MagnetometerHMC5883.SAMPLES_4
	 * MagnetometerHMC5883.SAMPLES_8 (default = MagnetometerHMC5883.SAMPLES_1)
	 * @param {Number} outputRate The data output rate in Hz 
	 * (default = MagnetometerHMC5883.HZ_30)
	 */
	MagnetometerHMC5883 = function(board, address, numSamples, outputRate) {
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
	 * @name MagnetometerHMC5883#heading
	 * @property
	 * @type Number
	 */ 	 
	MagnetometerHMC5883.prototype.__defineGetter__("heading", function() {
		return this.getHeading(this._x, this._y);
	});

	/**
	 * [read-only] The x-axis measurement
	 * @name MagnetometerHMC5883#x
	 * @property
	 * @type Number
	 */ 	 
	MagnetometerHMC5883.prototype.__defineGetter__("x", function() { return this._x; });

	/**
	 * [read-only] The y-axis measurement
	 * @name MagnetometerHMC5883#y
	 * @property
	 * @type Number
	 */ 	 
	MagnetometerHMC5883.prototype.__defineGetter__("y", function() { return this._y; });
	
	/**
	 * [read-only] The z-axis measurement
	 * @name MagnetometerHMC5883#z
	 * @property
	 * @type Number
	 */ 	 
	MagnetometerHMC5883.prototype.__defineGetter__("z", function() { return this._z; });	
	
	/**
	 * @private
	 */
	MagnetometerHMC5883.prototype.handleI2C = function(data) {
		var xVal,
			yVal,
			zVal;

		// data[0] = register
		if (data[0] === DATAX0) {
			xVal = (data[1] << 8) | data[2];
			zVal = (data[3] << 8) | data[4];
			yVal = (data[5] << 8) | data[6];

			// correct for negative number
			if(xVal >> 15) {
				this._x = ((xVal ^ 0xFFFF) + 1) * -1;
			} else this._x = xVal;
			if(yVal >> 15) {
				this._y = ((yVal ^ 0xFFFF) + 1) * -1;
			} else this._y = yVal;
			if(zVal >> 15) {
				this._z = ((zVal ^ 0xFFFF) + 1) * -1;
			} else this._z = zVal;

			// a value of -4096 indicates an ADC overflow or underflow
		
			this.dispatchEvent(new MagnetometerEvent(MagnetometerEvent.UPDATE));
		} else {
			console.log("Warning: MagnetometerHMC5883 received data from unknown register");
		}
	};

	/**
	 * @private
	 */
	MagnetometerHMC5883.prototype.getHeading = function(x, y) {
		var heading = 0.0;

		// algorithm from Applications of Magnetoresistive Sensors in Navigation Systems
		// by Michael J. Caruso of Honeywell Inc.
		if (y > 0) heading = 90.0 - Math.atan(x/y) * 180/Math.PI;
		else if (y < 0) heading = 270.0 - Math.atan(x/y) * 180/Math.PI;
		else if (y === 0 && x < 0) heading = 180.0;
		else if (y === 0 && x > 0) heading = 0.0;

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
	 * 
	 * @param {Number} pitch The pitch value (supplied by an accelerometer)
	 * @param {Number} roll The roll value (supplied by an accelerometer)
	 * @return {Number} tilt-compensated heading direction
	 */
	MagnetometerHMC5883.prototype.getTiltCompensatedHeading = function(pitch, roll) {

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
	 * Start continuous reading of the sensor
	 */
	MagnetometerHMC5883.prototype.startReading = function() {
		if (!this._isReading) {
			this._isReading = true;
			this.sendI2CRequest([I2CBase.READ_CONTINUOUS, this.address, DATAX0, 6]);
		}
	};
	
	/**
	 * Stop continuous reading of the sensor
	 */
	MagnetometerHMC5883.prototype.stopReading = function() {
		this._isReading = false;
		this.sendI2CRequest([I2CBase.STOP_READING, this.address]);
		// set idle mode?
		//this.sendI2CRequest([I2CBase.WRITE, this.address, MODE, 0x03]);
	};

	/** 
	 * Sends read request to magnetometer and updates magnetometer values.
	 */
	MagnetometerHMC5883.prototype.update = function() {
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
	MagnetometerHMC5883.prototype.debug = function(str) {
		if (this._debugMode) {
			console.log(str); 
		}
	};	

	// public static constants

	/** @constant */
	MagnetometerHMC5883.DEVICE_ID = 0x1E;	
	
	/** @constant */
	MagnetometerHMC5883.SAMPLES_1 = 0;
	/** @constant */
	MagnetometerHMC5883.SAMPLES_2 = 1;
	/** @constant */
	MagnetometerHMC5883.SAMPLES_4 = 2;
	/** @constant */
	MagnetometerHMC5883.SAMPLES_8 = 3;	
	
	/** 0.75 Hz
	 * @constant 
	 */
	MagnetometerHMC5883.HZ_0_75 = 0x00;
	/** 1.5 Hz 
	 * @constant 
	 */
	MagnetometerHMC5883.HZ_1_5 = 0x01;
	/** 3 Hz 
	 * @constant 
	 */
	MagnetometerHMC5883.HZ_3 = 0x02;
	/** 7.5 Hz 
	* @constant 
	*/
	MagnetometerHMC5883.HZ_7_5 = 0x03;
	/** 15 Hz 
	* @constant 
	*/
	MagnetometerHMC5883.HZ_15 = 0x04;
	/** 30 Hz 
	 * @constant 
	 */
	MagnetometerHMC5883.HZ_30 = 0x05;
	/** 75 Hz 
	 * @constant 
	 */
	MagnetometerHMC5883.HZ_75 = 0x06;		


	// document events

	/**
	 * The update event is dispatched when the compass heading is updated.
	 * @name MagnetometerHMC5883#update
	 * @type BO.io.MagnetometerEvent.UPDATE
	 * @event
	 * @param {BO.io.MagnetometerHMC5883} target A reference to the MagnetometerHMC5883 object.
	 */		

	return MagnetometerHMC5883;

}());