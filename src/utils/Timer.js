/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('JSUTILS.Timer');

JSUTILS.Timer = (function() {

	var Timer;

	// Dependencies
	var TimerEvent = JSUTILS.TimerEvent,
		EventDispatcher = JSUTILS.EventDispatcher;

	/**
	 * An as3-like Timer object.
	 *
	 * @class The Timer object wraps the window.setInterval() method to provide
	 * an as3-like Timer interface.
	 * @exports Timer as JSUTILS.Timer
	 * @extends JSUTILS.EventDispatcher	 
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

	Timer.prototype = JSUTILS.inherit(EventDispatcher.prototype);
	Timer.prototype.constructor = Timer;


	/**
	 * The delay interval in milliseconds.
	 * 
	 * @name Timer#delay
	 * @type Number
	 */ 
	Timer.prototype.__defineGetter__("delay", function() { return this._delay; });
	Timer.prototype.__defineSetter__("delay", function(val) { 
		this._delay = val;
		if (this._isRunning) {
			this.stop();
			this.start();
		}
	});	

	/**
	 * The repeat count in milliseconds.
	 * 
	 * @name Timer#repeatCount
	 * @type Number
	 */ 
	Timer.prototype.__defineGetter__("repeatCount", function() { return this._repeatCount; });
	Timer.prototype.__defineSetter__("repeatCount", function(val) { 
		this._repeatCount = val;
		if (this._isRunning) {
			this.stop();
			this.start();
		}
	});

	/**
	 * [read-only] Returns true if the timer is running.
	 * 
	 * @name Timer#running
	 * @type Number
	 */ 
	Timer.prototype.__defineGetter__("running", function() { return this._isRunning; });

	/**
	 * [read-only] Returns the current count (number of ticks since timer
	 * started).
	 * 
	 * @name Timer#currentCount
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
	 * Description
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

	// Document events

	/**
	 * The timerTick event is dispatched at the rate specified 
	 * by the delay interval.
	 * @name Timer#timerTick
	 * @type JSUTILS.TimerEvent.TIMER
	 * @event
	 * @param {JSUTILS.Timer} target A reference to the Timer object.
	 */	

	/**
	 * The timerComplete event is dispatched when the repeatCount value
	 * has been reached.
	 * @name Timer#timerComplete
	 * @type JSUTILS.TimerEvent.TIMER_COMPLETE
	 * @event
	 * @param {JSUTILS.Timer} target A reference to the Timer object.
	 */		 

	return Timer;

}());
