/**
 * Copyright (c) 2016 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.Serial');

/**
 * @namespace BO
 */
BO.Serial = (function() {
  "use strict";

  var Serial;

  var SERIAL_MESSAGE = 0x60;
  var CONFIG = 0x10;
  var WRITE = 0x20;
  var READ = 0x30;
  var REPLY = 0x40;
  var CLOSE = 0x50;
  var FLUSH = 0x60;
  var LISTEN = 0x70;

  var READ_CONTINUOUS = 0x00;
  var STOP_READING = 0x01;

  // dependencies
  var EventDispatcher = JSUTILS.EventDispatcher;
  var IOBoardEvent = BO.IOBoardEvent;
  var SerialEvent = BO.SerialEvent;

  /**
   * Enables use of Hardware (UART) and Software serial ports on the board.
   *
   * @class Serial
   * @constructor
   * @uses JSUTILS.EventDispatcher
   * @param {Object} opts Options:
   * <ul>
   * <li><strong>board</strong> {IOBoard} A reference to the IOBoard instance.</li>
   * <li><strong>port</strong> {Number} The serial port to use (HW_SERIAL1, HW_SERIAL2, HW_SERIAL3, SW_SERIAL0,
   *   SW_SERIAL1, SW_SERIAL2, SW_SERIAL3)</li>
   * <li><strong>baud</strong> {Number} The baud rate of the serial port. Default = 57600.</li>
   * <li><strong>rxPin</strong> {Number} [SoftwareSerial only] The RX pin of the SoftwareSerial instance</li>
   * <li><strong>txPin</strong> {Number} [SoftwareSerial only] The TX pin of the SoftwareSerial instance</li>
   * </ul>
   *
   * @example
   *     // Use a SoftwareSerial instance
   *     var serial = new BO.Serial({
   *       board: arduino,
   *       port: BO.Serial.SW_SERIAL0,
   *       baud: 57600,
   *       txPin: 10,
   *       rxPin: 11
   *     });
   *     serial.addEventListener(BO.SerialEvent.DATA, function (event) {
   *       console.log(event.data);
   *     });
   *     serial.startReading();
   *
   * @example
   *     // Use a HardwareSerial instance (pins RX1, TX1 on Leonardo, Mega, Due, etc)
   *     var serial = new BO.Serial({
   *       board: arduino,
   *       port: BO.Serial.HW_SERIAL1,
   *       baud: 57600
   *     });
   *     serial.addEventListener(BO.SerialEvent.DATA, function (event) {
   *       console.log(event.data);
   *     });
   *     serial.startReading();
   */
  Serial = function(opts) {
    if (typeof opts === "undefined" ||
      typeof opts.board === "undefined" ||
      typeof opts.port === "undefined") {
      throw new Error("Serial options board and port must be defined.");
    }

    this.name = "Serial";
    this.board = opts.board;
    this.port = opts.port;
    this.baud = opts.baud || 57600;
    this.txPin = opts.txPin;
    this.rxPin = opts.rxPin;

    this._evtDispatcher = new EventDispatcher(this);

    this.board.addEventListener(IOBoardEvent.SYSEX_MESSAGE, this.onSysExMessage.bind(this));

    var configData = [
      CONFIG | this.port,
      this.baud & 0x007F, (this.baud >> 7) & 0x007F, (this.baud >> 14) & 0x007F
    ];
    if (this.port > 7 && typeof this.txPin !== "undefined" && typeof this.rxPin !== "undefined") {
      configData.push(this.rxPin);
      configData.push(this.txPin);
    } else if (this.port > 7) {
      throw new Error("Both RX and TX pins must be defined when using SoftwareSerial.");
    }

    this.board.sendSysex(SERIAL_MESSAGE, configData);
  };

  Serial.prototype = {

    constructor: Serial,

    /**
     * Handle incoming sysex message.
     * @private
     */
    onSysExMessage: function(event) {
      var message = event.message;
      var data = [];

      if (message[0] !== SERIAL_MESSAGE) {
        return;
      } else {
        if (message[1] === (REPLY | this.port)) {
          for (var i = 2, len = message.length; i < len; i += 2) {
            data.push(this.board.getValueFromTwo7bitBytes(message[i], message[i + 1]));
          }
          this.dispatchEvent(new SerialEvent(SerialEvent.DATA), {
            data: data,
            portId: this.port
          });
        }
      }
    },

    /**
     * Write an array of data.
     * @method write
     * @param {Number|Array} val A single byte or an array of bytes to write
     */
    write: function(val) {
      var txData = [];
      var data = [];
      if (!Array.isArray(val)) {
        data.push(val);
      } else {
        data = val;
      }
      txData.push(WRITE | this.port);
      for (var i = 0, len = data.length; i < len; i++) {
        txData.push(data[i] & 0x007F);
        txData.push((data[i] >> 7) & 0x007F);
      }
      if (txData.length > 0) {
        this.board.sendSysex(SERIAL_MESSAGE, txData);
      }
    },

    /**
     * Start reading the serial port.
     * @method startReading
     * @param {Number} maxBytesToRead [optional] The number of bytes to read on each iteration
     * of the main loop.
     */
    startReading: function(maxBytesToRead) {
      var data = [];
      if (typeof maxBytesToRead === "undefined") {
        maxBytesToRead = 0;
      }
      data.push(READ | this.port);
      data.push(READ_CONTINUOUS);
      data.push(maxBytesToRead & 0x007F);
      data.push((maxBytesToRead >> 7) & 0x007F);
      this.board.sendSysex(SERIAL_MESSAGE, data);
    },

    /**
     * Stop reading the serial port.
     * @method stopReading
     */
    stopReading: function() {
      this.board.sendSysex(SERIAL_MESSAGE, [READ | this.port, STOP_READING]);
    },

    /**
     * Close the serial port. A new instance must be created in order
     * to reopen the port.
     * @method close
     */
    close: function() {
      this.board.sendSysex(SERIAL_MESSAGE, [CLOSE | this.port]);
    },

    /**
     * For HardwareSerial, waits for the transmission of outgoing serial data
     * to complete.
     * For SoftwareSerial, removes any buffered incoming serial data.
     * @method flush
     */
    flush: function() {
      this.board.sendSysex(SERIAL_MESSAGE, [FLUSH | this.port]);
    },

    /**
     * For SoftwareSerial only. Only a single SoftwareSerial instance can read data at a time.
     * Call this method to set this port to be the reading port in the case there are multiple
     * SoftwareSerial instances.
     * @method listen
     */
    listen: function() {
      if (this.port < 8) {
        return;
      }
      this.board.sendSysex(SERIAL_MESSAGE, [LISTEN | this.port]);
    },

    /* implement EventDispatcher */

    /**
     * @param {String} type The event type
     * @param {Function} listener The function to be called when the event is fired
     */
    addEventListener: function(type, listener) {
      this._evtDispatcher.addEventListener(type, listener);
    },

    /**
     * @param {String} type The event type
     * @param {Function} listener The function to be called when the event is fired
     */
    removeEventListener: function(type, listener) {
      this._evtDispatcher.removeEventListener(type, listener);
    },

    /**
     * @param {String} type The event type
     * return {boolean} True is listener exists for this type, false if not.
     */
    hasEventListener: function(type) {
      return this._evtDispatcher.hasEventListener(type);
    },

    /**
     * @param {Event} type The Event object
     * @param {Object} optionalParams Optional parameters to assign to the event object.
     * return {boolean} True if dispatch is successful, false if not.
     */
    dispatchEvent: function(event, optionalParams) {
      return this._evtDispatcher.dispatchEvent(event, optionalParams);
    }
  };

  /**
   * Not currently used. Corresponds to the default Arduino Serial port
   * @property Serial.HW_SERIAL0
   * @static
   */
  Serial.HW_SERIAL0 = 0x00;
  /**
   * Pins RX1 and TX1 on the board
   * @property Serial.HW_SERIAL1
   * @static
   */
  Serial.HW_SERIAL1 = 0x01;
  /**
   * Pins RX2 and TX2 on the board
   * @property Serial.HW_SERIAL2
   * @static
   */
  Serial.HW_SERIAL2 = 0x02;
  /**
   * Pins RX3 and TX3 on the board
   * @property Serial.HW_SERIAL3
   * @static
   */
  Serial.HW_SERIAL3 = 0x03;

  /**
   * One of four software serial instances
   * @property Serial.SW_SERIAL0
   * @static
   */
  Serial.SW_SERIAL0 = 0x08;
  /**
   * One of four software serial instances
   * @property Serial.SW_SERIAL1
   * @static
   */
  Serial.SW_SERIAL1 = 0x09;
  /**
   * One of four software serial instances
   * @property Serial.SW_SERIAL2
   * @static
   */
  Serial.SW_SERIAL2 = 0x10;
  /**
   * One of four software serial instances
   * @property Serial.SW_SERIAL3
   * @static
   */
  Serial.SW_SERIAL3 = 0x11;

  return Serial;

}());
