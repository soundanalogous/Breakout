/**
 * @author jeff hoefs
 */

/**
 * Creates a new Servo
 *
 * @constructor
 * @param {Arduino} board A reference to the Arduino class instance.
 * @param {Number} servoPin The number of the pin the servo is connected to.
 */
function Servo(board, servoPin) {
	"use strict";
	
	var _pin = board.getDigitalPin(servoPin);
	var _angle;
	var self = this;
	
	this.className = "Servo"; 	// for testing
	
	board.sendServoAttach(servoPin);
	
	this.setAngle = function(value) {
		if (_pin.type == Pin.SERVO) {
			_angle = value;
			_pin.setValue(_angle);
		}
	}
	
	this.getAngle = function() {
		if (_pin.type == Pin.SERVO) {
			return _angle;
		}
	}
	
}
