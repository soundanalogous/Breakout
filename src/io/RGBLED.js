 /**
 * Based on RGBLED.as originally written in as3.
 * Copyright (c) the Funnel development team
 * http://www.funnel.cc
 *
 * Ported to JavaScript by Jeff Hoefs
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 *
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.io.RGBLED');

BO.io.RGBLED = (function() {

	var RGBLED;

	// Dependencies
	var Pin = BO.Pin,
		LED = BO.io.LED;

	/**
	 * The RGB pins of the RGBLED must be connected to PWM pins on the IOBoard.
	 *
	 * <p>COMMON_ANODE vs COMMON_CATHODE. You can determine if your RGB LED is 
	 * common anode or common cathode by reading the datasheet. To wire a 
	 * common cathode RGB LED, connect the cathode to ground and the 3 anode
	 * pins to the IOBoard PWM pins via 330 ohm resistors. For a common anode
	 * LED, the anode is connected to power and the 3 cathode pins are connected
	 * to the IOBoard PWM pins via 330 ohm resistors.</p>
	 *
	 * @exports RGBLED as BO.io.RGBLED
	 * @class Creates an interface to an RGB LED. This interface is for the
	 * type of RGB LED with 4 legs. One leg is connected to power or ground 
	 * (depending on the type of LED - common anode or common cathode) and the
	 * other 3 legs are connected to PWM pins on the I/O board. See 
	 * Breakout/examples/schematics.pdf for wiring diagrams. See 
	 * Breakout/examples/actuators/rgb_led.html for an example application.
	 * @constructor
	 * @param {IOBoard} board A reference to the IOBoard instance that the
	 * servo is attached to.
	 * @param {Pin} redLEDPin A reference to the IOBoard Pin the red LED pin
	 * is connected to.
	 * @param {Pin} greenLEDPin A reference to the IOBoard Pin the green LED
	 * pin is connected to.
	 * @param {Pin} blueLEDPin A reference to the IOBoard Pin the blue LED pin
	 * is connected to.	 
	 * @param {Number} driveMode The drive mode of the RGBLED. Must be set to
	 * RGBLED.COMMON_ANODE or RGBLED.COMMON_CATHODE. RGBLED.COMMON_ANODE is
	 * default.
	 */
	RGBLED = function(board, redLEDPin, greenLEDPin, blueLEDPin, driveMode) {
		"use strict";
		
		this.name = "RGBLED";

		if (driveMode === undefined) driveMode = RGBLED.COMMON_ANODE;

		this._redLED = new LED(board, redLEDPin, driveMode);
		this._greenLED = new LED(board, greenLEDPin, driveMode);
		this._blueLED = new LED(board, blueLEDPin, driveMode);
	};

	RGBLED.prototype = {

		/**
		 * Set the RGBLED color.
		 * 
		 * @param {Number} red The red value (0 - 255)
		 * @param {Number} green The green value (0 - 255)
		 * @param {Number} blue The blue value (0 - 255)
		 */
		setColor: function(red, green, blue) {
			red = red / 255;
			green = green / 255;
			blue = blue / 255;

			this._redLED.intensity = red;
			this._greenLED.intensity = green;
			this._blueLED.intensity = blue;
		},

		/**
		 * Fade in the RGBLED from the off state.
		 * 
		 * @param {Number} time The time of the fade (in milliseconds)
		 */
		fadeIn: function(time) {
			time = time || 1000;
			this._redLED.fadeTo(1, time);
			this._greenLED.fadeTo(1, time);
			this._blueLED.fadeTo(1, time);
		},

		/**
		 * Fade out the RGBLED from the on state.
		 * 
		 * @param {Number} time The time of the fade (in milliseconds)
		 */
		fadeOut: function(time) {
			time = time || 1000;
			this._redLED.fadeTo(0, time);
			this._greenLED.fadeTo(0, time);
			this._blueLED.fadeTo(0, time);			
		},

		/**
		 * Fade from the current color to the new color.
		 * 
		 * @param {Number} red The red value to fade to (0 - 255)
		 * @param {Number} green The green value to fade to (0 - 255)
		 * @param {Number} blue The blue value to fade to (0 - 255)
		 * @param {Number} time The time of the fade (in milliseconds)		 
		 */		
		fadeTo: function(red, green, blue, time) {
			red = red / 255;
			green = green / 255;
			blue = blue / 255;
			time = time || 1000;

			this._redLED.fadeTo(red, time);
			this._greenLED.fadeTo(green, time);
			this._blueLED.fadeTo(blue, time);
		}
	};

	/** @constant */
	RGBLED.COMMON_ANODE = LED.SYNC_DRIVE;
	/** @constant */
	RGBLED.COMMON_CATHODE = LED.SOURCE_DRIVE;				

	return RGBLED;

}());
