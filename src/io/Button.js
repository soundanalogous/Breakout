/**
 * @author Jeff Hoefs
 */

BREAKOUT.namespace('BREAKOUT.io.ButtonEvent');

BREAKOUT.io.ButtonEvent = (function() {

	var ButtonEvent;

	// dependencies
	var Event = BREAKOUT.Event;

	/**
	 * @exports ButtonEvent as BREAKOUT.io.ButtonEvent
	 * @constructor
	 * @augments BREAKOUT.Event
	 */
	ButtonEvent = function(type) {

		this.name = "ButtonEvent"; // for testing

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

	ButtonEvent.prototype = BREAKOUT.inherit(Event.prototype);
	ButtonEvent.prototype.constructor = ButtonEvent;

	return ButtonEvent;

}());


BREAKOUT.namespace('BREAKOUT.io.Button');

BREAKOUT.io.Button = (function() {

	var Button;

	// dependencies
	var PhysicalInputBase = BREAKOUT.PhysicalInputBase,
		Event = BREAKOUT.Event,
		ButtonEvent = BREAKOUT.io.ButtonEvent;

	/**
	 * An object to represent a physical button. The advantage of using the Button class over
	 * listening for pin change events on a Pin object, is that the Button class handles debouncing 
	 * and provides helpful button events: Pressed, Released, Long Press and Sustained Press
	 *
	 * @exports Button as BREAKOUT.io.Button
	 * @constructor
	 * @augments BREAKOUT.io.PhysicalInputBase
	 * @param {Pin} pin A reference to the pin the button is connected to.
	 * @param {number} buttonMode The mode of the button (either PULL_DOWN or PULL_UP). 
	 * Default is PULL_DOWN.
	 * @param {number} longPressDelay The delay time in milliseconds before a long press event is fired.
	 *
	 */
	Button = function(pin, buttonMode, longPressDelay) {
		"use strict";
		
		PhysicalInputBase.call(this);

		this.name = "Button"; // for testing
		this._pin = pin;
		
		this.buttonMode = buttonMode || Button.PULL_DOWN;
		this.longPressDelay = longPressDelay || 1000;

		this._debounceInterval = 20,
		this._repeatCount = 0,
		this._timer = null,
		this._timeout = null;
				
		pin.addEventListener(Event.CHANGE, this.onPinChange.bind(this));	
	};


	Button.prototype = BREAKOUT.inherit(PhysicalInputBase.prototype);
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
		
		this._timer = setInterval(this.sustainedPress.bind(this), this.longPressDelay);
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
	 * The debounce time interval in milliseconds.
	 * @name Button#debounceInterval
	 * @property
	 * @type Number
	 */ 
	Button.prototype.__defineGetter__("debounceInterval", function() { return this._debounceInterval; });
	Button.prototype.__defineSetter__("debounceInterval", function(interval) { this._debounceInterval = interval; });
	
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
