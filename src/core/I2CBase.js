/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.I2CBase');

BO.I2CBase = (function() {
	"use strict";

 	var I2CBase;

 	// dependencies
 	var Pin = BO.Pin,
 		EventDispatcher = JSUTILS.EventDispatcher,
 		IOBoardEvent = BO.IOBoardEvent;

	/**
	 * Creates a new I2CBase base class
	 *
	 * @exports I2CBase as BO.I2CBase
	 * @class A base class for I2C objects. Extend this class
	 * when creating an interface for a new I2C device. I2CBase should
	 * not be instantiated directly.
	 * @constructor
	 * @param {IOBoard} board A reference to the IOBoard instance
	 * @param {Number} address The I2C address of the device
	 * @param {Number} delayUS The number of microseconds ...
	 */
	I2CBase = function(board, address, delayUS) {

		if (board == undefined) return;

		this.name = "I2CBase";
		/** @protected*/
		this.board = board;

		var _delay = delayUS || 0,
			_delayInMicrosecondsLSB = _delay & 0xFF,
			_delayInMicrosecondsMSB = (_delay >> 8) & 0xFF;

		/** @protected */
		this._address = address;
		this._evtDispatcher = new EventDispatcher(this);
		
		// if the pins are not set as I2C, set them now
		var i2cPins = board.getI2cPins();
		if (i2cPins.length == 2) {
			if (board.getPin(i2cPins[0]).getType() != Pin.I2C) {
				board.getPin(i2cPins[0]).setType(Pin.I2C);
				board.getPin(i2cPins[1]).setType(Pin.I2C);
			}
		} else {
			// to do: proper error handling
			console.log("Error, this board does not support i2c");
			return;
		}

		board.addEventListener(IOBoardEvent.SYSEX_MESSAGE, this.onSysExMessage.bind(this));
		
		// call this for each board in case delay is set
		board.sendSysex(I2CBase.I2C_CONFIG, [_delayInMicrosecondsLSB, _delayInMicrosecondsMSB]);
			
	};


	I2CBase.prototype = {

		/**
		 * [read-only] The address of the i2c device.
		 * @name I2CBase#address
		 * @property
		 * @type Number
		 */			 
		get address() {
			return this._address;
		},	

		// private methods:
		/**
		 * @private
		 */
		onSysExMessage: function(event) {
			var message = event.message;
			var addr = this.board.getValueFromTwo7bitBytes(message[1], message[2]);
			var data = [];

			if (message[0] != I2CBase.I2C_REPLY) {
				return;
			} else {
				//console.log(this);
				//console.log("addr = " + this._address);
				// to do: make sure i2c address in message matches the i2c address of the subclass
				// return if no match;
				if (addr != this._address) return;

				for (var i=3, len=message.length; i<len; i+=2) {
					data.push(this.board.getValueFromTwo7bitBytes(message[i], message[i+1]));
				}
				this.handleI2C(data);
			}

		},
		
		// public methods:
		
		/**
		 * Send an i2c request command to the board
		 * @protected
		 * @param {Number} command
		 * @param {Number[]} data
		 */
		sendI2CRequest: function(data) {

			// to do: support 10-bit i2c address
			var tempData = [];
			var address = data[1];
			var readWriteMode = data[0];
			
			tempData[0] = address;
			tempData[1] = readWriteMode << 3;
			
			for (var i=2, len=data.length; i<len; i++) {
				tempData.push(data[i] & 0x007F);
				tempData.push((data[i] >> 7) & 0x007F);				
			}
			
			this.board.sendSysex(I2CBase.I2C_REQUEST, tempData);
			
		},
	
		/**
		 * @protected
		 * @inheritDoc
		 */
		update: function() {
			// To be implemented in sublasses	
		},
		
		/**
		 * @protected
		 * @inheritDoc
		 */
		handleI2C: function(data) {
			// To be implemented in sublasses
			// data should be: slave address, register, data0, data1...
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
	

	/** @constant */
	I2CBase.I2C_REQUEST = 0x76;
	/** @constant */
	I2CBase.I2C_REPLY = 0x77;
	/** @constant */
	I2CBase.I2C_CONFIG = 0x78;

	/** @constant */
	I2CBase.WRITE = 0;
	/** @constant */
	I2CBase.READ = 1;
	/** @constant */
	I2CBase.READ_CONTINUOUS = 2;
	/** @constant */
	I2CBase.STOP_READING = 3;

	return I2CBase;

}());