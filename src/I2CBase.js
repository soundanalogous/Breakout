/**
 * @author jeff hoefs
 */

/**
 * Creates a new I2CBase base class
 *
 * @constructor
 * @param {Class} board A reference to the Arduino class instance
 * @param {Number} address The I2C address of the device
 * @param {Number} delayUS The number of microseconds ...
 */
function I2CBase(board, address, delayUS) {
	"use strict";

	if (board == undefined) return;

	this.className = "I2CDevice"; 	// for testing
	this.board = board;

	var self = this;
	var _address = address;
	var _delay = delayUS || 0;
	var _delayInMicrosecondsLSB = _delay & 0xFF;
	var _delayInMicrosecondsMSB = (_delay >> 8) & 0xFF;
	var _command;
	var _evtDispatcher = new EventDispatcher(this);
	

	board.addEventListener(ArduinoEvent.SYSEX_MESSAGE, onSysExMessage);
	
	// call this for each board in case delay is set
	board.sendSysex(I2CBase.I2C_CONFIG, [_delayInMicrosecondsLSB, _delayInMicrosecondsMSB]);
		
	// private methods:
	/**
	 * @private
	 */
	function onSysExMessage(event) {
		var message = event.data.message;
		var addr = self.board.getValueFromTwo7bitBytes(message[1], message[2]);
		var data = [];

		if (message[0] != I2CBase.I2C_REPLY) {
			return;
		} else {
			// to do: make sure i2c address in message matches the i2c address of the subclass
			// return if no match;
			if (addr != _address) return;
			
			for (var i=3, len=message.length; i<len; i+=2) {
				data.push(self.board.getValueFromTwo7bitBytes(message[i], message[i+1]));
			}
			self.handleI2C(data);
		}
	}
	
	// public methods:
	
	/**
	 * Send an i2c request command to the board
	 * @protected
	 * @param {Number} command
	 * @param {Number[]} data
	 */
	this.sendI2CRequest = function(data) {

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
		
		self.board.sendSysex(I2CBase.I2C_REQUEST, tempData);
		
	}
	
	/**
	 * @inheritDoc
	 */
	this.update = function() {
		// To be implemented in sublasses	
	}
	
	/**
	 * @inheritDoc
	 */
	this.handleI2C = function(data) {
		// To be implemented in sublasses
		// data should be: slave address, register, data0, data1...
	}
	
	/**
	 * @protected
	 * @return {Number} The command returned by the i2c device
	 */
	this.getCommand = function() {
		return _command;
	}
	
	/**
	 * @protected
	 * @return {Number} The address of the i2c device
	 */
	this.getAddress = function() {
		return _address;
	}
	
	/* implement EventDispatcher */
	
	/**
	 * @param {String} type The event type
	 * @param {Function} listener The function to be called when the event is fired
	 */
	this.addEventListener = function(type, listener) {
		_evtDispatcher.addEventListener(type, listener);
	}
	
	/**
	 * @param {String} type The event type
	 * @param {Function} listener The function to be called when the event is fired
	 */
	this.removeEventListener = function(type, listener) {
		_evtDispatcher.removeEventListener(type, listener);
	}
	
	/**
	 * @param {String} type The event type
	 * return {boolean} True is listener exists for this type, false if not.
	 */
	this.hasEventListener = function(type) {
		return _evtDispatcher.hasEventListener(type);
	}
	
	/**
	 * @param {Event} type The Event object
	 * return {boolean} True if dispatch is successful, false if not.
	 */		
	this.dispatchEvent = function(event) {
		return _evtDispatcher.dispatchEvent(event);
	}
}

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

