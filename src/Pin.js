/**
 * @author Jeff Hoefs
 */

ARDJS.namespace('ARDJS.Pin');

ARDJS.Pin = (function() {
	"use strict";

	///** @exports Pin as ARDJS.Pin */
	var Pin;

	// dependencies
	var EventDispatcher = ARDJS.EventDispatcher,
		Event = ARDJS.Event;

	/**
	 * An object to represent an Arduino pin
	 *
	 * @constructor
	 * @param {Number} number The pin number
	 * @param {Number} type The type of pin
	 */
	Pin = function(number, type) {
		this.type = type;
		this.capabilities;
		
		this._number = number,
		this._value = 0,
		this._lastValue = 0,
		this._preFilterValue,
		this._average = 0,
		this._minimum = Math.pow(2, 16),
		this._maximum = 0,
		this._avg = 0,
		this._sum = 0,
		this._numSamples = 0,
		this._analogReporting = Pin.OFF,
		
		this._evtDispatcher = new EventDispatcher(this);	

	};

	Pin.prototype = {

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
			this.calculateMinMaxAndMean(val);
			this._lastValue = this._value;
			this._preFilterValue = val;
			this._value = val;
			this.detectChange(this._lastValue, this._value);
		},

		/**
		 * [read-only] Indicates whether or not analog reporting is enabled for this pin.
		 * @name Pin#analogReporting
		 * @property
		 * @type Boolean
		 */			
		get analogReporting() {
			return this._analogReporting;
		},
		
		/**
		 * @private
		 */	
		set analogReporting(mode) {
			this._analogReporting = mode;
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
		 * Dispatch a Change event whenever a pin value changes
		 * @private
		 */
		detectChange: function(oldValue, newValue) {
			if (oldValue == newValue) return;
			//console.log("detect change");
			this.dispatchEvent(new Event(Event.CHANGE));
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
	Pin.HIGH = 1;
	/** @constant */
	Pin.LOW	= 0;
	/** @constant */
	Pin.ON = 1;
	/** @constant */
	Pin.OFF = 0;

	// pin modes
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

	return Pin;

}());