/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.io.CompassHMC6352');

BO.io.CompassHMC6352 = (function() {

	var CompassHMC6352;

	// dependencies
	var I2CBase = BO.I2CBase,
		CompassEvent = BO.io.CompassEvent;

	/**
	 * HMC6352 digital compass module
	 *
	 * @exports CompassHMC6352 as BO.io.CompassHMC6352
	 * @class Creates an interface to an HMC6352 Digital Compass module.
	 * Use the compass to obtain a heading. You must hold the sensor flat
	 * to obtain the most accurate heading value (just like an analog compass).
	 * The compass is also useful in obtaining a rotation value in relation
	 * to a fixed position. See Breakout/examples/sensors/hmc6352.html and
	 * Breakout/examples/processing_js/compass.html for example applications.
	 * @constructor
	 * @augments BO.I2CBase
	 * @param {IOBoard} board The IOBoard instance
	 * @param {Number} address The i2c address of the compass module
	 */
	CompassHMC6352 = function(board, address) {

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
	 * @name CompassHMC6352#heading
	 * @property
	 * @type Number
	 */ 	 
	CompassHMC6352.prototype.__defineGetter__("heading", function() {return this._heading; });
	
	/**
	 * @private
	 */
	CompassHMC6352.prototype.handleI2C = function(data) {

		// data[0] = register
		this._heading = Math.floor(((data[1] << 8) | data[2]) / 10.0);
		
		if (this._heading != this._lastHeading) {
			this.dispatchEvent(new CompassEvent(CompassEvent.UPDATE));
		}
		this._lastHeading = this._heading;
	};
	
	/**
	 * Start continuous reading of the sensor
	 */
	CompassHMC6352.prototype.startReading = function() {
		this.sendI2CRequest([I2CBase.READ_CONTINUOUS, this.address, 0x7F, 0x02]);
	};
	
	/**
	 * Stop continuous reading of the sensor
	 */
	CompassHMC6352.prototype.stopReading = function() {
		this.sendI2CRequest([I2CBase.STOP_READING, this.address]);
	};


	// document events

	/**
	 * The update event is dispatched when the compass heading is updated.
	 * @name CompassHMC6352#update
	 * @type BO.io.CompassEvent.UPDATE
	 * @event
	 * @param {BO.io.CompassHMC6352} target A reference to the CompassHMC6352 object.
	 */		

	return CompassHMC6352;

}());