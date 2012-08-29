 /**
 * Based on Servo.as originally written in as3.
 * Copyright (c) the Funnel development team
 * http://www.funnel.cc
 *
 * Ported to JavaScript by Jeff Hoefs
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 *
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.io.Servo');

BO.io.Servo = (function() {

	var Servo;

	// dependencies
	var Pin = BO.Pin;

	/**
	 * Creates a new Servo.
	 *
	 * @exports Servo as BO.io.Servo
	 * @class Creates an interface to a Servo motor. Use this object to set
	 * the angle of the servo head. You can simply specify and angle between
	 * 0 and 180 degrees and the servo head will rotate to that angle. See
	 * Breakout/examples/actuators/servo.html for an example application.
	 * @constructor
	 * @param {IOBoard} board A reference to the IOBoard instance that the 
	 * servo is attached to.
	 * @param {Pin} servoPin A reference to the Pin the servo is connected to.
	 * @param {Number} minAngle The minimum angle the server can rotate to
	 * (default = 0).
	 * @param {Number} maxAngle The maximum angle the server can rotate to
	 * (default = 180).
	 */
	Servo = function(board, servoPin, minAngle, maxAngle) {
		"use strict";
		
		this.name = "Servo";

		this._pin = servoPin;
		this._angle;
		this._minAngle = minAngle || 0;
		this._maxAngle = maxAngle || 180;

		var pinNumber = servoPin.number;
		
		// sendServoAttach will set the pin mode to Pin.SERVO
		board.sendServoAttach(pinNumber);
	};

	Servo.prototype = {

		/**
		 * Set the angle (in degrees) to rotate the server head to.
		 * 
		 * @name Servo#angle
		 * @property
		 * @type Number
		 */ 
		set angle(value) {
			if (this._pin.getType() == Pin.SERVO) {
				this._angle = value;
				//this._pin.value = this._angle;
				this._pin.value = Math.max(0, Math.min(1, (this._angle - this._minAngle) / 
								(this._maxAngle - this._minAngle) * Servo.COEF_TO_0_180));

			}
		},
		get angle() {
			if (this._pin.getType() == Pin.SERVO) {
				return this._angle;
			}
		}		
	};

	/**
	 * The scale to convert 0-1 (0-255 in 8bit) to 0-0.706 (0-180 in 8bit).
	 */
	Servo.COEF_TO_0_180 = 180 / 255;

	return Servo;

}());
