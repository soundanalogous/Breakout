/**
 * @author jeff hoefs
 */

BREAKOUT.namespace('BREAKOUT.io.Servo');

BREAKOUT.io.Servo = (function() {

	var Servo;

	// dependencies
	var Pin = BREAKOUT.Pin;

	/**
	 * Creates a new Servo
	 *
	 * @exports Servo as BREAKOUT.io.Servo
	 * @constructor
	 * @param {IOBoard} board A reference to the IOBoard instance that the servo is attached to.
	 * @param {Pin} servoPin A reference to the Pin the servo is connected to.
	 */
	Servo = function(board, servoPin) {
		"use strict";
		
		this.name = "Servo"; // for testing

		this._pin = board.getDigitalPin(servoPin);
		//this._pin = servoPin
		this._angle;
		
		board.sendServoAttach(servoPin);
	}

	Servo.prototype = {

		/**
		 * Set the angle (in degrees) to rotate the server head to.
		 * @name Servo#angle
		 * @property
		 * @type Number
		 */ 
		set angle(value) {
			if (this._pin.type == Pin.SERVO) {
				this._angle = value;
				this._pin.value = this._angle;
			}
		},
		get angle() {
			if (this._pin.type == Pin.SERVO) {
				return this._angle;
			}
		}		
	};

	return Servo;

}());
