/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.io.ButtonEvent');

BO.io.ButtonEvent = (function () {

    var ButtonEvent;

    // Dependencies
    var Event = JSUTILS.Event;

    /**
     * An Event object to be dispatched (fired) by a Button
     * object.
     * @class ButtonEvent
     * @constructor
     * @extends JSUTILS.Event
     * @param {String} type The event type   
     */
    ButtonEvent = function (type) {

        this.name = "ButtonEvent";

        Event.call(this, type);
    };

    /**
     * @property ButtonEvent.PRESS
     * @static
     */
    ButtonEvent.PRESS = "pressed";
    /**
     * @property ButtonEvent.RELEASE
     * @static
     */
    ButtonEvent.RELEASE = "released";
    /**
     * @property ButtonEvent.LONG_PRESS
     * @static
     */
    ButtonEvent.LONG_PRESS = "longPress";
    /**
     * @property ButtonEvent.SUSTAINED_PRESS
     * @static
     */
    ButtonEvent.SUSTAINED_PRESS = "sustainedPress";

    ButtonEvent.prototype = JSUTILS.inherit(Event.prototype);
    ButtonEvent.prototype.constructor = ButtonEvent;

    return ButtonEvent;

}());
