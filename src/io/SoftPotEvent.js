/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.io.SoftPotEvent');

BO.io.SoftPotEvent = (function () {

    var SoftPotEvent;

    // Dependencies
    var Event = JSUTILS.Event;

    /**
     * An Event object to be dispatched (fired) by a SoftPot
     * @exports An Event object to be dispatched (fired) by a SoftPot
     * object.
     * @class SoftPotEvent
     * @constructor
     * @extends JSUTILS.Event
     * @param {String} type The event type
     * @param {Number} touchPoint The value where the softpot was touched    
     */
    SoftPotEvent = function (type, touchPoint) {

        this.name = "SoftPotEvent";

        Event.call(this, type);
        this._touchPoint = touchPoint;
    };

    /**
     * @property SoftPotEvent.PRESS
     * @static
     */
    SoftPotEvent.PRESS = "softPotPressed";
    /**
     * @property SoftPotEvent.RELEASE
     * @static
     */
    SoftPotEvent.RELEASE = "softPotRelease";
    /**
     * @property SoftPotEvent.DRAG
     * @static
     */
    SoftPotEvent.DRAG = "softPotDrag";
    /**
     * @property SoftPotEvent.FLICK_UP
     * @static
     */
    SoftPotEvent.FLICK_UP = "softPotFlickUp";
    /**
     * @property SoftPotEvent.FLICK_DOWN
     * @static
     */
    SoftPotEvent.FLICK_DOWN = "softPotFlickDown";
    /**
     * @property SoftPotEvent.TAP
     * @static
     */
    SoftPotEvent.TAP = "softPotTap";

    SoftPotEvent.prototype = JSUTILS.inherit(Event.prototype);
    SoftPotEvent.prototype.constructor = SoftPotEvent;

    /**
     * The value of the softpot.
     * @property value
     * @type Number
     */
    Object.defineProperty(SoftPotEvent.prototype, "value", {
        get: function () {
            return this._touchPoint;
        },
        set: function (val) {
            this._touchPoint = val;
        }
    });

    return SoftPotEvent;

}());
