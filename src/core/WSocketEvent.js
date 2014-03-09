/**
 * Copyright (c) 2011-2014 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.WSocketEvent');

BO.WSocketEvent = (function () {
    
    var WSocketEvent;

    // dependencies
    var Event = JSUTILS.Event;

    /**
     * Dispatches Websocket events: Connected `onopen`, Message `onmessge`
     * and Closed `onclose` objects.
     * @class WSocketEvent
     * @constructor
     * @extends JSUTILS.Event
     * @param {String} type The event type
     */
    WSocketEvent = function (type) {
        this.name = "WSocketEvent";
        
        // call the super class
        // 2nd parameter is passed to EventDispatcher constructor
        Event.call(this, type);
    };

    // events
    /**
     * @property WSocketEvent.CONNECTED
     * @static
     */
    WSocketEvent.CONNECTED = "webSocketConnected";
    /**
     * @property WSocketEvent.MESSAGE
     * @static
     */
    WSocketEvent.MESSAGE = "webSocketMessage";
    /**
     * @property WSocketEvent.CLOSE
     * @static
     */
    WSocketEvent.CLOSE = "webSocketClosed";

    WSocketEvent.prototype = JSUTILS.inherit(Event.prototype);
    WSocketEvent.prototype.constructor = WSocketEvent;

    return WSocketEvent;

}());