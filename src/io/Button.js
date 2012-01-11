/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
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
 	 * @param {String} type The event type	 
	 */
	ButtonEvent = function(type) {

		this.name = "ButtonEvent";

		Event.call(this, type);
	};

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


/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

BREAKOUT.namespace('BREAKOUT.io.Button');

BREAKOUT.io.Button = (function() {

	var Button;

	// dependencies
	var PhysicalInputBase = BREAKOUT.PhysicalInputBase,
		Event = BREAKOUT.Event,
		Pin = BREAKOUT.Pin,
		ButtonEvent = BREAKOUT.io.ButtonEvent;

	/**
	 * An object to represent a physical button. The advantage of using the Button class over
	 * listening for pin change events on a Pin object, is that the Button class handles debouncing 
	 * and provides helpful button events: Pressed, Released, Long Press and Sustained Press
	 *
	 * <p>PULL_UP vs PULL_DOWN. If the other end of the resistor connected to the button is 
	 * connected to ground, configuration is PULL_DOWN, if the resistor is connected to power, 
	 * then the configuration is PULL_UP.</p>
	 *
	 * @exports Button as BREAKOUT.io.Button
	 * @constructor
	 * @augments BREAKOUT.PhysicalInputBase
	 * @param {IOBoard} board A reference to the IOBoard instance
	 * @param {Pin} pin A reference to the Pin the button is connected to.
	 * @param {Number} buttonMode The mode of the button (either Button.PULL_DOWN or 
	 * Button.PULL_UP if wired with external resistors or Button.INTERNAL_PULL_UP if
	 * using the internal pull-up resistors. Default is PULL_DOWN.
	 * @param {Number} sustainedPressInterval The delay time in milliseconds before a sustained press event is fired.
	 *
	 */
	Button = function(board, pin, buttonMode, sustainedPressInterval) {
		"use strict";
		
		PhysicalInputBase.call(this);

		this.name = "Button";
		this._pin = pin;

		var pinNumber = pin.number;
		
		this.buttonMode = buttonMode || Button.PULL_DOWN;
		this._sustainedPressInterval = sustainedPressInterval || 1000;

		this._debounceInterval = 20,
		this._repeatCount = 0,
		this._timer = null,
		this._timeout = null;
		
		this._board = board;
		board.setDigitalPinMode(pinNumber, Pin.DIN);

		if (this.buttonMode === Button.INTERNAL_PULL_UP) {
			// enable internal pull up resistor
			board.enablePullUp(pinNumber);
			// set value to high to avoid initial change event
			this._pin.value = Pin.HIGH;
		}
				
		this._pin.addEventListener(Event.CHANGE, this.onPinChange.bind(this));	
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
		} else if (this.buttonMode === Button.PULL_UP || this.buttonMode === Button.INTERNAL_PULL_UP) {
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
		
		this._timer = setInterval(this.sustainedPress.bind(this), this._sustainedPressInterval);
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
	 * The delay time (in milliseconds) the button must be held before a sustained press event is fired.
	 * @name Button#sustainedPressInterval
	 * @property
	 * @type Number
	 */ 
	Button.prototype.__defineGetter__("sustainedPressInterval", function() { return this._sustainedPressInterval; });
	Button.prototype.__defineSetter__("sustainedPressInterval", function(intervalTime) { this._sustainedPressInterval = intervalTime; });

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
	/** @contstant */
	Button.INTERNAL_PULL_UP = 2;

	return Button;

}());
