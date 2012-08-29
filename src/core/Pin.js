/**
 * Based on Pin.as originally written in as3.
 * Copyright (c) the Funnel development team
 * http://www.funnel.cc
 *
 * Ported to JavaScript by Jeff Hoefs
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 *
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.Pin');

BO.Pin = (function() {
	//"use strict";	// closure compiler doesn't like this... should be fixed soon though

	var Pin;

	// dependencies
	var EventDispatcher = JSUTILS.EventDispatcher,
		PinEvent = BO.PinEvent,
		GeneratorEvent = BO.generators.GeneratorEvent;

	/**
	 * An object to represent an IOBoard pin
	 *
	 * @exports Pin as BO.Pin
	 * @class Each analog and digital pin of the physical I/O board is represented by a Pin object.
	 * The Pin object is the foundation for many of the io objects and is also very
	 * useful on its own. See the Using The Pin Object Guide on http://breakoutjs.com
	 * for a detailed overview.
	 * @param {Number} number The pin number
	 * @param {Number} type The type of pin
	 */
	Pin = function(number, type) {

		this.name = "Pin";

		this._type = type;
		this._capabilities;
		this._number = number;
		this._analogNumber = undefined;
		this._maxPWMValue = 255;
		this._value = 0;
		this._lastValue = -1;
		this._preFilterValue;
		this._average = 0;
		this._minimum = Math.pow(2, 16);
		this._maximum = 0;
		this._sum = 0;
		this._numSamples = 0;
		this._filters = null;
		this._generator = null;

		this._autoSetValueCallback = this.autoSetValue.bind(this);
		
		this._evtDispatcher = new EventDispatcher(this);	

	};

	Pin.prototype = {
		
		/**
		 * The analogNumber sould only be set internally.
		 * @private
		 */		
		setAnalogNumber: function(num) {
			this._analogNumber = num;
		},

		/**
		 * [read-only] The analog pin number used by the IOBoard (printed on board or datasheet).
		 * @name Pin#analogNumber
		 * @property
		 * @type Number
		 */	
		get analogNumber() {
			return this._analogNumber;
		},		

		/**
		 * [read-only] The pin number corresponding to the Arduino documentation for the type of board.
		 * @name Pin#number
		 * @property
		 * @type Number
		 */			 
		get number() {
			return this._number;
		},

		/**
		 * The maximum PWM value supported for this pin. This value should
		 * normally be set internally.
		 * @private
		 */
		setMaxPWMValue: function(val) {
			this._maxPWMValue = value;
		},

		/**
		 * [read-only] The maximum PWM value supported for this pin.
		 * <p> This is the max PWM value supported by Arduino (currently 255) rather 
		 * than the max PWM value specified by the microcontroller datasheet.</p>
		 *
		 * @name Pin#maxPWMValue
		 * @property
		 * @type Number
		 */			 
		get maxPWMValue() {
			return this._maxPWMValue;
		},		
		
		/**
		 * [read-only] The average value of the pin over time. Call clear() to reset.
		 * @name Pin#average
		 * @property
		 * @type Number
		 */			 
		get average() {
			return this._average;
		},

		/**
		 * [read-only] The minimum value of the pin over time. Call clear() to reset.
		 * @name Pin#minimum
		 * @property
		 * @type Number
		 */			 	
		get minimum() {
			return this._minimum;
		},
		
		/**
		 * [read-only] The maximum value of the pin over time. Call clear() to reset.
		 * @name Pin#maximum
		 * @property
		 * @type Number
		 */			 
		get maximum() {
			return this._maximum;
		},
		
		/**
		 * The current digital or analog value of the pin.
		 * @name Pin#value
		 * @property
		 * @type Number
		 */		 
		get value() {
			return this._value;
		},
		set value(val) {
			this._lastValue = this._value;
			this._preFilterValue = val;
			this._value = this.applyFilters(val);
			this.calculateMinMaxAndMean(this._value);
			this.detectChange(this._lastValue, this._value);
		},
		
		/**
		 * [read-only] The last pin value.
		 * @name Pin#lastValue
		 * @property
		 * @type Number
		 */			 
		get lastValue() {
			return this._lastValue;
		},
		
		/**
		 * [read-only] The value before any filters were applied.
		 * @name Pin#preFilterValue
		 * @property
		 * @type Number
		 */			 
		get preFilterValue() {
			return this._preFilterValue;
		},

		/**
		 * Get and set filters for the Pin.
		 * @name Pin#filters
		 * @property
		 * @type FilterBase
		 */	
		get filters() {
			return this._filters;
		},
		set filters(filterArray) {
			this._filters = filterArray;
		},

		/**
		 * [read-only] Get a reference to the current generator.
		 * @name Pin#generator
		 * @property
		 * @type GeneratorBase
		 */	
		get generator() {
			return this._generator;
		},

		/**
		 * The type/mode of the pin (0: DIN, 1: DOUT, 2: AIN, 3: AOUT, 
		 * 4: PWM, 5: SERVO, 6: SHIFT, 7: I2C). Use 
		 * IOBoard.setDigitalPinMode(pinNumber) to set the pin type.
		 * @return {Number} The pin type/mode
		 */	
		getType: function() {
			return this._type;
		},

		/**
		 * Set the pin type. This method should only be used internally.
		 * @private
		 */
		setType: function(pinType) {
			// Ensure pin type is valid
			if (pinType >= 0 && pinType < Pin.TOTAL_PIN_MODES) {
				this._type = pinType;
			}
		},			

		/**
		 * An object storing the capabilities of the pin.
		 * @return {Object} An object describing the capabilities of this Pin.
		 */	
		getCapabilities: function() {
			return this._capabilities;
		},

		/**
		 * This method should only be used internally.
		 * @private
		 */
		setCapabilities: function(pinCapabilities) {
			this._capabilities = pinCapabilities;
		},		

		/**
		 * Dispatch a Change event whenever a pin value changes
		 * @private
		 */
		detectChange: function(oldValue, newValue) {
			if (oldValue === newValue) return;
			this.dispatchEvent(new PinEvent(PinEvent.CHANGE));

			if (oldValue <= 0 && newValue !== 0) {
				this.dispatchEvent(new PinEvent(PinEvent.RISING_EDGE));
			} else if (oldValue !== 0 && newValue <=0) {
				this.dispatchEvent(new PinEvent(PinEvent.FALLING_EDGE));
			}
		},
		
		/**
		 * From funnel Pin.as
		 * @private
		 */
		clearWeight: function() {
			this._sum = this._average;
			this._numSamples = 1;
		},
		
		/**
		 * From funnel Pin.as
		 * @private
		 */
		calculateMinMaxAndMean: function(val) {
			var MAX_SAMPLES = Number.MAX_VALUE;

			this._minimum = Math.min(val, this._minimum);
			this._maximum = Math.max(val, this._maximum);
			
			this._sum += val;
			this._average = this._sum / (++this._numSamples);
			if (this._numSamples >= MAX_SAMPLES) {
				this.clearWeight();
			}
		},
			
		/**
		 * Resets the minimum, maximum, average and lastValue of the pin.
		 */
		clear: function() {
			this._minimum = this._maximum = this._average = this._lastValue = this._preFilterValue;
			this.clearWeight();
		},
		
		/**
		 * Add a new filter to the Pin.
		 * @param {FilterBase} newFilter A filter object that extends FilterBase.
		 * @see BO.filters.Convolution
		 * @see BO.filters.Scaler
		 * @see BO.filters.TriggerPoint
		 */
		addFilter: function(newFilter) {

			if (newFilter === null) {
				return;
			}

			if (this._filters === null) {
				this._filters = [];
			}

			this._filters.push(newFilter);
		},

		/**
		 * Add a new generator to the Pin. A pin can only have one generator
		 * assigned. 
		 * Assigning a new generator will replace the previously assigned 
		 * generator.
		 *
		 * @param {GeneratorBase} newGenerator A generator object that extends GeneratorBase.
		 * @see BO.generators.Oscillator
		 */
		addGenerator: function(newGenerator) {
			this.removeGenerator();
			this._generator = newGenerator;
			this._generator.addEventListener(GeneratorEvent.UPDATE, this._autoSetValueCallback);
		},

		/**
		 * Removes the generator from the pin.
		 */
		removeGenerator: function() {
			if (this._generator !== null) {
				this._generator.removeEventListener(GeneratorEvent.UPDATE, this._autoSetValueCallback);
			}
			this._generator = null;				
		},

		/**
		 * Removes all filters from the pin.
		 */
		removeAllFilters: function() {
			this._filters = null;
		},

		/**
		 * @private
		 */
		autoSetValue: function(event) {
			var val = this._generator.value;
			this.value = val;
		},

		/**
		 * @private
		 */
		applyFilters: function(val) {
			var result;

			if (this._filters === null) return val;
			
			result = val;
			var len = this._filters.length;
			for (var i = 0; i < len; i++) {
				result = this._filters[i].processSample(result);
			}

			return result;
		},

		// Implement EventDispatcher
		
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
		 * @param {PinEvent} type The Event object
		 * @param {Object} optionalParams Optional parameters to assign to the event object.
		 * return {boolean} True if dispatch is successful, false if not.
		 */	
		dispatchEvent: function(event, optionalParams) {
			return this._evtDispatcher.dispatchEvent(event, optionalParams);
		}		
			
	};

	/** @constant */
	Pin.HIGH = 1;
	/** @constant */
	Pin.LOW	= 0;
	/** @constant */
	Pin.ON = 1;
	/** @constant */
	Pin.OFF = 0;

	// Pin modes
	/** @constant */
	Pin.DIN = 0x00;
	/** @constant */
	Pin.DOUT = 0x01;
	/** @constant */
	Pin.AIN = 0x02;
	/** @constant */
	Pin.AOUT = 0x03;
	/** @constant */
	Pin.PWM = 0x03;
	/** @constant */
	Pin.SERVO = 0x04;
	/** @constant */
	Pin.SHIFT = 0x05;
	/** @constant */
	Pin.I2C = 0x06;
	/** @constant */
	Pin.TOTAL_PIN_MODES = 7;


	// Document events

	/**
	 * The pinChange event is dispatched when the pin value changes.
	 * @name Pin#pinChange
	 * @type BO.PinEvent.CHANGE
	 * @event
	 * @param {BO.Pin} target A reference to the Pin object.
	 */

	/**
	 * The risingEdge event is dispatched when the pin value increased (from 0 to 1).
	 * @name Pin#risingEdge
	 * @type BO.PinEvent.RISING_EDGE
	 * @event
	 * @param {BO.Pin} target A reference to the Pin object.
	 */	
	 
	/**
	 * The change event is dispatched when the pin value decreased (from 1 to 0).
	 * @name Pin#fallingEdge
	 * @type BO.PinEvent.FALLING_EDGE
	 * @event
	 * @param {BO.Pin} target A reference to the Pin object.
	 */		 	 

	return Pin;

}());
