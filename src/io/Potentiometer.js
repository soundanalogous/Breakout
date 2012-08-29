/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.io.Potentiometer');

BO.io.Potentiometer = (function() {

	var Potentiometer;

	// Dependencies
	var Pin = BO.Pin,
		PhysicalInputBase = BO.PhysicalInputBase,
		Scaler = BO.filters.Scaler,
		Convolution = BO.filters.Convolution,
		PinEvent = BO.PinEvent,
		PotEvent = BO.io.PotEvent;

	/**
	 * The Potentiometer object can be used for any generic analog input. It
	 * provides a higher level of abstraction around an analog input pin.
	 *
	 * @exports Potentiometer as BO.io.Potentiometer
	 * @class Creates an interface to an analog input sensor. This may be a
	 * potentiometer (dial) or any other analog input that is connected to a
	 * single analog pin.
	 * @constructor
	 * @augments BO.PhysicalInputBase	 
	 * @param {IOBoard} board A reference to the IOBoard instance that the
	 * servo is attached to.
	 * @param {Pin} pin A reference to the Pin the potentiometer is connected
	 * to.
	 * @param {Boolean} enableSmoothing True to enable smoothing, false to
	 * disable. Default is false.
	 */
	Potentiometer = function(board, pin, enableSmoothing) {
		"use strict";

		PhysicalInputBase.call(this);
		
		this.name = "Potentiometer";
		this._pin = pin;

		enableSmoothing = enableSmoothing || false;

		var analogPinNumber = this._pin.analogNumber;
		board.enableAnalogPin(analogPinNumber);

		if (enableSmoothing) {
			this._pin.addFilter(new Convolution(Convolution.MOVING_AVERAGE));
		}

		this._pin.addEventListener(PinEvent.CHANGE, this.onPinChange.bind(this));
	};

	Potentiometer.prototype = JSUTILS.inherit(PhysicalInputBase.prototype);
	Potentiometer.prototype.constructor = Potentiometer;
	
	/**
	 * [read-only] The current value of the potentiometer.
	 * @name Potentiometer#value
	 * @property
	 * @type Number
	 */ 
	Potentiometer.prototype.__defineGetter__("value", function() { return this._pin.value; });

	/**
	 * [read-only] Get the (pre-filtered) average value of the potentiometer.
	 * 
	 * @name Potentiometer#average
	 * @property
	 * @type Number
	 */ 
	Potentiometer.prototype.__defineGetter__("average", function() { return this._pin.average; });

	/**
	 * [read-only] Get the value of the potentiometer before filters are
	 * applied.
	 * 
	 * @name Potentiometer#preFilterValue
	 * @property
	 * @type Number
	 */ 
	Potentiometer.prototype.__defineGetter__("preFilterValue", function() { return this._pin.preFilterValue; });

	/**
	 * [read-only] Get the (pre-filtered) minimum value read by the
	 * potentiometer.
	 * 
	 * @name Potentiometer#minimum
	 * @property
	 * @type Number
	 */ 
	Potentiometer.prototype.__defineGetter__("minimum", function() { return this._pin.minimum; });

	/**
	 * [read-only] Get the (pre-filtered) maximum value read by the
	 * potentiometer.
	 * 
	 * @name Potentiometer#maximum
	 * @property
	 * @type Number
	 */ 
	Potentiometer.prototype.__defineGetter__("maximum", function() { return this._pin.maximum; });

	/**
	 * Resets the minimum, maximum, and average values.
	 */
	Potentiometer.prototype.clear = function() {
		this._pin.clear();
	};

	/**
	 * Scale from the minimum and maximum input values to 0.0 -> 1.0. This is
	 * useful for sensors such as a flex sensor that may not return the full
	 * range of 0 to 1. 
	 *
	 * @param {Number} minimum The new minimum range (must be less than the maximum).
	 * @param {Number} maximum The new maximum range.
	 */
	Potentiometer.prototype.setRange = function(minimum, maximum) {
		minimum = minimum || 0;
		maximum = maximum || 1;
		this._pin.addFilter(new Scaler(minimum, maximum, 0, 1, Scaler.LINEAR));
	};

	/**
	 * @private
	 */
	Potentiometer.prototype.onPinChange = function(event) {
		this.dispatchEvent(new PotEvent(PotEvent.CHANGE));
	};

	// Document events

	/**
	 * The change event is dispatched when the potentiometer value changes.
	 * @name Potentiometer#change
	 * @type BO.io.PotEvent.CHANGE
	 * @event
	 * @example
	 * pot.addEventListener(PotEvent.CHANGE, onValueChange);
	 *
	 * function onValueChange(event) {
	 *   console.log("value = " + event.target.value);	
	 * }
	 * @param {BO.Potentiometer} target A reference to the Potentiometer object
	 */

	return Potentiometer;

}());
