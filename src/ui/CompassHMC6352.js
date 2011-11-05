/**
 * @author Jeff Hoefs
 */

ARDJS.namespace('ARDJS.ui.CompassHMC6352');

ARDJS.ui.CompassHMC6352 = (function() {

	var CompassHMC6352;

	// dependencies
	var I2CBase = ARDJS.I2CBase,
		Event = ARDJS.Event;

	/**
	 * HMC6352 digital compass module
	 *
	 * @constructor
	 * @augments I2CBase
	 * @param {Arduino} board The Arduino instance
	 * @param {Number} address The i2c address of the compass module
	 */
	CompassHMC6352 = function(board, address) {

		this.address = address || 0x21;
		this._heading = 0;
		this._lastHeading = 0;
		
		I2CBase.call(this, board, this.address);
			
		// 0x51 = 10 Hz measurement rate, Query mode
		this.sendI2CRequest([I2CBase.WRITE, this.address, 0x47, 0x74, 0x51]);
		this.sendI2CRequest([I2CBase.WRITE, this.address, 0x41]);
		
		this.startReading();

	}

	CompassHMC6352.prototype = ARDJS.inherit(I2CBase.prototype);
	CompassHMC6352.prototype.constructor = CompassHMC6352;


	/**
	 * @returns {Number} The heading in degrees
	 */
	CompassHMC6352.prototype.getHeading = function() {
		return this._heading;
	}
	
	/**
	 * @private
	 */
	CompassHMC6352.prototype.handleI2C = function(data) {

		// data[0] = register
		this._heading = Math.floor(((data[1] << 8) | data[2]) / 10.0);
		
		if (this._heading != this._lastHeading) {
			this.dispatchEvent(new Event(Event.CHANGE));
		}
		this._lastHeading = this._heading;
	}
	
	/**
	 * Start continuous reading of the sensor
	 */
	CompassHMC6352.prototype.startReading = function() {
		this.sendI2CRequest([I2CBase.READ_CONTINUOUS, this.address, 0x7F, 0x02]);
	}
	
	/**
	 * Stop continuous reading of the sensor
	 */
	CompassHMC6352.prototype.stopReading = function() {
		this.sendI2CRequest([I2CBase.STOP_READING, this.address]);
	}


	return CompassHMC6352;

}());