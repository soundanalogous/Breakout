/**
 * @author jeff hoefs
 */

ARDJS.namespace('ARDJS.ui.Servo');

ARDJS.ui.Servo = (function() {

	var Servo;

	// dependencies
	var Pin = ARDJS.Pin;

	/**
	 * Creates a new Servo
	 *
	 * @constructor
	 * @param {Arduino} board A reference to the Arduino class instance.
	 * @param {Number} servoPin The number of the pin the servo is connected to.
	 */
	Servo = function(board, servoPin) {
		"use strict";
		
		this.className = "Servo"; 	// for testing

		this._pin = board.getDigitalPin(servoPin);
		this._angle;
		
		board.sendServoAttach(servoPin);
	}

	Servo.prototype = {

		// to do: make getters and setters and add documentation
		setAngle: function(value) {
			if (this._pin.type == Pin.SERVO) {
				this._angle = value;
				this._pin.value = this._angle;
			}
		},
		
		getAngle: function() {
			if (this._pin.type == Pin.SERVO) {
				return this._angle;
			}
		}		
	};

	return Servo;

}());
