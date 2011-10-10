/**
 * An object to represent a physical button. The advantage of using the Button class over
 * listening for pin change events on a Pin object, is that the Button class handles debouncing 
 * and provides helpful button events: Pressed, Released, Long Press and Sustained Press
 *
 * @constructor
 * @augments PhysicalInput
 * @param {Pin} pin A reference to the pin the button is connected to.
 * @param {number} buttonMode The mode of the button (either PULL_DOWN or PULL_UP). 
 * Default is PULL_DOWN.
 * @param {number} longPressDelay The delay time in milliseconds before a long press event is fired.
 */
function Button(pin, buttonMode, longPressDelay) {
	"use strict";
	
	this.className = "Button";
	var self = this;
	
	PhysicalInputBase.call(this);
	
	buttonMode = buttonMode || Button.PULL_DOWN;
	longPressDelay = longPressDelay || 1000;
	
	var _debounceInterval = 50,
		_repeatCount = 0,
		_timer = null,
		_timeout = null;	
	
	pin.addEventListener(Event.CHANGE, onPinChange);
	
	/**
	 * @private
	 */
	function onPinChange(evt) {
		
		var btnVal = evt.target.getValue();
		var stateHandler;
		
		if (buttonMode === Button.PULL_DOWN) {
			if (btnVal === 1) stateHandler = pressed;
			else stateHandler = released;
		} else if (buttonMode === Button.PULL_UP) {
			if (btnVal === 0) stateHandler = released;
			else stateHandler = pressed;
		}
		
		if (_timeout === null) {
			_timeout = setTimeout(stateHandler, _debounceInterval);
		} else {
			clearTimeout(_timeout);
			_timeout = setTimeout(stateHandler, _debounceInterval);
		}
	}
	
	/**
	 * @private
	 */
	var pressed = function() {
		_timeout = null;

		self.dispatchEvent(new ButtonEvent(ButtonEvent.PRESS));
		
		_timer = setInterval(sustainedPress, longPressDelay);
	}
	
	/**
	 * @private
	 */	
	var released = function() {
		_timeout = null;
		self.dispatchEvent(new ButtonEvent(ButtonEvent.RELEASE));
		
		if (_timer != null) {
			clearInterval(_timer);
			_timer = null;
		}
		
		_repeatCount = 0;
	}
	
	/**
	 * @private
	 */
	var sustainedPress = function() {
		if (_repeatCount > 0) {
			self.dispatchEvent(new ButtonEvent(ButtonEvent.SUSTAINED_PRESS));
		} else {
			self.dispatchEvent(new ButtonEvent(ButtonEvent.LONG_PRESS));
		}
		
		_repeatCount++;
	}
	
	
	/**
	 * Set the debounce interval.
	 * @param {number} interval The debounce time interval in milliseconds
	 */
	this.setDebounceInterval = function(interval) {
		_debounceInterval = interval;
	}
	
	/**
	 * get the debounce interval.
	 * @return {number} interval The debounce time interval in milliseconds
	 */	
	this.getDebounceInterval = function() {
		return _debounceInterval;
	}
	
	/**
	 * Get the number of the pin the button is attached to
	 * @return {number} The pin number the button is attached to.
	 */
	this.getPinNumber = function() {
		return pin.getNumber();
	}
}

/** @constant */
Button.PULL_DOWN = 0;
/** @constant */
Button.PULL_UP 	= 1;

Button.prototype = new PhysicalInputBase;
Button.prototype.constructor = Button;


/**
 * @constructor
 * @augments Event
 */
function ButtonEvent(type) {
	Event.call(this, type);
}

/** @constant */
ButtonEvent.PRESS = "pressed";
/** @constant */
ButtonEvent.RELEASE = "released";
/** @constant */
ButtonEvent.LONG_PRESS = "longPress";
/** @constant */
ButtonEvent.SUSTAINED_PRESS = "sustainedPress";

ButtonEvent.prototype = new Event;
ButtonEvent.prototype.constructor = ButtonEvent;