/**
 * Copyright (c) 2011-2014 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.PinEvent');

BO.PinEvent = (function () {

    var PinEvent;

    // Dependencies
    var Event = JSUTILS.Event;

    /**
     * An Event object to be dispatched (fired) by a Pin object.
     * @class PinEvent
     * @constructor
     * @extends JSUTILS.Event
     * @param {String} type The event type
     */
    PinEvent = function (type) {

        this.name = "PinEvent";
        
        // Call the super class
        // 2nd parameter is passed to EventDispatcher constructor
        Event.call(this, type);
    };

    // Events
    /**
     * @property PinEvent.CHANGE
     * @static
     */
    PinEvent.CHANGE = "pinChange";
    /**
     * @property PinEvent.RISING_EDGE
     * @static
     */
    PinEvent.RISING_EDGE = "risingEdge";
    /**
     * @property PinEvent.FALLING_EDGE
     * @static
     */
    PinEvent.FALLING_EDGE = "fallingEdge";
    

    PinEvent.prototype = JSUTILS.inherit(Event.prototype);
    PinEvent.prototype.constructor = PinEvent;

    return PinEvent;

}());
