/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.io.Stepper');

BO.io.Stepper = (function() {
	"use strict";

	var Stepper;
	var instanceCounter = 0;

	// private static constants
	var CONFIG = 0,
		STEP = 1,
		SPEED = 2,
		MAX_STEPS = 16383,
		MAX_SPEED = 16383;

	// dependencies
	var Pin = BO.Pin,
		EventDispatcher = JSUTILS.EventDispatcher,
		Event = JSUTILS.Event,
		IOBoardEvent = BO.IOBoardEvent;

	/**
	 * Creates a new Stepper.
	 *
	 * @exports Stepper as BO.io.Stepper
	 * @class Creates an interface to a Stepper motor. Use this object to set
	 * the direction and number of steps for the motor to rotate. See
	 * Breakout/examples/actuators/stepper.html for an example application.
	 * @constructor
	 * @param {IOBoard} board A reference to the IOBoard instance that the 
	 * servo is attached to.
	 * @param {Number} driverType. The type of driver (Stepper.DRIVER, 
	 * Stepper.TWO_WIRE, or Stepper.FOUR_WIRE).
	 * @param {Number} numStepsPerRev The number of steps to make 1 revolution. 
	 * @param {Pin} directionPin If dirver interface, the pin used to control the direction.
	 * If 2-wire interface, the 1st moter pin.
	 * @param {Pin} stepPin If dirver interface, the pin used to control the steps.
	 * If 2-wire interface, the 2nd moter pin.
	 * @param {Pin} motorPin3 [optional] Only required for a 4-wire interface.
	 * @param {Pin} motorPin4 [optional] Only required for a 4-wire interface.	 	 
	 */
	Stepper = function(board, driverType, numStepsPerRev, directionPin, stepPin, motorPin3, motorPin4) {
		"use strict";
		
		// create a new id each time a new instance is created
		this._id = instanceCounter++;
		if (this._id > 5) {
			console.log("Warning: A maximum of 6 Stepper instances can be created");
			return;
		}

		this.name = "Stepper";
		this._board = board;
		this._evtDispatcher = new EventDispatcher(this);

		var numStepsPerRevLSB = numStepsPerRev & 0x007F,
			numStepsPerRevMSB = (numStepsPerRev >> 7) & 0x007F;

		this._board.setDigitalPinMode(directionPin.number, Pin.DOUT);
		this._board.setDigitalPinMode(stepPin.number, Pin.DOUT);

		this._board.addEventListener(IOBoardEvent.SYSEX_MESSAGE, this.onSysExMessage.bind(this));
		
		switch (driverType) {
			case Stepper.DRIVER:
			case Stepper.TWO_WIRE:
				// configure the stepper motor
				this._board.sendSysex(Stepper.STEPPER,
												[CONFIG,
												this._id,
												driverType,
												numStepsPerRevLSB, 
												numStepsPerRevMSB,
												directionPin.number,
												stepPin.number]);
				break;
			case Stepper.FOUR_WIRE:
				this._board.setDigitalPinMode(motorPin3.number, Pin.DOUT);
				this._board.setDigitalPinMode(motorPin4.number, Pin.DOUT);

				// configure the stepper motor
				this._board.sendSysex(Stepper.STEPPER,
												[CONFIG,
												this._id,
												driverType,
												numStepsPerRevLSB, 
												numStepsPerRevMSB,
												directionPin.number,
												stepPin.number,
												motorPin3.number,
												motorPin4.number]);
				break;
		}

	};

	Stepper.prototype = {

		/**
		 * Number of steps in specified direction.
		 *
		 * @param {Number} numSteps The number of steps (max = +/-16,384).
		 * Positive value is clockwise, negative value is counter clockwise.
		 */
		step: function(numSteps) {
			var numStepsLSB = Math.abs(numSteps) & 0x007F,
				numStepsMSB = (Math.abs(numSteps) >> 7) & 0x007F,
				direction = Stepper.CLOCKWISE;		

			if (numSteps > MAX_STEPS) {
				numSteps = MAX_STEPS;
				console.log("Warning: Maximum number of steps (16383) exceeded. Setting to step number to 16,384");
			}
			if (numSteps < -MAX_STEPS) {
				numSteps = -MAX_STEPS;
				console.log("Warning: Maximum number of steps (-16383) exceeded. Setting to step number to -16,384");
			}

			if (numSteps > 0) {
				direction = Stepper.COUNTER_CLOCKWISE;
			}

			this._board.sendSysex(Stepper.STEPPER, 
											[STEP,
											this._id,
											numStepsLSB,
											numStepsMSB,
											direction]);
		},

		/**
		 * Set the stepper speed
		 *
		 * @param {Number} speed The spped in revolutions per minute (max = 16,384)
		 * (0 = counter clockwise, 1 = clockwise).
		 */
		setSpeed: function(speed) {
			var speedLSB = speed & 0x007F,
				speedMSB = (speed >> 7) & 0x007F;

			if (speed > MAX_SPEED) {
				speed = MAX_SPEED;
				// TO DO: determin what the absolute max is when using stepper with Firmata.
				// It's likely far less that 16384 rpm
				console.log("Warning: Maximum speed (16,383) exceeded. Setting speed to 16,384 RPM");
			}					

			this._board.sendSysex(Stepper.STEPPER, 
											[SPEED,
											this._id,
											speedLSB,
											speedMSB]);
		},			

		/**
		 * Listen for stepping complete event
		 *
		 * @private
		 */
		onSysExMessage: function(event) {
			var message = event.message;

			if (message[0] !== Stepper.STEPPER) {
				return;
			} else if (message[1] !== this._id) {
				return;
			} else {
				this.dispatchEvent(new Event(Event.COMPLETE));
			}
		},

		/* implement EventDispatcher */
		
		/**
		 * @param {String} type The event type
		 * @param {Function} listener The function to be called when the event is fired
		 */
		addEventListener: function(type, listener) {
			this._evtDispatcher.addEventListener(type, listener);
		},
		
		/**
		 * @param {String} type The event type
		 * @param {Function} listener The function to be called when the event is fired
		 */
		removeEventListener: function(type, listener) {
			this._evtDispatcher.removeEventListener(type, listener);
		},
		
		/**
		 * @param {String} type The event type
		 * return {boolean} True is listener exists for this type, false if not.
		 */
		hasEventListener: function(type) {
			return this._evtDispatcher.hasEventListener(type);
		},
		
		/**
		 * @param {Event} type The Event object
		 * @param {Object} optionalParams Optional parameters to assign to the event object.
		 * return {boolean} True if dispatch is successful, false if not.
		 */		
		dispatchEvent: function(event, optionalParams) {
			return this._evtDispatcher.dispatchEvent(event, optionalParams);
		}			
	
	};

	/** @constant */
	Stepper.STEPPER	= 0x72;
	/** @constant */
	Stepper.CLOCKWISE = 0;
	/** @constant */
	Stepper.COUNTER_CLOCKWISE = 1;
	/** @constant */
	Stepper.DRIVER = 1;
	/** @constant */
	Stepper.TWO_WIRE = 2;
	/** @constant */
	Stepper.FOUR_WIRE = 4;				

	return Stepper;

})();
