/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.io.AccelerometerEvent');

BO.io.AccelerometerEvent = (function () {

    var AccelerometerEvent;

    // dependencies
    var Event = JSUTILS.Event;

    /**
     * An Event object to be dispatched (fired) by an Accelerometer object.
     * @class AccelerometerEvent
     * @constructor
     * @extends JSUTILS.Event
     * @param {String} type The event type   
     */
    AccelerometerEvent = function (type) {

        Event.call(this, type);

        this.name = "AccelerometerEvent";

    };

    /**
     * @property AccelerometerEvent.UPDATE 
     * @static
     */
    AccelerometerEvent.UPDATE = "update";
    

    AccelerometerEvent.prototype = JSUTILS.inherit(Event.prototype);
    AccelerometerEvent.prototype.constructor = AccelerometerEvent;

    return AccelerometerEvent;

}());
