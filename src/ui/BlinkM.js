/**
 * Creates and BlinkM object
 *
 * @constructor
 * @augments I2CBase 
 * @param {Arduino} board The Arduino instance
 * @param {Number} address The i2c address of the BlinkM module
 */
function BlinkM(board, address) {

	address = address || 0x09;	// default i2c address for BlinkM
	
	var self = this;

	// call super class
	I2CBase.call(self, board, address);
	
	/**
	 * Sets the BlinkM to the specified RGB color immediately
	 * @param {Number{}} color An array containing the RGB values. 
	 * color[0] = R, color[1] = G, color[2] = B
	 */
	this.goToRGBColorNow = function(color) {
		self.sendI2CRequest([I2CBase.WRITE, address, 0x6E, color[0], color[1], color[2]]);
	}
	
	/**
	 * Fades to the specified RGB color in the specified time duration. 
	 * The fade speed range is from 1 to 255, where 1 is the slowest time and 255 is the fastest.
	 *
	 * @param {Number[]} color An array containing the RGB values.
	 * color[0] = R, color[1] = G, color[2] = B
	 * @param {Number} speed The fade speed. Default value is 15.
	 */
	this.fadeToRGBColor = function(color, speed) {
		speed = speed || -1;
		if (speed >= 0) {
			self.sendI2CRequest([I2CBase.WRITE, address, 0x66, speed]);
		}
		self.sendI2CRequest([I2CBase.WRITE, address, 0x63, color[0], color[1], color[2]]);
	}

	/**
	 * Fade to a random RGB color.
	 * The fade speed range is from 1 to 255, where 1 is the slowest time and 255 is the fastest.
	 *
	 * @param {Number[]} colorRange An array containing a range for each color value.
	 * colorRange[0] = range for Red (0-255), colorRange[1] = range for Green, etc.
	 * @param {Number} speed The fade speed. Default value is 15.
	 */
	this.fadeToRandomRGBColor = function (colorRange, speed) {
		speed = speed || -1;
		if (speed >= 0) {
			self.sendI2CRequest([I2CBase.WRITE, address, 0x66, speed]);
		}
		self.sendI2CRequest([I2CBase.WRITE, address, 0x43, colorRange[0], colorRange[1], colorRange[2]]);
	}

	/**
	 * Fades to the specified HSB color in the specified time duration. 
	 * The fade speed range is from 1 to 255, where 1 is the slowest time and 255 is the fastest.
	 *
	 * @param {Number[]} color An array containing the HSB values.
	 * color[0] = H, color[1] = S, color[2] = B
	 * @param {Number} speed The fade speed. Default value is 15.
	 */
	this.fadeToHSBColor = function(color, speed) {
		speed = speed || -1;
		if (speed >= 0) {
			self.sendI2CRequest([I2CBase.WRITE, address, 0x66, speed]);
		}
		self.sendI2CRequest([I2CBase.WRITE, address, 0x68, color[0], color[1], color[2]]);
	}
	
	/**
	 * Fade to a random HSB color.
	 * The fade speed range is from 1 to 255, where 1 is the slowest time and 255 is the fastest.
	 *
	 * @param {Number[]} colorRange An array containing a range for each color value.
	 * colorRange[0] = range for Hue (0-255), colorRange[1] = range for Saturation, etc.
	 * @param {Number} speed The fade speed. Default value is 15.
	 */	
	this.fadeToRandomHSBColor = function(colorRange, speed) {
		speed = speed || -1;
		if (speed >= 0) {
			self.sendI2CRequest([I2CBase.WRITE, address, 0x66, speed]);
		}
		self.sendI2CRequest([I2CBase.WRITE, address, 0x48, colorRange[0], colorRange[1], colorRange[2]]);
	}

	/**
	 * Set the rate at which color fading happens. The range is from 1 to 255, where 1 is the
	 * slowest and 255 is the fastest (immediate).
	 *
	 * @param {Number} speed
	 */
	this.setFadeSpeed = function(speed) {
		self.sendI2CRequest([I2CBase.WRITE, address, 0x66, speed]);
	}
	
	/**
	 * Play a predefined light script. See the BlinkM datasheet page 20 for a list and 
	 * description of the predefined scripts.
	 *
	 * @param {Number} scriptId The id of the light script (from 0 to 18).
	 * @param {Number} theNumberOfRepeats The number of times the script should repeat.
	 * @param {Number} lineNumber The line number to begin the script from.
	 */
	this.playLightScript = function(scriptId, theNumberOfRepeats, lineNumber) {
		theNumberOfRepeats = theNumberOfRepeats || 1;
		self.sendI2CRequest([I2CBase.WRITE, address, 0x70, scriptId, theNumberOfRepeats, lineNumber]);
	}

	/**
	 * Stop the currently playing predefined light script.
	 */
	this.stopScript = function() {
		//self.sendI2CRequest([I2CBase.WRITE, address, 'o'.charCodeAt(0)]);
		self.sendI2CRequest([I2CBase.WRITE, address, 0x6F]);
	}

	/**
	 * @private
	 */
	this.handleI2C = function(command, data) {
		// TODO: implement if needed
		console.log("BlinkM: " + data);
	}
}

BlinkM.prototype = new I2CBase;
BlinkM.prototype.constructor = BlinkM;