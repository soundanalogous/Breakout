 /**
 * Based on DCMotor.as originally written in as3.
 * Copyright (c) the Funnel development team
 * http://www.funnel.cc
 *
 * Ported to JavaScript by Jeff Hoefs
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 *
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.io.DCMotor');

BO.io.DCMotor = (function() {

	var DCMotor;

	// Dependencies
	var Pin = BO.Pin;

	/**
	 * H-bridge motor control.
	 * <p>Tested successfully with the following H-bridge: SN754410<br>
	 * Should also be compatible with the following:<br>
	 * SN754410<br>
	 * L293NE<br>
	 * TA7291P<br>
	 * TB6612FNG<br>
	 * BD621F</p>
	 *
	 * @exports DCMotor as BO.io.DCMotor
	 * @class Creates an interface to an H-bridge to control the
	 * direction of rotation of a motor shaft. You can rotate forward
	 * (clockwise), reverse or apply a brake. See 
	 * Breakout/examples/actuators/dcmotor.html for an example application.
	 * @constructor
	 * @param {IOBoard} board A reference to the IOBoard instance that the
	 * servo is attached to.
	 * @param {Pin} forwardPin A reference to the Pin connected to the forward
	 * control of the H-bridge.
	 * @param {Pin} reversePin A reference to the Pin connected to the reverse
	 * control of the H-bridge.
	 * @param {Pin} pwmPin A reference to the Pin connected to the pwm control
	 * of the H-bridge.
	 * @param {Number} minVoltage The minimum voltage (default = 1).
	 * @param {Number} maxVoltage The maximum voltage (default = 9).
	 * @param {Number} supplyVoltage The supply voltage (default = 9).
	 */
	DCMotor = function(board, forwardPin, reversePin, pwmPin, minVoltage, maxVoltage, supplyVoltage) {
		"use strict";
		
		this.name = "DCMotor";

		minVoltage = minVoltage || 1;
		maxVoltage = maxVoltage || 9;
		supplyVoltage = supplyVoltage || 9;
		if (pwmPin === undefined) pwmPin = null;		

		this._value = 0;
		this._offset = 0;
		this._range = 0;

		this._forwardPin = forwardPin;
		this._reversePin = reversePin;
		this._pwmPin = pwmPin;

		if (this._pwmPin !== null) {
			if (this._pwmPin.getCapabilities()[Pin.PWM]) {
				board.setDigitalPinMode(this._pwmPin.number, Pin.PWM);
			} else {
				console.log("warning: PWM is not available for the PWM pin");
				board.setDigitalPinMode(this._pwmPin.number, Pin.DOUT);
			}			
		}

		if (this._forwardPin.getCapabilities()[Pin.PWM]) {
			board.setDigitalPinMode(this._forwardPin.number, Pin.PWM);
		} else {
			console.log("warning: PWM is not available for the forward pin");
			board.setDigitalPinMode(this._forwardPin.number, Pin.DOUT);			
		}

		if (this._reversePin.getCapabilities()[Pin.PWM]) {
			board.setDigitalPinMode(this._reversePin.number, Pin.PWM);			
		} else {
			console.log("warning: PWM is not available for the reverse pin");
			board.setDigitalPinMode(this._reversePin.number, Pin.DOUT);
		}

		this._offset = (minVoltage / supplyVoltage);
		this._range = (maxVoltage - minVoltage) / supplyVoltage;

		this.despin(false);

	};

	DCMotor.prototype = {

		/**
		 * The value of the motor speed (-1.0 to 1.0). A speed of zero stops
		 * the motor.
		 * 
		 * @name DCMotor#value
		 * @property
		 * @type Number
		 */ 
		set value(val) {
			this._value = Math.max(-1, Math.min(1, val));

			if (val > 0) {
				this.forward(this._value);
			} else if (val < 0) {
				this.reverse(-this._value);
			} else {
				this.despin();
			}
		},
		get value() {
			return this._value;
		},
		
		/**
		 * @param {Boolean} useBrake Default = true
		 */
		despin: function(useBrake) {
			if (useBrake === undefined) useBrake = true;

			if (useBrake) {
				if (this._pwmPin === null) {
					this._forwardPin.value = 1;
					this._reversePin.value = 1;
				} else {
					this._forwardPin.value = 1;
					this._reversePin.value = 1;
					this._pwmPin.value = 1;
				}
			} else {
				if (this._pwmPin ===null) {
					this._forwardPin.value = 0;
					this._reversePin.value = 0;
				} else {
					this._forwardPin.value = 0;
					this._reversePin.value = 0;
					this._pwmPin.value = 0;
				}
			}
			this._value = 0;
		},
		
		/**
		 * @param {Number} val The new voltage to set (0.0 to 1.0)
		 */		
		forward: function(val) {
			val = val || 1;
			this._value = Math.max(0, Math.min(1, val));

			if (this._pwmPin === null) {
				this._forwardPin.value = Math.max(0, Math.min(1, this._value * this._range + this._offset));
				this._reversePin.value = 0;
			} else {
				this._forwardPin.value = 1;
				this._reversePin.value = 0;
				this._pwmPin.value = Math.max(0, Math.min(1, this._value * this._range + this._offset));
			}
		},

		/**
		 * @param {Number} val The new voltage to set (-1.0 to 0.0)
		 */
		reverse: function(val) {
			val = val || 1;
			this._value = Math.max(0, Math.min(1, val)) * -1;

			if (this._pwmPin === null) {
				this._forwardPin.value = 0;
				this._reversePin.value =  Math.max(0, Math.min(1, (this._value * this._range) * -1 + this._offset));
			} else {
				this._forwardPin.value = 0;
				this._reversePin.value = 1;
				this._pwmPin.value = Math.max(0, Math.min(1, (this._value * this._range) * -1 + this._offset));
			}
		}		
			
	};

	return DCMotor;

}());
