/**
 * Based on Pin.as originally written in as3.
 * Copyright (c) the Funnel development team
 * http://www.funnel.cc
 *
 * Ported to JavaScript by Jeff Hoefs
 * Copyright (c) 2011-2014 Jeff Hoefs <soundanalogous@gmail.com>
 *
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.Pin');

BO.Pin = (function () {
    "use strict";

    var Pin;

    // dependencies
    var EventDispatcher = JSUTILS.EventDispatcher,
        PinEvent = BO.PinEvent;

    /**
     * Each analog and digital pin of the physical I/O board is 
     * represented by a Pin object.
     * The Pin object is the foundation for many of the io objects and is also 
     * very useful on its own. See the Using The Pin Object Guide on 
     * [http://breakoutjs.com](http://breakoutjs.com) for a detailed overview.
     *
     * @class Pin
     * @constructor
     * @uses JSUTILS.EventDispatcher
     * @param {Number} number The pin number
     * @param {Number} type The type of pin
     */
    Pin = function (number, type) {

        this.name = "Pin";

        this._type = type;
        this._capabilities = {};
        this._number = number;
        this._analogNumber = undefined;
        this._analogWriteResolution = 255; // default
        this._analogReadResolution = 1023; // default
        this._value = 0;
        this._lastValue = -1;
        this._preFilterValue = 0;
        this._average = 0;
        this._minimum = Math.pow(2, 16);
        this._maximum = 0;
        this._sum = 0;
        this._numSamples = 0;
        this._filters = null;
        this._generator = null;
        this._state = undefined;

        this._autoSetValueCallback = this.autoSetValue.bind(this);
        
        this._evtDispatcher = new EventDispatcher(this);

    };

    Pin.prototype = {

        constructor: Pin,
        
        /**
         * The analogNumber sould only be set internally.
         * @private
         */
        setAnalogNumber: function (num) {
            this._analogNumber = num;
        },

        /**
         * [read-only] The analog pin number used by the IOBoard (printed on 
         * board or datasheet).
         * @property analogNumber
         * @type Number
         */
        get analogNumber() {
            return this._analogNumber;
        },

        /**
         * [read-only] The pin number corresponding to the Arduino documentation 
         * for the type of board.
         * @property number
         * @type Number
         */
        get number() {
            return this._number;
        },

        /**
         * The analog write (PWM) resolution for this pin. This value should
         * normally be set internally.
         * @private
         */
        setAnalogWriteResolution: function (value) {
            this._analogWriteResolution = value;
        },

        /**
         * The analog read resolution for this pin. This value should
         * normally be set internally.
         * @private
         */
        setAnalogReadResolution: function (value) {
            this._analogReadResolution = value;
        },

        /**
         * Sets the state value. This is populated by the 
         * processPinStateResponse method of the IOBoard object. It should not
         * be called manually.
         * 
         * @param {Number} state The state of the pin. For output modes, the
         * state is any value that has been previously written to the pin. For 
         * input modes, the state is typically zero, however for digital inputs
         * the state is the status of the pullup resistor.
         * @private
         */
        setState: function (state) {
            // convert PWM values to 0.0 - 1.0 range
            if (this._type === Pin.PWM) {
                state = state / this.analogWriteResolution;
            }

            this._state = state;
        },

        /**
         * [read-only] The analog write (PWM) resolution for this pin.
         * <p> This is the PWM resolution specified by Arduino rather than the
         * resolution specified by the microcontroller datasheet.</p>
         *
         * @property analogWriteResolution
         * @type Number
         */
        get analogWriteResolution() {
            return this._analogWriteResolution;
        },

        /**
         * [read-only] The analog read resolution for this pin.
         * <p> This is the analog read resolution specified by Arduino rather
         * than the resolution specified by the microcontroller datasheet.</p>
         *
         * @property analogReadResolution
         * @type Number
         */
        get analogReadResolution() {
            return this._analogReadResolution;
        },
        
        /**
         * [read-only] The average value of the pin over time. Call clear() to 
         * reset.
         * @property average
         * @type Number
         */
        get average() {
            return this._average;
        },

        /**
         * [read-only] The minimum value of the pin over time. Call clear() to 
         * reset.
         * @property minimum
         * @type Number
         */
        get minimum() {
            return this._minimum;
        },
        
        /**
         * [read-only] The maximum value of the pin over time. Call clear() to 
         * reset.
         * @property maximum
         * @type Number
         */
        get maximum() {
            return this._maximum;
        },

        /**
         * <p>[read-only] The state of the pin. For output modes, the state is 
         * any value that has been previously written to the pin. For input 
         * modes, the state is typically zero, however for digital inputs the 
         * state is the status of the pullup resistor.</p>
         *
         * <p>This propery is populated by calling the queryPinState method of 
         * the IOBoard object. This is useful if there are multiple client 
         * applications connected to a single physical IOBoard and you want to 
         * get the state of a pin that is set by another client application.</p>
         * 
         * @property state
         * @type Number
         */
        get state() {
            return this._state;
        },
        
        /**
         * The current digital or analog value of the pin.
         * @property value
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
         * @property lastValue
         * @type Number
         */
        get lastValue() {
            return this._lastValue;
        },
        
        /**
         * [read-only] The value before any filters were applied.
         * @property preFilterValue
         * @type Number
         */
        get preFilterValue() {
            return this._preFilterValue;
        },

        /**
         * Get and set filters for the Pin.
         * @property filters
         * @type FilterBase[]
         */
        get filters() {
            return this._filters;
        },
        set filters(filterArray) {
            this._filters = filterArray;
        },

        /**
         * [read-only] Get a reference to the current generator.
         * @property generator
         * @type GeneratorBase
         */
        get generator() {
            return this._generator;
        },

        /**
         * The type/mode of the pin (0: DIN, 1: DOUT, 2: AIN, 3: AOUT / PWM,
         * 4: SERVO, 5: SHIFT, 6: I2C). Use 
         * IOBoard.setDigitalPinMode(pinNumber) to set the pin type.
         * @method getType
         * @return {Number} The pin type/mode
         */
        getType: function () {
            return this._type;
        },

        /**
         * Set the pin type. This method should only be used internally.
         * @private
         */
        setType: function (pinType) {
            // Ensure pin type is valid
            if (pinType >= 0 && pinType < Pin.TOTAL_PIN_MODES) {
                this._type = pinType;
            }
        },

        /**
         * An object storing the capabilities of the pin.
         * @method getCapabilities
         * @return {Object} An object describing the capabilities of this Pin.
         */
        getCapabilities: function () {
            return this._capabilities;
        },

        /**
         * This method should only be used internally.
         * @private
         */
        setCapabilities: function (pinCapabilities) {
            this._capabilities = pinCapabilities;

            var analogWriteRes = this._capabilities[Pin.PWM];
            var analogReadRes = this._capabilities[Pin.AIN];

            if (analogWriteRes) {
                this.setAnalogWriteResolution(Math.pow(2, analogWriteRes) - 1);
            }

            if (analogReadRes) {
                this.setAnalogReadResolution(Math.pow(2, analogReadRes) - 1);
            }
        },

        /**
         * Dispatch a Change event whenever a pin value changes
         * @private
         * @method detectChange
         */
        detectChange: function (oldValue, newValue) {
            if (oldValue === newValue) {
                return;
            }
            this.dispatchEvent(new PinEvent(PinEvent.CHANGE));

            if (oldValue <= 0 && newValue !== 0) {
                this.dispatchEvent(new PinEvent(PinEvent.RISING_EDGE));
            } else if (oldValue !== 0 && newValue <= 0) {
                this.dispatchEvent(new PinEvent(PinEvent.FALLING_EDGE));
            }
        },
        
        /**
         * From funnel Pin.as
         * @private
         * @method clearWeight
         */
        clearWeight: function () {
            this._sum = this._average;
            this._numSamples = 1;
        },
        
        /**
         * From funnel Pin.as
         * @private
         * @method calculateMinMaxAndMean
         */
        calculateMinMaxAndMean: function (val) {
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
         * @method clear
         */
        clear: function () {
            this._minimum = this._maximum = this._average = this._lastValue = this._preFilterValue;
            this.clearWeight();
        },
        
        /**
         * Add a new filter to the Pin.
         * @method addFilter
         * @param {FilterBase} newFilter A filter object that extends 
         * FilterBase.
         * @see BO.filters.Convolution
         * @see BO.filters.Scaler
         * @see BO.filters.TriggerPoint
         */
        addFilter: function (newFilter) {

            if (newFilter === null) {
                return;
            }

            if (this._filters === null) {
                this._filters = [];
            }

            this._filters.push(newFilter);
        },

        /**
         * Remove a specified filter from the Pin.
         * @method removeFilter
         * @param {FilterBase} filterToRemove The filter to remove.
         * @see BO.filters.Convolution
         * @see BO.filters.Scaler
         * @see BO.filters.TriggerPoint
         */
        removeFilter: function (filterToRemove) {
            var index;

            if (this._filters.length < 1) {
                return;
            }

            index = this._filters.indexOf(filterToRemove);

            if (index !== -1) {
                this._filters.splice(index, 1);
            }
        },

        /**
         * Add a new generator to the Pin. A pin can only have one generator
         * assigned. 
         * Assigning a new generator will replace the previously assigned 
         * generator.
         * @method addGenerator
         * @param {GeneratorBase} newGenerator A generator object that extends 
         * GeneratorBase.
         * @see BO.generators.Oscillator
         */
        addGenerator: function (newGenerator) {
            this.removeGenerator();
            this._generator = newGenerator;
            // BO.generators.GeneratorEvent.UPDATE = "update"
            this._generator.addEventListener("update", this._autoSetValueCallback);
        },

        /**
         * Removes the generator from the pin.
         * @method removeGenerator
         */
        removeGenerator: function () {
            if (this._generator !== null) {
                // BO.generators.GeneratorEvent.UPDATE = "update"
                this._generator.removeEventListener("update", this._autoSetValueCallback);
            }
            this._generator = null;
        },

        /**
         * Removes all filters from the pin.
         * @method removeAllFilters
         */
        removeAllFilters: function () {
            this._filters = null;
        },

        /**
         * @private
         * @method autoSetValue
         */
        autoSetValue: function (event) {
            var val = this._generator.value;
            this.value = val;
        },

        /**
         * @private
         * @method applyFilters
         */
        applyFilters: function (val) {
            var result;

            if (this._filters === null) {
                return val;
            }
            
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
         * @param {Function} listener The function to be called when the event 
         * is fired
         */
        addEventListener: function (type, listener) {
            this._evtDispatcher.addEventListener(type, listener);
        },
        
        /**
         * @param {String} type The event type
         * @param {Function} listener The function to be called when the event 
         * is fired
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
         * @param {PinEvent} type The Event object
         * @param {Object} optionalParams Optional parameters to assign to the 
         * event object.
         * return {boolean} True if dispatch is successful, false if not.
         */
        dispatchEvent: function (event, optionalParams) {
            return this._evtDispatcher.dispatchEvent(event, optionalParams);
        }
            
    };

    /**
     * @property Pin.HIGH
     * @static
     */
    Pin.HIGH = 1;
    /**
     * @property Pin.LOW
     * @static
     */
    Pin.LOW = 0;
    /**
     * @property Pin.ON
     * @static
     */
    Pin.ON = 1;
    /**
     * @property Pin.OFF
     * @static
     */
    Pin.OFF = 0;

    // Pin modes
    /**
     * @property Pin.DIN
     * @static
     */
    Pin.DIN = 0x00;
    /**
     * @property Pin.DOUT
     * @static
     */
    Pin.DOUT = 0x01;
    /**
     * @property Pin.AIN
     * @static
     */
    Pin.AIN = 0x02;
    /**
     * @property Pin.AOUT
     * @static
     */
    Pin.AOUT = 0x03;
    /**
     * @property Pin.PWM
     * @static
     */
    Pin.PWM = 0x03;
    /**
     * @property Pin.SERVO
     * @static
     */
    Pin.SERVO = 0x04;
    /**
     * @property Pin.SHIFT
     * @static
     */
    Pin.SHIFT = 0x05;
    /**
     * @property Pin.I2C
     * @static
     */
    Pin.I2C = 0x06;
    /**
     * @property Pin.ONEWIRE
     * @static
     */
    Pin.ONEWIRE = 0x07;
    /**
     * @property Pin.STEPPER
     * @static
     */
    Pin.STEPPER = 0x08;
    /**
     * @property Pin.TOTAL_PIN_MODES
     * @static
     */
    Pin.TOTAL_PIN_MODES = 9;


    // Document events

    /**
     * The pinChange event is dispatched when the pin value changes.
     * @type BO.PinEvent.CHANGE
     * @event pinChange
     * @param {BO.Pin} target A reference to the Pin object.
     */

    /**
     * The risingEdge event is dispatched when the pin value increased 
     * (from 0 to 1).
     * @type BO.PinEvent.RISING_EDGE
     * @event risingEdge
     * @param {BO.Pin} target A reference to the Pin object.
     */
     
    /**
     * The change event is dispatched when the pin value decreased 
     * (from 1 to 0).
     * @type BO.PinEvent.FALLING_EDGE
     * @event fallingEdge
     * @param {BO.Pin} target A reference to the Pin object.
     */

    return Pin;

}());
