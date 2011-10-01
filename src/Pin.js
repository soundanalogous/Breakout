/**
 * An object to represent an Arduino pin
 * @constructor
 * @param {Number} number The pin number
 * @param {Number} type The type of pin
 */
function Pin(number, type) {
	this.type = type;
	this.capabilities;
	
	var self = this,
		_number = number,
		_value = 0,
		_lastValue = 0,
		_preFilterValue,
		_average = 0,
		_minimum = Math.pow(2, 16),
		_maximum = 0,
		_avg = 0,
		_sum = 0;
		_numSamples = 0,
		_analogReporting = Pin.OFF,
		MAX_SAMPLES = Number.MAX_VALUE;
	
	var _evtDispatcher = new EventDispatcher(this);
	
	/**
	 * Dispatch a Change event whenever a pin value changes
	 * @private
	 */
	function detectChange(oldValue, newValue) {
		if (oldValue == newValue) return;
		//console.log("detect change");
		self.dispatchEvent(new Event(Event.CHANGE));
	}
	
	/**
	 * From funnel Pin.as
	 * @private
	 */
	function clearWeight() {
		_sum = _average;
		_numSamples = 1;
	}
	
	/**
	 * From funnel Pin.as
	 * @private
	 */
	function calculateMinMaxAndMean(val) {
		_minimum = Math.min(val, _minimum);
		_maximum = Math.max(val, _maximum);
		
		_sum += val;
		_average = _sum / (++_numSamples);
		if (_numSamples >= MAX_SAMPLES) {
			clearWeight();
		}
	}
	
	/**
	 * Get the pin number corresponding to the Arduino documentation for the type of board.
	 * 
	 * @return {Number} The pin number
	 */
	this.getNumber = function() {
		// to do: return number based on pin type?
		return _number;
	}
	
	/**
	 * @return {Number} The average value of the pin over time. Call clear() to reset.
	 */
	this.getAverage = function() {
		return _average;
	}

	/**
	 * @return {Number} The minimum value of the pin over time. Call clear() to reset.
	 */	
	this.getMinimum = function() {
		return _minimum;
	}
	
	/**
	 * @return {Number} The maximum value of the pin over time. Call clear() to reset.
	 */	
	this.getMaximum = function() {
		return _maximum;
	}
	
	/**
	 * @return {Number} Get the current digital or analog value of the pin
	 */
	this.getValue = function() {
		return _value;
	}
	
	/**
	 * @param {Number} val Set the pin value
	 */
	this.setValue = function(val) {
		calculateMinMaxAndMean(val);
		_lastValue = _value;
		_preFilterValue = val;
		_value = val;
		detectChange(_lastValue, _value);
	}
	
	this.setAnalogReporting = function(mode) {
		_analogReporting = mode;
	}
	
	this.getAnalogReporting = function() {
		return _analogReporting;
	}
	
	/**
	 * @return {Number} Get the last pin value
	 */
	this.getLastValue = function() {
		return _lastValue;
	}
	
	/**
	 * @return {Number} The value before any filters were applied.
	 */
	this.getPreFilterValue = function() {
		return _preFilterValue;
	}
	
	/**
	 * Resets the minimum, maximum, average and lastValue of the pin.
	 */
	this.clear = function() {
		_minimum = _maximum = _average = _lastValue = _preFilterValue;
		clearWeight();
	}
	
	/* implement EventDispatcher */
	
	/**
	 * @param {String} type The event type
	 * @param {Function} listener The function to be called when the event is fired
	 */
	this.addEventListener = function(type, listener) {
		_evtDispatcher.addEventListener(type, listener);
	}
	
	/**
	 * @param {String} type The event type
	 * @param {Function} listener The function to be called when the event is fired
	 */
	this.removeEventListener = function(type, listener) {
		_evtDispatcher.removeEventListener(type, listener);
	}
	
	/**
	 * @param {String} type The event type
	 * return {boolean} True is listener exists for this type, false if not.
	 */
	this.hasEventListener = function(type) {
		return _evtDispatcher.hasEventListener(type);
	}
	
	/**
	 * @param {Event} type The Event object
	 * return {boolean} True if dispatch is successful, false if not.
	 */		
	this.dispatchEvent = function(event) {
		return _evtDispatcher.dispatchEvent(event);
	}	
}

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