/**
 * Copyright (c) 2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.io.MagnetoMeterHMC5883');

BO.io.MagnetoMeterHMC5883 = (function() {

	var MagnetoMeterHMC5883;

		// private static constants
	var RAD_TO_DEG = 180 / Math.PI,
		DEG_TO_RAD = Math.PI/180,
		ADDRESS = 0x1E,
		CRA = 0x00,
		CRB = 0x01,
		MODE = 0x02,
		DATAX0 = 0x03;

	// dependencies
	var I2CBase = BO.I2CBase,
		Event = JSUTILS.Event;

	/**
	 * HMC6352 digital compass module
	 *
	 * @exports MagnetoMeterHMC5883 as BO.io.MagnetoMeterHMC5883
	 * @constructor
	 * @augments BO.I2CBase
	 * @param {IOBoard} board The IOBoard instance
	 * @param {Number} address The i2c address of the compass module
	 * @param {Number} numSamples The number of samples averaged per 
	 * measurement output. Options are: MagnetoMeterHMC5883.SAMPLES_1,
	 * MagnetoMeterHMC5883.SAMPLES_2, MagnetoMeterHMC5883.SAMPLES_4
	 * MagnetoMeterHMC5883.SAMPLES_8 (default = MagnetoMeterHMC5883.SAMPLES_1)
	 * @param {Number} outputRate The data output rate in Hz 
	 * (default = MagnetoMeterHMC5883.HZ_30)
	 */
	MagnetoMeterHMC5883 = function(board, address, numSamples, outputRate) {
		address = address || MagnetoMeterHMC5883.DEVICE_ID;
		numSamples = numSamples || MagnetoMeterHMC5883.SAMPLES_1;
		outputRate = outputRate || MagnetoMeterHMC5883.HZ_30;

		I2CBase.call(this, board, address);

		this._x = 0;
		this._y = 0;
		this._z = 0;

		// To do: scale is currently fixed. allow user to change this value?
		this._scale = 0.92; // mG/LSb

		this._isReading = false;
		this._debugMode = true;

		this.name = "MagnetoMeterHMC5883";
		
		var measurement = 0x00;
		var CRAVal = (numSamples << 5) | (outputRate << 2)  | measurement;
			
		// 1 sample, continuous measurement rate 30 Hz, normal measurement config
		this.sendI2CRequest([I2CBase.WRITE, this.address, CRA, CRAVal]);
		// startup in continuous measurement mode
		this.sendI2CRequest([I2CBase.WRITE, this.address, MODE, 0x00]);
		
		this.startReading();

	};

	MagnetoMeterHMC5883.prototype = JSUTILS.inherit(I2CBase.prototype);
	MagnetoMeterHMC5883.prototype.constructor = MagnetoMeterHMC5883;

	/**
	 * [read-only] The heading in degrees.
	 * @name MagnetoMeterHMC5883#heading
	 * @property
	 * @type Number
	 */ 	 
	MagnetoMeterHMC5883.prototype.__defineGetter__("heading", function() {
		return this.getHeading(this._x, this._y);
	});

	/**
	 * [read-only] The x-axis measurement
	 * @name MagnetoMeterHMC5883#x
	 * @property
	 * @type Number
	 */ 	 
	MagnetoMeterHMC5883.prototype.__defineGetter__("x", function() { return this._x; });

	/**
	 * [read-only] The y-axis measurement
	 * @name MagnetoMeterHMC5883#y
	 * @property
	 * @type Number
	 */ 	 
	MagnetoMeterHMC5883.prototype.__defineGetter__("y", function() { return this._y; });
	
	/**
	 * [read-only] The z-axis measurement
	 * @name MagnetoMeterHMC5883#z
	 * @property
	 * @type Number
	 */ 	 
	MagnetoMeterHMC5883.prototype.__defineGetter__("z", function() { return this._z; });	
	
	/**
	 * @private
	 */
	MagnetoMeterHMC5883.prototype.handleI2C = function(data) {
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
		
			this.dispatchEvent(new Event(Event.CHANGE));
		} else {
			console.log("Warning: MagnetoMeterHMC5883 received data from unknown register");
		}
	};

	/**
	 * @private
	 */
	MagnetoMeterHMC5883.prototype.getHeading = function(x, y) {
		var heading = 0.0;

		// algorithm from Applications of Magnetoresistive Sensors in Navigation Systems
		// by Michael J. Caruso of Honeywell Inc.
		if (y > 0) heading = 90.0 - Math.atan(x/y) * 180/Math.PI;
		else if (y < 0) heading = 270.0 - Math.atan(x/y) * 180/Math.PI;
		else if (y === 0 && x < 0) heading = 180.0;
		else if (y === 0 && x > 0) heading = 0.0;

		return heading;

		// heading = Math.atan2(y, x);
		// if (heading < 0) heading += 2*Math.PI;
		// if (heading > 2*Math.PI) heading -= 2*Math.PI;
		// return heading * RAD_TO_DEG;		
	};

	/**
	 * Get a tilt-compensated heading. Pitch and roll values from an accelerometer
	 * must be passed to this method.
	 *
	 * @param {Number} pitch The pitch value (supplied by an accelerometer)
	 * @param {Number} roll The roll value (supplied by an accelerometer)
	 * @return {Number} tilt-compensated heading direction
	 */
	MagnetoMeterHMC5883.prototype.getTiltCompensatedHeading = function(pitch, roll) {

		pitch = pitch * DEG_TO_RAD;
		roll = roll * DEG_TO_RAD;

		//var xH = this._x * Math.cos(pitch) + this._z * Math.sin(pitch);
		//var yH = this._x * Math.sin(roll) * Math.sin(pitch) + this._y * Math.cos(roll) - this._z * Math.sin(roll) * Math.cos(pitch);
		//var zH = -this._x * Math.cos(roll) * Math.sin(pitch) + this._y * Math.sin(roll) + this._z * Math.cos(roll) * Math.cos(pitch);

		var xH = this._x * Math.cos(pitch) + this._y * Math.sin(roll) * Math.sin(pitch) - this._z * Math.cos(roll) * Math.sin(pitch);
		var yH = this._y * Math.cos(roll) + this._z * Math.sin(roll);

		return this.getHeading(xH, yH);

	};
	
	/**
	 * Start continuous reading of the sensor
	 */
	MagnetoMeterHMC5883.prototype.startReading = function() {
		if (!this._isReading) {
			this._isReading = true;
			this.sendI2CRequest([I2CBase.READ_CONTINUOUS, this.address, DATAX0, 6]);
		}
	};
	
	/**
	 * Stop continuous reading of the sensor
	 */
	MagnetoMeterHMC5883.prototype.stopReading = function() {
		this._isReading = false;
		this.sendI2CRequest([I2CBase.STOP_READING, this.address]);
		// set idle mode?
		//this.sendI2CRequest([I2CBase.WRITE, this.address, MODE, 0x03]);
	};

	/** 
	 * Sends read request to magnetometer and updates magnetometer values.
	 */
	MagnetoMeterHMC5883.prototype.update = function() {
		if (this._isReading) {
			this.stopReading();	
		}
		// read data: contents of X, Y, and Z registers
		this.sendI2CRequest([I2CBase.READ, this.address, DATAX0, 6]);
	};

	/**
	 * for debugging
	 * @private
	 */
	MagnetoMeterHMC5883.prototype.debug = function(str) {
		if (this._debugMode) {
			console.log(str); 
		}
	};	

	// public static constants

	/** @constant */
	MagnetoMeterHMC5883.DEVICE_ID = 0x1E;	
	
	/** @constant */
	MagnetoMeterHMC5883.SAMPLES_1 = 0;
	/** @constant */
	MagnetoMeterHMC5883.SAMPLES_2 = 1;
	/** @constant */
	MagnetoMeterHMC5883.SAMPLES_4 = 2;
	/** @constant */
	MagnetoMeterHMC5883.SAMPLES_8 = 3;	
	
	/** @constant */
	MagnetoMeterHMC5883.HZ_0_75 = 0x00;
	/** @constant */
	MagnetoMeterHMC5883.HZ_1_5 = 0x01;
	/** @constant */
	MagnetoMeterHMC5883.HZ_3 = 0x02;
	/** @constant */
	MagnetoMeterHMC5883.HZ_7_5 = 0x03;
	/** @constant */
	MagnetoMeterHMC5883.HZ_15 = 0x04;
	/** @constant */
	MagnetoMeterHMC5883.HZ_30 = 0x05;
	/** @constant */
	MagnetoMeterHMC5883.HZ_75 = 0x06;		


	// document events

	/**
	 * The update event is dispatched when the compass heading is updated.
	 * @name CompassHMC6352#update
	 * @type BO.io.CompassEvent.UPDATE
	 * @event
	 * @param {BO.io.CompassHMC6352} target A reference to the CompassHMC6352 object.
	 */		

	return MagnetoMeterHMC5883;

}());