/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('JSUTILS.TimerEvent');

JSUTILS.TimerEvent = (function () {

    var TimerEvent;

    // Dependencies
    var Event = JSUTILS.Event;

    /**
     * An Event object to be dispatched (fired) by a Timer object.
     * 
     * @class TimerEvent
     * @constructor    
     * @extends JSUTILS.Event
     * @param {String} type The event type
     */
    TimerEvent = function (type) {

        this.name = "TimerEvent";

        Event.call(this, type);
    };

    /** 
     * @property TimerEvent.TIMER
     * @static
     */
    TimerEvent.TIMER = "timerTick";
    /** 
     * @property TimerEvent.TIMER_COMPLETE
     * @static
     */
    TimerEvent.TIMER_COMPLETE = "timerComplete";

    TimerEvent.prototype = JSUTILS.inherit(Event.prototype);
    TimerEvent.prototype.constructor = TimerEvent;

    return TimerEvent;

}());
