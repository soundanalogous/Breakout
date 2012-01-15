/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

BREAKOUT.namespace('BREAKOUT.io.SoftPotEvent');

BREAKOUT.io.SoftPotEvent = (function() {

	var SoftPotEvent;

	// dependencies
	var Event = BREAKOUT.Event;

	/**
	 * @exports SoftPotEvent as BREAKOUT.io.SoftPotEvent
	 * @constructor
	 * @augments BREAKOUT.Event
 	 * @param {String} type The event type
 	 * @param {Number} touchPoint The value where the softpot was touched	 
	 */
	SoftPotEvent = function(type, touchPoint) {

		this.name = "SoftPotEvent";

		Event.call(this, type);
		this._touchPoint = touchPoint;
	};

	/** @constant */
	SoftPotEvent.PRESS = "softPotPressed";
	/** @constant */
	SoftPotEvent.RELEASE = "softPotRelease";
	/** @constant */
	SoftPotEvent.DRAG = "softPotDrag";
	/** @constant */
	SoftPotEvent.FLICK_UP = "softPotFlickUp";
	/** @constant */
	SoftPotEvent.FLICK_DOWN = "softPotFlickDown";
	/** @constant */
	SoftPotEvent.TAP = "softPotTap";		

	SoftPotEvent.prototype = BREAKOUT.inherit(Event.prototype);
	SoftPotEvent.prototype.constructor = SoftPotEvent;

	/**
	 * The value of the softpot.
	 * @name SoftPotEvent#value
	 * @property
	 * @type Number
	 */ 
	SoftPotEvent.prototype.__defineGetter__("value", function() { return this._touchPoint; });	
	SoftPotEvent.prototype.__defineSetter__("value", function(val) { this._touchPoint = val; });

	return SoftPotEvent;

}());


/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

BREAKOUT.namespace('BREAKOUT.io.SoftPot');

BREAKOUT.io.SoftPot = (function() {

	var SoftPot;

	// private static constants:
	var	TAP_TIMEOUT				= 200,
		FLICK_TIMEOUT			= 200,
		PRESS_TIMER_INTERVAL	= 10,
		DEBOUNCE_TIMEOUT		= 20;	

	// dependencies
	var PhysicalInputBase = BREAKOUT.PhysicalInputBase,
		Pin = BREAKOUT.Pin,
		Event = BREAKOUT.Event,
		Scaler = BREAKOUT.filters.Scaler,
		Timer = BREAKOUT.Timer,
		TimerEvent = BREAKOUT.TimerEvent,
		SoftPotEvent = BREAKOUT.io.SoftPotEvent;

	/**
	 * A softpot analog sensor.
	 *
	 * @exports SoftPot as BREAKOUT.io.SoftPot
	 * @constructor
	 * @augments BREAKOUT.PhysicalInputBase
	 * @param {IOBoard} board A reference to the IOBoard instance
	 * @param {Pin} pin A reference to the Pin the softpot is connected to.
	 * @param {Number} softPotLength The length of the softpot in mm 
	 *
	 */
	SoftPot = function(board, pin, softPotLength) {
		"use strict";
		
		PhysicalInputBase.call(this);

		this.name = "SoftPot";
		this._pin = pin;

		softPotLength = softPotLength || 100;

		this._isDrag = false;
		this._flickDistance = 0;
		this._touchPoint = 0;
		this._lastMovePoint = 0;
		this._isTouched = false;
		this._distanceFromPressed = 0;
		this._minFlickMovement = 1.0/softPotLength * 2.5;
		this._minDragMovement = 1.0/softPotLength * 1.0;
		
		this._board = board;
		board.enableAnalogPin(this._pin.analogNumber);

		this._debugMode = false;
						
		this._pin.addEventListener(Event.CHANGE, this.onPinChange.bind(this));

		this._pressTimer = new Timer(PRESS_TIMER_INTERVAL, 0);
		this._flickTimer = new Timer(FLICK_TIMEOUT, 1);
	};


	SoftPot.prototype = BREAKOUT.inherit(PhysicalInputBase.prototype);
	SoftPot.prototype.constructor = SoftPot;

	/**
	 * @private
	 * @param {Event} evt Event.CHANGE
	 */
	SoftPot.prototype.onPinChange = function(evt) {
		var val = evt.target.value;

		if (val === 0) {
			this.onRelease();
		} else {
			if (!this._isTouched) {
				this.startTouch(val);
				this._lastMovePoint = val;
			} else {
				this.onMove(val);
			}
		}
	};

	/**
	 * @private
	 * @param {Number} touchPoint The value where the touch is occuring on the strip
	 */
	SoftPot.prototype.setMinFlickMovement = function(num) {
		this._minFlickMovement = num;	
	};
	
	/**
	 * @private
	 */
	SoftPot.prototype.startTouch = function(touchPoint) {
		
		this._pressTimer.reset();
		this._pressTimer.start();
		
		// where we pressed
		this._touchPoint = touchPoint;
		this.dispatch(SoftPotEvent.PRESS);
		
		this._isTouched = true;
		this._isDrag = false;	
	};

	/**
	 * @private
	 */
	SoftPot.prototype.onRelease = function() {		

			var dispatchedFlick = false; 
			
			// discard unintentional touch / noise
			if (this._pressTimer.currentCount > DEBOUNCE_TIMEOUT / PRESS_TIMER_INTERVAL) {
				// must meet minimum time requirement for flick  
				if (this._flickTimer.running) {
					if (this._flickDir > 0) {
						this.dispatch(SoftPotEvent.FLICK_DOWN);
					} else {
						this.dispatch(SoftPotEvent.FLICK_UP);
					}	
					dispatchedFlick = true; 
					
				} 
							
				if (!dispatchedFlick) {
			
					// check for presses  
					if (this._pressTimer.running) {
				
						// if less than tap timeout, then it is a tap 
						if (!this._isDrag && this._pressTimer.currentCount <= TAP_TIMEOUT / PRESS_TIMER_INTERVAL) {
							this.dispatch(SoftPotEvent.TAP);
						}
					} 
				}
			}

			this.dispatch(SoftPotEvent.RELEASE);

			this.resetForNext(); 
	};
	
	/**
	 * @private
	 * @param {Number} touchPoint The value where the touch is occuring on the strip
	 */
	SoftPot.prototype.onMove = function(touchPoint) {		
	
		this._touchPoint = touchPoint;		
					
		// save current point 		
		var curMovePoint = touchPoint; 
		
		// flick handeling 			
		this._flickDistance = Math.abs(curMovePoint - this._lastMovePoint) 
		
		if (!this._isDrag && this._flickDistance > this._minFlickMovement ) {
			this._flickTimer.reset(); 
			this._flickTimer.start(); 
			
			if(curMovePoint - this._lastMovePoint > 0) {
				this._flickDir = 1;
			} else {
				this._flickDir = -1;
			}
			
			this._isDrag = false; 
		}			
		
		var dragDistance = Math.abs(curMovePoint - this._lastMovePoint);				

		// dragging handler 
		// dont check when flick timer is running
		//console.log("min drag = " + this._minDragMovement);
		if ((dragDistance > this._minDragMovement) && (this._flickTimer.running === false)) {
			this._isDrag = true; 
		}
		
		if (this._isDrag) {
			this.dispatch(SoftPotEvent.DRAG);
			this._distanceFromPressed = curMovePoint - this._lastMovePoint;
		}
								
		this.debug("SoftPot: distance traveled flick is " + this._flickDistance); 
		this.debug("SoftPot: distance traveled drag is " + dragDistance); 

		
		// reuse for next 
		this._lastMovePoint = curMovePoint; 
			
	};

	/**
	 * Scale from the minimum and maximum input values to 0.0 -> 1.0.
	 *
	 * @param {Number} minimum The minimum value
	 * @param {Number} maximum The maximum value
	 */
	SoftPot.prototype.setRange = function(minimum, maximum) {
		this._pin.removeAllFilters();
		this._pin.addFilter(new Scaler(mimimum, maximum, 0, 1, Scaler.LINEAR));	
	};

	/**
	 * @private
	 * @type {Event} type The event type
	 */
	SoftPot.prototype.dispatch = function(type) {
		this.debug("SoftPot dispatch " + type);
		this.dispatchEvent(new SoftPotEvent(type, this._touchPoint));	
	};

	/**
	 * reset whenever you need the next Touch point
	 * @private
	 */
	SoftPot.prototype.resetForNext = function() {
		this._flickTimer.stop();
		this._pressTimer.stop();
		this._isTouched = false;
		this._isDrag = false;
	};

	/**
	 * for debugging
	 * @private
	 */
	SoftPot.prototype.debug = function(str) {
		if (this._debugMode) {
			console.log(str); 
		}
	};	
	
	/**
	 * The current value.
	 * @name SoftPot#value
	 * @property
	 * @type Number
	 */ 
	SoftPot.prototype.__defineGetter__("value", function() { return this._touchPoint; });
	
	/**
	 * The current distance from the press point.
	 * @name SoftPot#distanceFromPressed
	 * @property
	 * @type Number
	 */ 
	SoftPot.prototype.__defineGetter__("distanceFromPressed", function() { return this._distanceFromPressed; });
	
	/**
	 * The minimum distance required to trigger a flick event. Change this value to fine tune the flick gesture.
	 * @name SoftPot#minFlickMovement
	 * @property
	 * @type Number
	 */ 
	SoftPot.prototype.__defineGetter__("minFlickMovement", function() { return this._minFlickMovement; });	
	SoftPot.prototype.__defineSetter__("minFlickMovement", function(min) { this._minFlickMovement = min; });		
	
	/**
	 * The minimum distance required to trigger a drag event. Change this value to fine tune the drag response.
	 * @name SoftPot#minDragMovement
	 * @property
	 * @type Number
	 */ 
	SoftPot.prototype.__defineGetter__("minDragMovement", function() { return this._minDragMovement; });	
	SoftPot.prototype.__defineSetter__("minDragMovement", function(min) { this._minDragMovement = min; });


	return SoftPot;

}());
