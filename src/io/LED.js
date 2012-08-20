 /**
 * Based on LED.as originally written in as3.
 * Copyright (c) the Funnel development team
 * http://www.funnel.cc
 *
 * Ported to JavaScript by Jeff Hoefs
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 *
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.io.LED');

BO.io.LED = (function() {

	var LED;

	// Dependencies
	var Pin = BO.Pin;
	var Oscillator = BO.generators.Oscillator;

	/**
	 * <p>PLEASE NOTE: To use the fade methods, or to use an waveform other 
	 * than Oscillator.SQUARE the LED must be connected to a PWM pin.</p>
	 *
	 * <p>SOURCE_DRIVE vs SYNC_DRIVE. If the Anode (longer LED pin) is
	 * connected to the microcontroller pin, then it is SOURCE_DRIVE. If the
	 * Cathode is connected to the microcontroller pin, then it is 
	 * SYNC_DRIVE.</p>
	 *
	 * @exports LED as BO.io.LED
	 * @class Creates an interface to an LED. This object provides helpful
	 * methods for blinking and fading LEDs. To use the fading methods, the
	 * LED must be connected to a PWM pin on the I/O board.
	 * @param {IOBoard} board A reference to the IOBoard the LED is attached to.
	 * @param {Pin} ledPin A reference to the Pin the LED is connected to.
	 * @param {Number} driveMode The drive mode of the LED. Must be set to
	 * LED.SOURCE_MODE or LED.SYNC_MODE. SOURCE_MODE is default.
	 */
	LED = function(board, ledPin, driveMode) {
		"use strict";
		
		this.name = "LED";

		this._driveMode = driveMode || LED.SOURCE_DRIVE;
		this._pin = ledPin;
		this._onValue = 1;
		this._offValue = 0;
		this._supportsPWM;

		if (this._driveMode === LED.SOURCE_DRIVE) {
			this._onValue = 1;
			this._offValue = 0;
		} else if (this._driveMode === LED.SYNC_DRIVE) {
			this._onValue = 0;
			this._offValue = 1;
		} else {
			throw "driveMode should be LED.SOURCE_DRIVE or LED.SYNC_DRIVE";
		}

		// If the pin supports PWM, set PWM mode else set DOUT mode
		if (this._pin.getCapabilities()[Pin.PWM]) {
			board.setDigitalPinMode(this._pin.number, Pin.PWM);
			this._supportsPWM = true;
		} else {
			board.setDigitalPinMode(this._pin.number, Pin.DOUT);
			this._supportsPWM = false;
		}

		// Start in the off state
		this.off();
	};

	LED.prototype = {

		/**
		 * Get or set the current value (intensity) of the LED.
		 * 
		 * @name LED#intensity
		 * @property
		 * @type Number
		 */ 
		get intensity() {
			return this._pin.value;
		},
		set intensity(val) {
			// If the pin does not support PWM, force the value to 1 or 0
			if (!this._supportsPWM) {
				if (val < 0.5) val = 0;
				else val = 1;
			}

			if (this._driveMode === LED.SOURCE_DRIVE) {
				this._pin.value = val;
			} else if (this._driveMode === LED.SYNC_DRIVE) {
				this._pin.value = 1 - val;
			}
		},
		
		/**
		 * Turn the LED on.
		 */
		on: function() {
			this._pin.value = this._onValue;
		},

		/**
		 * Turn the LED off.
		 */
		off: function() {
			this._pin.value = this._offValue;
		},

		/**
		 * Check if the LED is on.
		 * 
		 * @return {Boolean} True if the LED is on, false if it is off.
		 */
		isOn: function() {
			return this._pin.value === this._onValue;
		},

		/**
		 * Toggle the LED on or off
		 */
		toggle: function() {
			this._pin.value = 1 - this._pin.value;
		},

		/**
		 * @param {Number} interval The time interval to blink the LED.
		 * @param {Number} times The number of times the LED should blink.
		 * A value of 0 will blink forever.
		 * @param {Function} wave The waveform to apply (default is Oscillator.SQUARE)
		 * @see BO.generator.Oscillator
		 */
		blink: function(interval, times, wave) {
			var freq = 1000 / interval;
			times = times || 0;
			wave = wave || Oscillator.SQUARE;

			if (!this._supportsPWM && wave !== Oscillator.SQUARE) {
				console.log("warning: Only Oscillator.SQUARE may be used on a non-PWM pin.");
				console.log("debug: Setting wave to Oscillator.SQUARE.");
				wave = Oscillator.SQUARE;
			}

			//var osc = new Oscillator(wave, freq, 1, 0, 0, times);
			this._pin.addGenerator(new Oscillator(wave, freq, 1, 0, 0, times));
			//osc.start();
			this._pin.generator.start();
		},

		/**
		 * Stop the LED blink cycle.
		 */
		stopBlinking: function() {
			if (this._pin.generator !== null) {
				this._pin.generator.stop();
			}
			this.off();
		},

		/**
		 * The LED must be connected to a PWM pin to use this method.
		 *
		 * @param {Number} time The fade-in time (in milliseconds).
		 */
		fadeIn: function(time) {
			this.fadeTo(this._onValue, time);
		},

		/**
		 * The LED must be connected to a PWM pin to use this method.
		 *
		 * @param {Number} time The fade-out time (in milliseconds).
		 */
		fadeOut: function(time) {
			this.fadeTo(this._offValue, time);
		},

		/**
		 * The LED must be connected to a PWM pin to use this method.
		 *		
		 * @param {Number} to The new intensity value to fade to.
		 * @param {Number} time The fade time (in milliseconds).
		 */
		fadeTo: function(to, time) {

			if (!this._supportsPWM) {
				console.log("warning: Fade methods can only be used for LEDs connected to PWM pins.")
				return;
			}

			if (this._driveMode === LED.SYNC_DRIVE) {
				to = 1 - to;
			}

			time = time || 1000;
			var freq = 1000 / time;
			if (this._pin.value !== to) {
				this._pin.addGenerator(new Oscillator(Oscillator.LINEAR, freq, to - this._pin.value, this._pin.value, 0, 1));
				this._pin.generator.start();
			} else {
				this._pin.removeGenerator();
			}		
		}	
	};

	LED.SOURCE_DRIVE = 0;
	LED.SYNC_DRIVE = 1;

	return LED;
}());
