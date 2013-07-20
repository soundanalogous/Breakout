/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.io.MagnetometerEvent');

BO.io.MagnetometerEvent = (function () {

    var MagnetometerEvent;

    // dependencies
    var Event = JSUTILS.Event;

    /**
     * An Event object to be dispatched (fired) by a Magnetometer
     * object.
     * @class MagnetometerEvent
     * @constructor
     * @extends JSUTILS.Event
     * @param {String} type The event type   
     */
    MagnetometerEvent = function (type) {

        Event.call(this, type);

        this.name = "MagnetometerEvent";

    };

    /**
     * @property MagnetometerEvent.UPDATE
     * @static
     */
    MagnetometerEvent.UPDATE = "update";
    

    MagnetometerEvent.prototype = JSUTILS.inherit(Event.prototype);
    MagnetometerEvent.prototype.constructor = MagnetometerEvent;

    return MagnetometerEvent;

}());
