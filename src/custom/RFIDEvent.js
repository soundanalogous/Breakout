/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */
 
JSUTILS.namespace('BO.custom.RFIDEvent');

BO.custom.RFIDEvent = (function () {
    "use strict";

    var RFIDEvent;

    // dependencies
    var Event = JSUTILS.Event;

    /**
     * An Event object to be dispatched when an RFID tag is read or when an RFID
     * tag is removed from a reader.
     * @class RFIDEvent
     * @constructor
     * @extends JSUTILS.Event
     * @param {String} type The event type
     * @param {String} tag The RFID tag value (hexadecimal)
     */
    RFIDEvent = function (type, tag) {
        this._tag = tag;
        // call the super class
        // 2nd parameter is passed to EventDispatcher constructor
        Event.call(this, type);

        this.name = "RFIDEvent";
    };

    /**
     * @property RFIDEvent.ADD_TAG
     * @static
     */
    RFIDEvent.ADD_TAG = "addTag";
    /**
     * @property RFIDEvent.REMOVE_TAG
     * @static
     */
    RFIDEvent.REMOVE_TAG = "removeTag";

    RFIDEvent.prototype = JSUTILS.inherit(Event.prototype);
    RFIDEvent.prototype.constructor = RFIDEvent;

    /**
     * [read-only] The RFID tag value (hexadecimal string).
     * @property tag
     * @type String
     */
    Object.defineProperty(RFIDEvent.prototype, "tag", {
        get: function () {
            return this._tag;
        }
    });

    return RFIDEvent;

}());