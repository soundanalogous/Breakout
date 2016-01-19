/**
 * Copyright (c) 2015 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.SerialEvent');

BO.SerialEvent = (function() {

  var SerialEvent;

  // Dependencies
  var Event = JSUTILS.Event;

  /**
   * An Event object to be dispatched (fired) by a Serial object.
   * @class SerialEvent
   * @constructor
   * @extends JSUTILS.Event
   * @param {String} type The event type
   */
  SerialEvent = function(type) {

    this.name = "SerialEvent";

    // Call the super class
    // 2nd parameter is passed to EventDispatcher constructor
    Event.call(this, type);
  };

  // Events
  /**
   * @property SerialEvent.DATA
   * @static
   */
  SerialEvent.DATA = "data";

  SerialEvent.prototype = JSUTILS.inherit(Event.prototype);
  SerialEvent.prototype.constructor = SerialEvent;

  return SerialEvent;

}());
