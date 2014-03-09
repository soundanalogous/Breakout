/**
 * Copyright (c) 2011-2014 Jeff Hoefs <soundanalogous@gmail.com>
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
     * Creates an interface to a Stepper motor. Use this object to set
     * the direction and number of steps for the motor to rotate. See
     * [Breakout/examples/actuators/stepper\_2wire.html](https://github.com/soundanalogous/Breakout/blob/master/examples/actuators/stepper_2wire.html), 
     * [stepper\_4wire.html](https://github.com/soundanalogous/Breakout/blob/master/examples/actuators/stepper_4wire.html), 
     * [stepper\_easydriver.html](https://github.com/soundanalogous/Breakout/blob/master/examples/actuators/stepper_easydriver.html) 
     * and [stepper\_simple.html](https://github.com/soundanalogous/Breakout/blob/master/examples/actuators/stepper_simple.html) for example applications.
     *
     * @class Stepper
     * @constructor
     * @uses JSUTILS.EventDispatcher
     * @param {IOBoard} board A reference to the IOBoard instance that the 
     * stepper is attached to.
     * @param {Number} driverType. The type of driver (`Stepper.DRIVER`,
     * `Stepper.DRIVER_HIGH_CURRENT, `Stepper.TWO_WIRE`, or
     * `Stepper.FOUR_WIRE`).
     * @param {Number} numStepsPerRev The number of steps to make 1 revolution. 
     * @param {Pin} directionPin If dirver interface, the pin used to control 
     * the direction.
     * If 2-wire or 4-wire interface, the 1st moter pin.
     * @param {Pin} stepPin If dirver interface, the pin used to control the 
     * steps.
     * If 2-wire or 4-wire interface, the 2nd moter pin.
     * @param {Pin} motorPin3 [optional] Only required for a 4-wire interface.
     * @param {Pin} motorPin4 [optional] Only required for a 4-wire interface.
     *
     * @example
     *     var Stepper = BO.io.Stepper,
     *         Event = JSUTILS.Event;
     *
     *     var stepper,
     *         stepsPerRev = 200,           // update this for your stepper
     *         numSteps = stepsPerRev * 10, // 10 revolutions (+ CW, - CCW)
     *         speed = 15.0,                // rad/sec (RPM = speed * 9.55)
     *         acceleration = 20.0,         // rad/sec^2
     *         deceleration = 20.0;         // rad/sec^2
     *
     *     stepper = new Stepper(arduino,
     *                  Stepper.TWO_WIRE, // or Stepper.DRIVER or Stepper.FOUR_WIRE
     *                  stepsPerRev,
     *                  arduino.getDigitalPin(2),
     *                  arduino.getDigitalPin(3));
     *
     *     stepper.addEventListener(Event.COMPLETE, onStepperComplete);
     *
     *     // acceleration and deceleration parameters are optional
     *     stepper.step(numSteps, speed, acceleration, deceleration);
     *
     *     function onStepperComplete(event) {
     *         // each stepper is assigned a read-only id value when instantiated
     *         console.log("stepper " + event.target.id + " sequence complete");
     *     }
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
            numStepsPerRevMSB = (numStepsPerRev >> 7) & 0x007F,
            silent = true;

        // Setup pin mode but don't send set pin mode command to Firmata since
        // Firmata sets pin modes automatically in the Stepper implementation.
        this._board.setDigitalPinMode(directionPin.number, Pin.DOUT, silent);
        this._board.setDigitalPinMode(stepPin.number, Pin.DOUT, silent);

        this._board.addEventListener(IOBoardEvent.SYSEX_MESSAGE, this.onSysExMessage.bind(this));
        
        switch (driverType) {
        case Stepper.DRIVER:
        case Stepper.DRIVER_HIGH_CURRENT:
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
            this._board.setDigitalPinMode(motorPin3.number, Pin.DOUT, silent);
            this._board.setDigitalPinMode(motorPin4.number, Pin.DOUT, silent);

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

        constructor: Stepper,

        /**
         * Move the stepper a given number of steps at the specified
         * speed (rad/sec), acceleration (rad/sec^2) and deceleration (rad/sec^2).
         * The accel and decel parameters are optional but if using, both values
         * must be passed to the function.
         *
         * @method step
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
         * @method onSysExMessage
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
         * [read-only] The id of the Stepper object instance. Each stepper motor
         * is given a unique id upon initialization.
         * @property id
         * @type Number
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

    /**
     * @property Stepper.CLOCKWISE
     * @static
     */
    Stepper.CLOCKWISE = 0;
    /**
     * @property Stepper.COUNTER_CLOCKWISE
     * @static
     */
    Stepper.COUNTER_CLOCKWISE = 1;
    /**
     * Uses 1 microsecond delay between steps
     * @property Stepper.DRIVER
     * @static
     */
    Stepper.DRIVER = 0x01;
    /**
     * Uses 2 microsecond delay between steps
     * @property Stepper.DRIVER_HIGH_CURRENT
     * @static
     */
    Stepper.DRIVER_HIGH_CURRENT = 0x11;
    /**
     * @property Stepper.TWO_WIRE
     * @static
     */
    Stepper.TWO_WIRE = 0x02;
    /**
     * @property Stepper.FOUR_WIRE
     * @static
     */
    Stepper.FOUR_WIRE = 0x04;

    return Stepper;

})();
