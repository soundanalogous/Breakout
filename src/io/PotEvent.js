/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.io.PotEvent');

BO.io.PotEvent = (function () {

    var PotEvent;

    // Dependencies
    var Event = JSUTILS.Event;

    /**
     * An Event object to be dispatched (fired) by a Potentiometer
     * object.
     * @class PotEvent
     * @constructor
     * @extends JSUTILS.Event
     * @param {String} type The event type
     */
    PotEvent = function (type) {

        this.name = "PotEvent";
        
        // Call the super class
        // 2nd parameter is passed to EventDispatcher constructor
        Event.call(this, type);
    };

    // Events
    /**
     * @property PotEvent.CHANGE
     * @static
     */
    PotEvent.CHANGE = "potChange";

    PotEvent.prototype = JSUTILS.inherit(Event.prototype);
    PotEvent.prototype.constructor = PotEvent;

    return PotEvent;

}());
