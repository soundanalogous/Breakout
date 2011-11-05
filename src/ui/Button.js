/**
 * @author Jeff Hoefs
 */

ARDJS.namespace('ARDJS.ui.ButtonEvent');

ARDJS.ui.ButtonEvent = (function() {

	var ButtonEvent;

	// dependencies
	var Event = ARDJS.Event;

	/**
	 * @constructor
	 * @augments Event
	 */
	ButtonEvent = function(type) {
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

	ButtonEvent.prototype = ARDJS.inherit(Event.prototype);
	ButtonEvent.prototype.constructor = ButtonEvent;

	return ButtonEvent;

}());


ARDJS.namespace('ARDJS.ui.Button');

ARDJS.ui.Button = (function() {

	var Button;

	// dependencies
	var PhysicalInputBase = ARDJS.ui.PhysicalInputBase,
		Event = ARDJS.Event,
		ButtonEvent = ARDJS.ui.ButtonEvent;

	/**
	 * An object to represent a physical button. The advantage of using the Button class over
	 * listening for pin change events on a Pin object, is that the Button class handles debouncing 
	 * and provides helpful button events: Pressed, Released, Long Press and Sustained Press
	 *
	 * @constructor
	 * @augments PhysicalInputBase
	 * @param {Pin} pin A reference to the pin the button is connected to.
	 * @param {number} buttonMode The mode of the button (either PULL_DOWN or PULL_UP). 
	 * Default is PULL_DOWN.
	 * @param {number} longPressDelay The delay time in milliseconds before a long press event is fired.
	 *
	 */
	Button = function(pin, buttonMode, longPressDelay) {
		"use strict";
		
		PhysicalInputBase.call(this);

		// for testing
		this.className = "Button";
		this._pin = pin;
		
		this.buttonMode = buttonMode || Button.PULL_DOWN;
		this.longPressDelay = longPressDelay || 1000;

		this._debounceInterval = 20,
		this._repeatCount = 0,
		this._timer = null,
		this._timeout = null;	
		
		pin.addEventListener(Event.CHANGE, this.onPinChange.bind(this));
		
	}


	Button.prototype = ARDJS.inherit(PhysicalInputBase.prototype);
	Button.prototype.constructor = Button;


	/**
	 * @private
	 */
	Button.prototype.onPinChange = function(evt) {
		
		var btnVal = evt.target.value;
		var stateHandler;



		if (this.buttonMode === Button.PULL_DOWN) {
			if (btnVal === 1) stateHandler = this.pressed;
			else stateHandler = this.released;
		} else if (this.buttonMode === Button.PULL_UP) {
			if (btnVal === 1) stateHandler = this.released;
			else stateHandler = this.pressed;
		}
		
		if (this._timeout === null) {
			this._timeout = setTimeout(stateHandler.bind(this), this._debounceInterval);
		} else {
			clearTimeout(this._timeout);
			this._timeout = setTimeout(stateHandler.bind(this), this._debounceInterval);
		}
	};
	
	/**
	 * @private
	 */
	Button.prototype.pressed = function() {
		this._timeout = null;

		this.dispatchEvent(new ButtonEvent(ButtonEvent.PRESS));
		
		this_timer = setInterval(this.sustainedPress.bind(this), this.longPressDelay);
	};
	
	/**
	 * @private
	 */	
	Button.prototype.released = function() {
		this._timeout = null;
		this.dispatchEvent(new ButtonEvent(ButtonEvent.RELEASE));
		
		if (this._timer != null) {
			clearInterval(this._timer);
			this._timer = null;
		}
		
		this._repeatCount = 0;
	};
	
	/**
	 * @private
	 */
	Button.prototype.sustainedPress = function() {
		if (this._repeatCount > 0) {
			this.dispatchEvent(new ButtonEvent(ButtonEvent.SUSTAINED_PRESS));
		} else {
			this.dispatchEvent(new ButtonEvent(ButtonEvent.LONG_PRESS));
		}
		
		this._repeatCount++;
	};
	
	
	/**
	 * Set the debounce interval.
	 * @param {number} interval The debounce time interval in milliseconds
	 */
	Button.prototype.setDebounceInterval = function(interval) {
		this._debounceInterval = interval;
	};
	
	/**
	 * get the debounce interval.
	 * @return {number} interval The debounce time interval in milliseconds
	 */	
	Button.prototype.getDebounceInterval = function() {
		return this._debounceInterval;
	};
	
	/**
	 * [read-only] The pin number of the pin the button is attached to.
	 * @name Button#pinNumber
	 * @property
	 * @type Number
	 */
	Button.prototype.__defineGetter__("pinNumber", function() { return this._pin.number; });	

	/** @constant */
	Button.PULL_DOWN = 0;
	/** @constant */
	Button.PULL_UP 	= 1;

	return Button;

}());
