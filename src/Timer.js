/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

BREAKOUT.namespace('BREAKOUT.TimerEvent');

BREAKOUT.TimerEvent = (function() {

	var TimerEvent;

	// dependencies
	var Event = BREAKOUT.Event;

	/**
	 * @exports TimerEvent as BREAKOUT.TimerEvent
	 * @constructor
	 * @augments BREAKOUT.Event
 	 * @param {String} type The event type	 
	 */
	TimerEvent = function(type) {

		this.name = "TimerEvent";

		Event.call(this, type);
	};

	/** @constant */
	TimerEvent.TIMER = "timerTick";
	/** @constant */
	TimerEvent.TIMER_COMPLETE = "timerComplete";

	TimerEvent.prototype = BREAKOUT.inherit(Event.prototype);
	TimerEvent.prototype.constructor = TimerEvent;

	return TimerEvent;

}());


/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

BREAKOUT.namespace('BREAKOUT.Timer');

BREAKOUT.Timer = (function() {

	var Timer;

	// dependencies
	var TimerEvent = BREAKOUT.TimerEvent,
		EventDispatcher = BREAKOUT.EventDispatcher;

	/**
	 * An as3-like Timer object
	 *
	 * @exports Timer as BREAKOUT.Timer
	 * @constructor
	 * @augments BREAKOUT.EventDispatcher	 
	 * @param {Number} delay The delay (ms) interval between ticks
	 * @param {Number} repeatCount The number of number of ticks.
	 * A value of zero will set the timer to repeat forever. Default = 0
	 */
	Timer = function(delay, repeatCount) {

		EventDispatcher.call(this, this);

		this.name = "Timer";

		this._count = 0;
		this._delay = delay;
		this._repeatCount = repeatCount || 0;
		this._isRunning = false;

		this._timer = null;
	};

	Timer.prototype = BREAKOUT.inherit(EventDispatcher.prototype);
	Timer.prototype.constructor = Timer;


	/**
	 * The delay interval in milliseconds.
	 * @name Timer#delay
	 * @property
	 * @type Number
	 */ 
	Timer.prototype.__defineGetter__("delay", function() { return this._delay; });
	Timer.prototype.__defineSetter__("delay", function(val) { 
		this._delay = val;
		this.stop();
		this.start(); 
	});	

	/**
	 * The repeat count in milliseconds.
	 * @name Timer#repeatCount
	 * @property
	 * @type Number
	 */ 
	Timer.prototype.__defineGetter__("repeatCount", function() { return this._repeatCount; });
	Timer.prototype.__defineSetter__("repeatCount", function(val) { 
		this._repeatCount = val;
		this.stop();
		this.start(); 
	});

	/**
	 * [read-only] Returns true if the timer is running.
	 * @name Timer#running
	 * @property
	 * @type Number
	 */ 
	Timer.prototype.__defineGetter__("running", function() { return this._isRunning; });

	/**
	 * [read-only] Returns the current count (number of ticks since timer started).
	 * @name Timer#currentCount
	 * @property
	 * @type Number
	 */ 
	Timer.prototype.__defineGetter__("currentCount", function() { return this._count; });

	/**
	 * Start the timer.
	 */
	Timer.prototype.start = function() {
		if (this._timer === null) {
			this._timer = setInterval(this.onTick.bind(this), this._delay);
			this._isRunning = true;
		}
	};

	/**
	 * Stop the timer and reset the count to zero.
	 */
	Timer.prototype.reset = function() {
		this.stop();
		this._count = 0;
	};

	/**
	 * Stop the timer.
	 */
	Timer.prototype.stop = function() {
		if (this._timer !== null) {
			clearInterval(this._timer);
			this._timer = null;
			this._isRunning = false;
		}
	};

	/**
	 * @private
	 */
	Timer.prototype.onTick = function() {
		this._count = this._count + 1;
		if (this._repeatCount !== 0 && this._count > this._repeatCount) {
			this.stop();
			this.dispatchEvent(new TimerEvent(TimerEvent.TIMER_COMPLETE));
		} else {
			this.dispatchEvent(new TimerEvent(TimerEvent.TIMER));
		}
	};

	return Timer;

}());

