 /**
 * Based on BlinkM.as originally written in as3.
 * Copyright (c) the Funnel development team
 * http://www.funnel.cc
 *
 * Ported to JavaScript by Jeff Hoefs
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 *
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.io.BlinkM');

BO.io.BlinkM = (function() {

	var BlinkM;

	// dependencies
	var I2CBase = BO.I2CBase;

	/**
	 * Creates and BlinkM object.
	 *
	 * @exports BlinkM as BO.io.BlinkM
	 * @class Creates an interface to a BlinkM RGB Led module. This
	 * object allows you to change the color of the led, fade between
	 * colors and run preprogrammed light scripts.
	 * See Breakout/examples/actuators/blinkM.html for an example application.
	 * @constructor
	 * @augments BO.I2CBase 
	 * @param {IOBoard} board The IOBoard instance
	 * @param {Number} address The i2c address of the BlinkM module
	 */
	BlinkM = function(board, address) {

		address = address || 0x09;	// default i2c address for BlinkM

		this.name = "BlinkM";
		
		// call super class
		I2CBase.call(this, board, address);
		

	};

	BlinkM.prototype = JSUTILS.inherit(I2CBase.prototype);
	BlinkM.prototype.constructor = BlinkM;


	/**
	 * Sets the BlinkM to the specified RGB color immediately.
	 * @param {Number{}} color An array containing the RGB values. 
	 * color[0] = R, color[1] = G, color[2] = B
	 */
	BlinkM.prototype.goToRGBColorNow = function(color) {
		this.sendI2CRequest([I2CBase.WRITE, this.address, 0x6E, color[0], color[1], color[2]]);
	};
	
	/**
	 * Fades to the specified RGB color in the specified time duration. 
	 * The fade speed range is from 1 to 255, where 1 is the slowest time and
	 * 255 is the fastest.
	 *
	 * @param {Number[]} color An array containing the RGB values.
	 * color[0] = R, color[1] = G, color[2] = B
	 * @param {Number} speed The fade speed. Default value is 15.
	 */
	BlinkM.prototype.fadeToRGBColor = function(color, speed) {
		var speed = speed || -1;
		if (speed >= 0) {
			this.sendI2CRequest([I2CBase.WRITE, this.address, 0x66, speed]);
		}
		this.sendI2CRequest([I2CBase.WRITE, this.address, 0x63, color[0], color[1], color[2]]);
	};

	/**
	 * Fade to a random RGB color.
	 * The fade speed range is from 1 to 255, where 1 is the slowest time and
	 * 255 is the fastest.
	 *
	 * @param {Number[]} colorRange An array containing a range for each color
	 * value.
	 * colorRange[0] = range for Red (0-255), colorRange[1] = range for Green, etc.
	 * @param {Number} speed The fade speed. Default value is 15.
	 */
	BlinkM.prototype.fadeToRandomRGBColor = function (colorRange, speed) {
		var speed = speed || -1;
		if (speed >= 0) {
			this.sendI2CRequest([I2CBase.WRITE, this.address, 0x66, speed]);
		}
		this.sendI2CRequest([I2CBase.WRITE, this.address, 0x43, colorRange[0], colorRange[1], colorRange[2]]);
	};

	/**
	 * Fades to the specified HSB color in the specified time duration. 
	 * The fade speed range is from 1 to 255, where 1 is the slowest time and
	 * 255 is the fastest.
	 *
	 * @param {Number[]} color An array containing the HSB values.
	 * color[0] = H, color[1] = S, color[2] = B
	 * @param {Number} speed The fade speed. Default value is 15.
	 */
	BlinkM.prototype.fadeToHSBColor = function(color, speed) {
		var speed = speed || -1;
		if (speed >= 0) {
			this.sendI2CRequest([I2CBase.WRITE, this.address, 0x66, speed]);
		}
		this.sendI2CRequest([I2CBase.WRITE, this.address, 0x68, color[0], color[1], color[2]]);
	};
	
	/**
	 * Fade to a random HSB color.
	 * The fade speed range is from 1 to 255, where 1 is the slowest time and
	 * 255 is the fastest.
	 *
	 * @param {Number[]} colorRange An array containing a range for each color
	 * value.
	 * colorRange[0] = range for Hue (0-255), colorRange[1] = range for
	 * Saturation, etc.
	 * @param {Number} speed The fade speed. Default value is 15.
	 */	
	BlinkM.prototype.fadeToRandomHSBColor = function(colorRange, speed) {
		var speed = speed || -1;
		if (speed >= 0) {
			this.sendI2CRequest([I2CBase.WRITE, this.address, 0x66, speed]);
		}
		this.sendI2CRequest([I2CBase.WRITE, this.address, 0x48, colorRange[0], colorRange[1], colorRange[2]]);
	};

	/**
	 * Set the rate at which color fading happens. The range is from 1 to 255,
	 * where 1 is the slowest and 255 is the fastest (immediate).
	 *
	 * @param {Number} speed
	 */
	BlinkM.prototype.setFadeSpeed = function(speed) {
		this.sendI2CRequest([I2CBase.WRITE, this.address, 0x66, speed]);
	};
	
	/**
	 * Play a predefined light script. See the BlinkM datasheet page 20 for a
	 * list and description of the predefined scripts.
	 *
	 * @param {Number} scriptId The id of the light script (from 0 to 18).
	 * @param {Number} theNumberOfRepeats The number of times the script should
	 * repeat.
	 * @param {Number} lineNumber The line number to begin the script from.
	 */
	BlinkM.prototype.playLightScript = function(scriptId, theNumberOfRepeats, lineNumber) {
		var theNumberOfRepeats = theNumberOfRepeats || 1;
		this.sendI2CRequest([I2CBase.WRITE, this.address, 0x70, scriptId, theNumberOfRepeats, lineNumber]);
	};

	/**
	 * Stop the currently playing predefined light script.
	 */
	BlinkM.prototype.stopScript = function() {
		//self.sendI2CRequest([I2CBase.WRITE, this.address, 'o'.charCodeAt(0)]);
		this.sendI2CRequest([I2CBase.WRITE, this.address, 0x6F]);
	};

	/**
	 * @private
	 */
	BlinkM.prototype.handleI2C = function(data) {
		// TODO: implement if needed
		console.log("BlinkM: " + data);
	};

	return BlinkM;

}());
