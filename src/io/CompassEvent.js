/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.io.CompassEvent');

BO.io.CompassEvent = (function () {

    var CompassEvent;

    // dependencies
    var Event = JSUTILS.Event;

    /**
     * An Event object to be dispatched (fired) by a Compass object.
     * @class CompassEvent
     * @constructor
     * @extends JSUTILS.Event
     * @param {String} type The event type   
     */
    CompassEvent = function (type) {

        Event.call(this, type);

        this.name = "CompassEvent";

    };

    /**
     * @property CompassEvent.UPDATE 
     * @static
     */
    CompassEvent.UPDATE = "update";
    

    CompassEvent.prototype = JSUTILS.inherit(Event.prototype);
    CompassEvent.prototype.constructor = CompassEvent;

    return CompassEvent;

}());
