/**
 * Copyright (c) 2011-2014 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.IOBoardEvent');

BO.IOBoardEvent = (function () {

    var IOBoardEvent;

    // Dependencies
    var Event = JSUTILS.Event;

    /**
     * An Event object to be dispatched (fired) by the IOBoard object.
     * The most important event is the READY event which signifies that the
     * I/O board is ready to receive commands from the application. Many of the
     * other IOBoard events are used when creating new io component objects.
     *
     * @class IOBoardEvent
     * @constructor
     * @extends JSUTILS.Event
     * @param {String} type The event type
     */
    IOBoardEvent = function (type) {

        this.name = "IOBoardEvent";
        
        // Call the super class
        // 2nd parameter is passed to EventDispatcher constructor
        Event.call(this, type);
    };

    // Events
    /**
     * @property IOBoardEvent.ANALOG_DATA
     * @static
     */
    IOBoardEvent.ANALOG_DATA = "analogData";
    /**
     * @property IOBoardEvent.DIGITAL_DATA
     * @static
     */
    IOBoardEvent.DIGITAL_DATA = "digitalData";
    /**
     * @property IOBoardEvent.FIRMWARE_VERSION
     * @static
     */
    IOBoardEvent.FIRMWARE_VERSION = "firmwareVersion";
    /**
     * @property IOBoardEvent.FIRMWARE_NAME
     * @static
     */
    IOBoardEvent.FIRMWARE_NAME = "firmwareName";
    /**
     * @property IOBoardEvent.STRING_MESSAGE
     * @static
     */
    IOBoardEvent.STRING_MESSAGE = "stringMessage";
    /**
     * @property IOBoardEvent.SYSEX_MESSAGE
     * @static
     */
    IOBoardEvent.SYSEX_MESSAGE = "sysexMessage";
    /**
     * @property IOBoardEvent.PIN_STATE_RESPONSE
     * @static
     */
    IOBoardEvent.PIN_STATE_RESPONSE = "pinStateResponse";
    /**
     * @property IOBoardEvent.READY
     * @static
     */
    IOBoardEvent.READY = "ioBoardReady";
    /**
     * @property IOBoardEvent.CONNECTED
     * @static
     */
    IOBoardEvent.CONNECTED = "ioBoardConnected";
    /**
     * @property IOBoardEvent.DISCONNECTED
     * @static
     */
    IOBoardEvent.DISCONNECTED = "ioBoardDisonnected";

    IOBoardEvent.prototype = JSUTILS.inherit(Event.prototype);
    IOBoardEvent.prototype.constructor = IOBoardEvent;

    return IOBoardEvent;

}());
