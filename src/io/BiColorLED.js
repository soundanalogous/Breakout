 /**
 * Based on RGBLED.js which was written by Jeff Hoefs.
 *
 * Copyright (c) 2012-2013 Fabian Affolter <mail@fabian-affolter.ch>
 *
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.io.BiColorLED');

BO.io.BiColorLED = (function () {

	var BiColorLED;

	// Dependencies
	var Pin = BO.Pin,
		LED = BO.io.LED;

	/**
	 * The two pins of the bi-color LED must be connected to PWM pins
	 * on the IOBoard.
	 *
	 * <p>COMMON_ANODE vs COMMON_CATHODE. You can determine if your
	 * LED is common anode or common cathode by reading the datasheet. 
	 * To wire a common cathode LED, connect the cathode to ground
	 * and the 2 anode pins to the IOBoard PWM pins via resistors. For
	 * a common anode LED, the anode is connected to power and the 2 
	 * cathode pins are connected to the IOBoard PWM pins via two 
	 * resistors.</p>
	 *
	 * @exports BiColorLED as BO.io.BiColorLED
	 * @class Creates an interface to an bi-color LED. This interface
	 * is for the type of bi-color LED with 3 legs. One leg is connected
	 * to power or ground (depending on the type of LED - common anode
	 * or common cathode) and the other 2 legs are connected to PWM pins
	 * on the I/O board. See Breakout/examples/schematics.pdf for wiring
	 * diagrams. See Breakout/examples/getting_started/duo_led.html
	 * for an example application.
	 * @constructor
	 * @param {IOBoard} board A reference to the IOBoard instance that
	 * the LED is attached to.
	 * @param {Pin} color1LEDPin A reference to the IOBoard Pin the
	 * first color LED pin is connected to.
	 * @param {Pin} color2LEDPin A reference to the IOBoard Pin the
	 * second color LED pin is connected to.
	 * @param {Number} driveMode The drive mode of the LED. Must be
	 * set to BiColorLED.COMMON_ANODE or BiColorLED.COMMON_CATHODE.
	 * BiColorLED.COMMON_ANODE is default.
	 */
	BiColorLED = function (board, color1LEDPin, color2LEDPin, driveMode) {
		"use strict";
		
		this.name = "BiColorLED";

		if (driveMode === undefined) {
            driveMode = BiColorLED.COMMON_ANODE;
        }

		this._color1LED = new LED(board, color1LEDPin, driveMode);
		this._color2LED = new LED(board, color2LEDPin, driveMode);
	};

	BiColorLED.prototype = {
	
	    constructor: BiColorLED,

		/**
		 * Set the bi-color LED color.
		 * 
		 * @param {Number} color1 The value (0 - 255) of the first color
		 * @param {Number} color2 The value (0 - 255) of the second
		 * color
		 */
		setColor: function (color1, color2) {
			color1 = color1 / 255;
			color2 = color2 / 255;

			this._color1LED.intensity = color1;
			this._color2LED.intensity = color2;
		},

		/**
		 * Fade in the bi-color LED from the off state.
		 * 
		 * @param {Number} time The time of the fade (in milliseconds)
		 */
		fadeIn: function (time) {
			time = time || 1000;
			this._color1LED.fadeTo(1, time);
			this._color2LED.fadeTo(1, time);
		},

		/**
		 * Fade out the bi-color LED from the on state.
		 * 
		 * @param {Number} time The time of the fade (in milliseconds)
		 */
		fadeOut: function (time) {
			time = time || 1000;
			this._color1LED.fadeTo(0, time);
			this._color2LED.fadeTo(0, time);
		},

		/**
		 * Fade from the current color to the new color.
		 * 
		 * @param {Number} color1 The value of the first color to fade
		 * to (0 - 255)
		 * @param {Number} color2 The value of the second color to fade
		 * to (0 - 255)
		 * @param {Number} time The time of the fade (in milliseconds)		 
		 */		
		fadeTo: function (color1, color2, time) {
			color1 = color1 / 255;
			color2 = color2 / 255;
			time = time || 1000;

			this._color1LED.fadeTo(color1, time);
			this._color2LED.fadeTo(color2, time);
		}
	};

	/** @constant */
	BiColorLED.COMMON_ANODE = LED.SYNC_DRIVE;
	/** @constant */
	BiColorLED.COMMON_CATHODE = LED.SOURCE_DRIVE;				

	return BiColorLED;

}());
