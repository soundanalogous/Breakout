/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.io.GyroEvent');

BO.io.GyroEvent = (function () {

    var GyroEvent;

    // dependencies
    var Event = JSUTILS.Event;

    /**
     * An Event object to be dispatched (fired) by a Gyroscope
     * object.
     * @class GyroEvent
     * @constructor
     * @extends JSUTILS.Event
     * @param {String} type The event type   
     */
    GyroEvent = function (type) {

        Event.call(this, type);

        this.name = "GyroEvent";

    };

    /**
     * @property GyroEvent.GYRO_READY
     * @static
     */
    GyroEvent.GYRO_READY = "gyroReady";
    /**
     * @property GyroEvent.UPDATE
     * @static
     */
    GyroEvent.UPDATE = "update";
    

    GyroEvent.prototype = JSUTILS.inherit(Event.prototype);
    GyroEvent.prototype.constructor = GyroEvent;

    return GyroEvent;

}());
