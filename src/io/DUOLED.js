 /**
 * Based on RGBLED.js originally written by Jeff Hoefs.
 *
 * Copyright (c) 2012 Fabian Affolter <mail@fabian-affolter.ch>
 *
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.io.DUOLED');

BO.io.DUOLED = (function() {

	var DUOLED;

	// Dependencies
	var Pin = BO.Pin,
		LED = BO.io.LED;

	/**
	 * The two pins of the Duo LED must be connected to PWM pins on
	 * the IOBoard.
	 *
	 * <p>COMMON_ANODE vs COMMON_CATHODE. You can determine if your Duo
	 * LED is common anode or common cathode by reading the datasheet. 
	 * To wire a common cathode Duo LED, connect the cathode to ground
	 * and the 2 anode pins to the IOBoard PWM pins via resistors. For
	 * a common anode LED, the anode is connected to power and the 2 
	 * cathode pins are connected to the IOBoard PWM pins via two 
	 * resistors.</p>
	 *
	 * @exports DUOLED as BO.io.DUOLED
	 * @class Creates an interface to an Duo LED. This interface is for
	 * the type of Duo LED with 3 legs. One leg is connected to power
	 * or ground (depending on the type of LED - common anode or common
	 * cathode) and the other 2 legs are connected to PWM pins on the
	 * I/O board. See Breakout/examples/schematics.pdf for wiring
	 * diagrams. See Breakout/examples/getting_started/duo_led.html
	 * for an example application.
	 * @constructor
	 * @param {IOBoard} board A reference to the IOBoard instance that
	 * the servo is attached to.
	 * @param {Pin} redLEDPin A reference to the IOBoard Pin the red
	 * LED pin is connected to.
	 * @param {Pin} greenLEDPin A reference to the IOBoard Pin the
	 * green LED pin is connected to.
	 * @param {Number} driveMode The drive mode of the Duo LED. Must be
	 * set to DUOLED.COMMON_ANODE or DUOLED.COMMON_CATHODE.
	 * DUOLED.COMMON_ANODE is default.
	 */
	DUOLED = function(board, redLEDPin, greenLEDPin, driveMode) {
		"use strict";
		
		this.name = "DUOLED";

		if (driveMode === undefined) driveMode = DUOLED.COMMON_ANODE;

		this._redLED = new LED(board, redLEDPin, driveMode);
		this._greenLED = new LED(board, greenLEDPin, driveMode);
	};

	DUOLED.prototype = {

		/**
		 * Set the Duo LED color.
		 * 
		 * @param {Number} red The red value (0 - 255)
		 * @param {Number} green The green value (0 - 255)
		 */
		setColor: function(red, green) {
			red = red / 255;
			green = green / 255;

			this._redLED.intensity = red;
			this._greenLED.intensity = green;
		},

		/**
		 * Fade in the Duo LED from the off state.
		 * 
		 * @param {Number} time The time of the fade (in milliseconds)
		 */
		fadeIn: function(time) {
			time = time || 1000;
			this._redLED.fadeTo(1, time);
			this._greenLED.fadeTo(1, time);
		},

		/**
		 * Fade out the Duo LED from the on state.
		 * 
		 * @param {Number} time The time of the fade (in milliseconds)
		 */
		fadeOut: function(time) {
			time = time || 1000;
			this._redLED.fadeTo(0, time);
			this._greenLED.fadeTo(0, time);
		},

		/**
		 * Fade from the current color to the new color.
		 * 
		 * @param {Number} red The red value to fade to (0 - 255)
		 * @param {Number} green The green value to fade to (0 - 255)
		 * @param {Number} time The time of the fade (in milliseconds)		 
		 */		
		fadeTo: function(red, green, time) {
			red = red / 255;
			green = green / 255;
			time = time || 1000;

			this._redLED.fadeTo(red, time);
			this._greenLED.fadeTo(green, time);
		}
	};

	/** @constant */
	DUOLED.COMMON_ANODE = LED.SYNC_DRIVE;
	/** @constant */
	DUOLED.COMMON_CATHODE = LED.SOURCE_DRIVE;				

	return DUOLED;

}());
