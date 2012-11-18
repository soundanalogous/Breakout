/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.io.Stepper');

BO.io.Stepper = (function () {
    "use strict";

    var Stepper;
    var instanceCounter = 0;

    // private static constants
    var STEPPER = 0x72,
        CONFIG = 0,
        STEP = 1,
        MAX_STEPS = 2097151, // 21 bits (2^21 - 1)
        MAX_SPEED = 16383; // 14 bits (2^14 - 1)

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
     * Breakout/examples/actuators/stepper_2wire.html, stepper_4wire.html and
     * stepper_easydriver.html for example applications.
     *
     * @constructor
     * @param {IOBoard} board A reference to the IOBoard instance that the 
     * servo is attached to.
     * @param {Number} driverType. The type of driver (Stepper.DRIVER, 
     * Stepper.TWO_WIRE, or Stepper.FOUR_WIRE).
     * @param {Number} numStepsPerRev The number of steps to make 1 revolution. 
     * @param {Pin} directionPin If dirver interface, the pin used to control the direction.
     * If 2-wire or 4-wire interface, the 1st moter pin.
     * @param {Pin} stepPin If dirver interface, the pin used to control the steps.
     * If 2-wire or 4-wire interface, the 2nd moter pin.
     * @param {Pin} motorPin3 [optional] Only required for a 4-wire interface.
     * @param {Pin} motorPin4 [optional] Only required for a 4-wire interface.       
     */
    Stepper = function (board, driverType, numStepsPerRev, directionPin, stepPin, motorPin3, motorPin4) {
        
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
            this._board.sendSysex(STEPPER,
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
            this._board.sendSysex(STEPPER,
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
         * Move the stepper a given number of steps at the specified
         * speed (rad/sec), acceleration (rad/sec^2) and deceleration (rad/sec^2).
         * The accel and decel parameters are optional but if using, both values
         * must be passed to the function.
         *
         * @param {Number} numSteps The number ofsteps to move the motor (max = +/-2097151 (21 bits)).
         * Positive value is clockwise, negative value is counter clockwise.
         * @param {Number} speed Max speed in rad/sec (1 rad/sec = 9.549 RPM)
         * (max precision of 2 decimal places)
         * @param {Number} accel [optional] Acceleration in rad/sec^2 (max precision of 2 decimal places)
         * @param {Number} decel [optional] Deceleration in rad/sec^2 (max precision of 2 decimal places)
         */      
        step: function (numSteps, speed, accel, decel) {
            var steps,
                speedLSB,
                speedMSB,
                accelLSB,
                accelMSB,
                decelLSB,
                decelMSB,
                direction = Stepper.CLOCKWISE;

            if (numSteps > MAX_STEPS) {
                numSteps = MAX_STEPS;
                console.log("Warning: Maximum number of steps (2097151) exceeded. Setting to step number to 2097151");
            }
            if (numSteps < -MAX_STEPS) {
                numSteps = -MAX_STEPS;
                console.log("Warning: Maximum number of steps (-2097151) exceeded. Setting to step number to -2097151");
            }

            if (numSteps > 0) {
                direction = Stepper.COUNTER_CLOCKWISE;
            }

            steps = [
                Math.abs(numSteps) & 0x0000007F,
                (Math.abs(numSteps) >> 7) & 0x0000007F,
                (Math.abs(numSteps) >> 14) & 0x0000007F
            ];

            // the stepper interface expects decimal expressed an an integer
            speed = Math.floor(speed.toFixed(2) * 100);

            if (speed > MAX_SPEED) {
                speed = MAX_SPEED;
                console.log("Warning: Maximum speed (163.83 rad/sec) exceeded. Setting speed to 163.83 rad/sec");
            }                   

            speedLSB = speed & 0x007F;
            speedMSB = (speed >> 7) & 0x007F;

            // make sure both accel and decel are defined
            if (accel !== undefined && decel !== undefined) {
                // the stepper interface expects decimal expressed an an integer
                accel = Math.floor(accel.toFixed(2) * 100);
                decel = Math.floor(decel.toFixed(2) * 100);

                accelLSB = accel & 0x007F;
                accelMSB = (accel >> 7) & 0x007F;

                decelLSB = decel & 0x007F;
                decelMSB = (decel >> 7) & 0x007F;               
                            
                this._board.sendSysex(STEPPER, 
                                        [STEP,
                                        this._id,
                                        direction,                              
                                        steps[0],
                                        steps[1],
                                        steps[2],
                                        speedLSB,
                                        speedMSB,
                                        accelLSB,
                                        accelMSB,
                                        decelLSB,
                                        decelMSB
                                        ]);
            } else {
                // don't send accel and decel values
                this._board.sendSysex(STEPPER, 
                                        [STEP,
                                        this._id,
                                        direction,                                  
                                        steps[0],
                                        steps[1],
                                        steps[2],
                                        speedLSB,
                                        speedMSB
                                        ]);             
            }
        },

        /**
         * Listen for stepping complete event
         *
         * @private
         */
        onSysExMessage: function (event) {
            var message = event.message;

            if (message[0] !== STEPPER) {
                return;
            } else if (message[1] !== this._id) {
                return;
            } else {
                this.dispatchEvent(new Event(Event.COMPLETE));
            }
        },

        /**
         * @return {Number} The id of the Stepper object instance
         */
        get id() {
            return this._id;
        },

        /* implement EventDispatcher */
        
        /**
         * @param {String} type The event type
         * @param {Function} listener The function to be called when the event is fired
         */
        addEventListener: function (type, listener) {
            this._evtDispatcher.addEventListener(type, listener);
        },
        
        /**
         * @param {String} type The event type
         * @param {Function} listener The function to be called when the event is fired
         */
        removeEventListener: function (type, listener) {
            this._evtDispatcher.removeEventListener(type, listener);
        },
        
        /**
         * @param {String} type The event type
         * return {boolean} True is listener exists for this type, false if not.
         */
        hasEventListener: function (type) {
            return this._evtDispatcher.hasEventListener(type);
        },
        
        /**
         * @param {Event} type The Event object
         * @param {Object} optionalParams Optional parameters to assign to the event object.
         * return {boolean} True if dispatch is successful, false if not.
         */     
        dispatchEvent: function (event, optionalParams) {
            return this._evtDispatcher.dispatchEvent(event, optionalParams);
        }           
    
    };

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
