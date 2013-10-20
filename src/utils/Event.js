/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('JSUTILS.Event');

/**
 * @namespace JSUTILS
 */
JSUTILS.Event = (function () {

    var Event;

    /** 
     * A base class for the creation of Event objects.
     *
     * @class Event
     * @constructor
     * @param {String} type event type
     */
    Event = function (type) {

        this._type = type;
        this._target = null;

        this.name = "Event";
    };

    Event.prototype = {

        constructor: Event,
        
        /**
         * The event type
         * @property type
         * @type String
         */
        get type() {
            return this._type;
        },
        set type(val) {
            this._type = val;
        },

        /**
         * The event target
         * @property target
         * @type Object
         */
        get target() {
            return this._target;
        },
        set target(val) {
            this._target = val;
        }

    };

    // Generic events

    /** 
     * @property Event.CONNECTED
     * @static
     */
    Event.CONNECTED = "connected";
    /** 
     * @property Event.CHANGE
     * @static
     */
    Event.CHANGE    = "change";
    /** 
     * @property Event.COMPLETE
     * @static
     */
    Event.COMPLETE  = "complete";

    return Event;

}());
