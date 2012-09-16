/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.IOBoard');

BO.IOBoard = (function() {

	var IOBoard;

	// Private static constants:

	// Message command bytes (128-255/0x80-0xFF)
	var	DIGITAL_MESSAGE			= 0x90,
		ANALOG_MESSAGE			= 0xE0,
		REPORT_ANALOG			= 0xC0,
		REPORT_DIGITAL			= 0xD0,
		SET_PIN_MODE			= 0xF4,
		REPORT_VERSION			= 0xF9,
		SYSEX_RESET				= 0xFF,
		START_SYSEX				= 0xF0,
		END_SYSEX				= 0xF7;
	
	// Extended command set using sysex (0-127/0x00-0x7F)
	var	SERVO_CONFIG			= 0x70,
		STRING_DATA				= 0x71,
		SHIFT_DATA				= 0x75,
		I2C_REQUEST				= 0x76,
		I2C_REPLY				= 0x77,
		I2C_CONFIG				= 0x78,
		EXTENDED_ANALOG			= 0x6F,
		PIN_STATE_QUERY			= 0x6D,
		PIN_STATE_RESPONSE		= 0x6E,
		CAPABILITY_QUERY		= 0x6B,
		CAPABILITY_RESPONSE		= 0x6C,
		ANALOG_MAPPING_QUERY	= 0x69,
		ANALOG_MAPPING_RESPONSE	= 0x6A,
		REPORT_FIRMWARE			= 0x79,
		SAMPLING_INTERVAL		= 0x7A,
		SYSEX_NON_REALTIME		= 0x7E,
		SYSEX_REALTIME			= 0x7F;

	var MIN_SAMPLING_INTERVAL 	= 10,
		MAX_SAMPLING_INTERVAL 	= 100,
		MULTI_CLIENT = "multiClient";	


	// Dependencies
	var Pin = BO.Pin,
		EventDispatcher = JSUTILS.EventDispatcher,
		PinEvent = BO.PinEvent,
		WSocketEvent = BO.WSocketEvent,
		WSocketWrapper = BO.WSocketWrapper,
		IOBoardEvent = BO.IOBoardEvent;

	/**
	 * Creates a new IOBoard object representing the digital and analog inputs
	 * and outputs of the device as well as support for i2c devices and sending
	 * strings between the IOBoard sketch and your javascript application.
	 *
	 * @exports IOBoard as BO.IOBoard
	 * @class Creates an interface to the I/O board. The IOBoard object brokers
	 * the communication between your application and the physical I/O board.
	 * Currently you can only connect to a single I/O board per computer.
	 * However you could connect to multiple I/O boards if they are attached to
	 * multiple computers on your network. In that case you would create a
	 * separate IOBoard instance for each board you are connecting to in your
	 * network.
	 * @constructor
	 * @param {String} host The host address of the web server.
	 * @param {Number} port The port to connect to on the web server.
	 * Default = false.
	 * @param {String} protocol [optional] The websockt protocol definition (if necessary).
	 */
	IOBoard = function(host, port, protocol) {
		"use strict";
		
		this.name = "IOBoard";
						
		// Private properties
		var _self = this,	// Get a reference to this class
			_socket,
			_inputDataBuffer = [],	
			_digitalPort = [],
			_numPorts,
			_analogPinMapping = [],
			_digitalPinMapping = [],
			_i2cPins = [],
			_ioPins = [],
			_totalPins = 0,
			_samplingInterval = 19, // Default sampling interval
			_isReady = false,
			_firmwareName = "",
			_firmwareVersion = 0,
			_evtDispatcher,
			_isMultiClientEnabled = false,
			_isConfigured = false,
			_debugMode = BO.enableDebugging;
		
		_evtDispatcher = new EventDispatcher(this);

		_socket = new WSocketWrapper(host, port, protocol);
		_socket.addEventListener(WSocketEvent.CONNECTED, onSocketConnection);
		_socket.addEventListener(WSocketEvent.MESSAGE, onSocketMessage);
		_socket.addEventListener(WSocketEvent.CLOSE, onSocketClosed);

		// Private methods:

		/**
		 * @private
		 */
		function onSocketConnection(event) {
			debug("debug: Socket Status: (open)");
			_self.dispatchEvent(new IOBoardEvent(IOBoardEvent.CONNECTED));
			begin();			
		}

		/**
		 * @private
		 */
		function onSocketMessage(event) {
			var pattern = /config/;
			var message = "";

			// Check for config messages from the server
			if (event.message.match(pattern) ) {
				message = event.message.substr(event.message.indexOf(':') + 2);
				processStatusMessage(message);
			} else {
				// We have data from the IOBoard
				processInput(event.message);
			}
		}

		/**
		 * @private
		 */
		function onSocketClosed(event) {
			debug("debug: Socket Status: "+_socket.readyState+" (Closed)");
			_self.dispatchEvent(new IOBoardEvent(IOBoardEvent.DISCONNECTED));
		}
			
		/**
		 * @private
		 */
		function begin() {
			_self.addEventListener(IOBoardEvent.FIRMWARE_NAME, onInitialVersionResult);
			_self.reportFirmware();
		}
		
		/**
		 * @private
		 */
		function onInitialVersionResult(event) {
			_self.removeEventListener(IOBoardEvent.FIRMWARE_NAME, onInitialVersionResult);
			var version = event.version * 10,
				name = event.name;

			debug("debug: Firmware name = " + name + "\t, Firmware version = "+ event.version);
			
			// Make sure the user has uploaded StandardFirmata 2.3 or greater
			if (version >= 23) {
				queryCapabilities();
			} else {
				var err = "error: You must upload StandardFirmata version 2.3 or greater from Arduino version 1.0 or higher";
				console.log(err);
				//throw err;	
			}
		}

		/**
		 * Process a status message from the websocket server
		 * @private
		 */
		function processStatusMessage(message) {
			if (message === MULTI_CLIENT) {
				debug("debug: Multi-client mode enabled");
				_isMultiClientEnabled = true;
			}
		}
		
		/**
		 * @private
		 */
	    function processInput(inputData) {
	    	inputData *= 1; // Force inputData to integer (is there a better way to do this?)
	    	var len;

	    	_inputDataBuffer.push(inputData);
	    	len = _inputDataBuffer.length;
	    	
	    	if (_inputDataBuffer[0] >= 128 && _inputDataBuffer[0] != START_SYSEX) {
	    		if (len === 3) {
	    			processMultiByteCommand(_inputDataBuffer);
	    			// Clear buffer
	    			_inputDataBuffer = [];
	    		}
	    	} else if (_inputDataBuffer[0] === START_SYSEX && _inputDataBuffer[len-1] === END_SYSEX) {
				processSysexCommand(_inputDataBuffer);
	    		// Clear buffer
	    		_inputDataBuffer = [];
	    	} else if (inputData >= 128 && _inputDataBuffer[0] < 128) {
	    		// If for some reason we got a new command and there is already data
	    		// in the buffer, reset the buffer
	    		console.log("warning: Malformed input data... resetting buffer");
	    		_inputDataBuffer = [];
	    		if (inputData !== END_SYSEX) {
	    			_inputDataBuffer.push(inputData);
	    		}
	    	}
	    }
	    
		/**
		 * @private
		 */	    
	    function processMultiByteCommand(commandData) {
	    	var command = commandData[0],
	    		channel;

	    	if (command < 0xF0) {
	    		command = command & 0xF0;
	    		channel = commandData[0] & 0x0F;
	    	}

			switch (command) {
				case DIGITAL_MESSAGE:
					processDigitalMessage(channel, commandData[1], commandData[2]); //(LSB, MSB)
					break;
				case REPORT_VERSION:
					_firmwareVersion = commandData[1] + commandData[2] / 10;
					_self.dispatchEvent(new IOBoardEvent(IOBoardEvent.FIRMWARE_VERSION), {version: _firmwareVersion});
					break;
				case ANALOG_MESSAGE:
					processAnalogMessage(channel, commandData[1], commandData[2]);
					break;
			}
	    }

		/**
		 * @private
		 */
		function processDigitalMessage(port, bits0_6, bits7_13) {
			var offset = port * 8,
				lastPin = offset + 8,
				portVal = bits0_6 | (bits7_13 << 7),
				pinVal,
				pin = {};
			
			if (lastPin >= _totalPins) lastPin = _totalPins;
			
			var j=0;
			for (var i = offset; i < lastPin; i++) {
				pin = _self.getDigitalPin(i);
				// Ignore data send on Firmata startup
				if (pin == undefined) return;
				
				if (pin.getType() == Pin.DIN) {
					pinVal = (portVal >> j) & 0x01;
		    		if (pinVal != pin.value) {
		    			pin.value = pinVal;
		    			_self.dispatchEvent(new IOBoardEvent(IOBoardEvent.DIGITAL_DATA), {pin: pin});
		    		}
		    	}
		    	j++;
		    }
		}	    

		/**
		 * @private
		 */
	    function processAnalogMessage(channel, bits0_6, bits7_13) {
			var analogPin = _self.getAnalogPin(channel);

			// NOTE: Is there a better way to handle this? This issue is on
			// browser refresh the IOBoard board is still sending analog data
			// if analog reporting was set before the refresh. Analog reporting
			// won't be disabled by systemReset systemReset() is called. There
			// is not a way to call that method fast enough so the following
			// code is needed. An alternative would be to set a flag that
			// prevents critical operations before systemReset has completed.
			if (analogPin === undefined) {
				return;
			}
			// Map analog input values from 0-1023 to 0.0-1.0
			// To Do: Add maxADCValue property to Pin or IOBoard object to
			// support ADC values > 1023?
			// maxADCValue could be set during configuration routine if it's
			// supported by Firmata in the future.
			analogPin.value = _self.getValueFromTwo7bitBytes(bits0_6, bits7_13)/1023;
			if (analogPin.value != analogPin.lastValue) {
				_self.dispatchEvent(new IOBoardEvent(IOBoardEvent.ANALOG_DATA), {pin: analogPin});
			}	    	
	    }

		/**
		 * @private
		 */
	    function processSysexCommand(sysexData) {
	    	// Remove the first and last element from the array
	    	// since these are the START_SYSEX and END_SYSEX 
	    	sysexData.shift();
	    	sysexData.pop();

	    	var command = sysexData[0];
			switch (command) {
				case REPORT_FIRMWARE:
					processQueryFirmwareResult(sysexData);
					break;
				case STRING_DATA:
					processSysExString(sysexData);
					break;
				case CAPABILITY_RESPONSE:
					processCapabilitiesResponse(sysexData);
					break;
				case PIN_STATE_RESPONSE:
					processPinStateResponse(sysexData);
					break;
				case ANALOG_MAPPING_RESPONSE:
					processAnalogMappingResponse(sysexData);
					break;
				default:
					// Custom sysEx message
					_self.dispatchEvent(new IOBoardEvent(IOBoardEvent.SYSEX_MESSAGE), {message: sysexData});
					break;
			}
	    }
		
		/**
		 * @private
		 */
		function processQueryFirmwareResult(msg) {
			var	data;
			for (var i = 3; i < msg.length; i += 2)
			{
				data = String.fromCharCode(msg[i]);
				data += String.fromCharCode(msg[i+1]);
				_firmwareName += data;
			}
			_firmwareVersion = msg[1] + msg[2] / 10;
			_self.dispatchEvent(new IOBoardEvent(IOBoardEvent.FIRMWARE_NAME), {name: _firmwareName, version: _firmwareVersion});
		}
		
		/**
		 * @private
		 */
		function processSysExString(msg) {
			var str = "",
				data,
				len = msg.length;

			for (var i = 1; i < len; i += 2) {
				data = String.fromCharCode(msg[i]);
				data += String.fromCharCode(msg[i+1]);
				str += data.charAt(0);
			}
			_self.dispatchEvent(new IOBoardEvent(IOBoardEvent.STRING_MESSAGE), {message: str});
		}
			
		/** 
		 * Auto configure using capabilities response.
		 * This creates a configuration for any board in the Firmata boards.h 
		 * file.
		 *
		 * @private
		 */
		function processCapabilitiesResponse(msg) {
			// If running in multi-client mode and this client is already 
			// configured, ignore capabilities response
			if (_isConfigured) return;

			var pinCapabilities = {},
				byteCounter = 1, // Skip 1st byte because it's the command
				pinCounter = 0,
				analogPinCounter = 0,
				len = msg.length,
				type,
				pin;
					
			// Create default configuration
			while (byteCounter <= len) {
				// 127 denotes end of pin's modes
				if (msg[byteCounter] == 127) {
					
					// Is digital pin mapping even necessary anymore?
					_digitalPinMapping[pinCounter] = pinCounter;
					type = undefined;
					
					// Assign default types
					if (pinCapabilities[Pin.DOUT]) {
						// Map digital pins
						type = Pin.DOUT;
					}
					
					if (pinCapabilities[Pin.AIN]) {
						type = Pin.AIN;
						// Map analog input pins
						_analogPinMapping[analogPinCounter++] = pinCounter;
					}
					
					pin = new Pin(pinCounter, type);
					pin.setCapabilities(pinCapabilities);
					managePinListener(pin);
					_ioPins[pinCounter] = pin;
					
					// Store the 2 i2c pin numbers if they exist
					// To Do: allow for more than 2 i2c pins on a board?
					// How to identify SDA-SCL pairs in that case?
					if (pin.getCapabilities()[Pin.I2C]) {
						_i2cPins.push(pin.number);
					}
					
					pinCapabilities = {};
					pinCounter++;
					byteCounter++;
				} else {
					// Create capabilities object (mode: resolution) for each 
					// mode supported by each pin
					pinCapabilities[msg[byteCounter]] = msg[byteCounter + 1];
					byteCounter += 2;
				}
			}
			
			_numPorts = Math.ceil(pinCounter / 8);
			debug("debug: Num ports = " + _numPorts);
			
			// Initialize port values
			for (var j = 0; j < _numPorts; j++) {
				_digitalPort[j] = 0;
			}
			
			_totalPins = pinCounter;
			debug("debug: Num pins = " + _totalPins);

			// Map the analog pins to the board pins
			// This will map the IOBoard analog pin numbers (printed on IOBoard)
			// to their digital pin number equivalents
			queryAnalogMapping();
		}

		/**
		 * Map map analog pins to board pin numbers. Need to do this because
		 * the capability query does not provide the correct order of analog
		 * pins.
		 *
		 * @private
		 */
		function processAnalogMappingResponse(msg) {
			// If running in multi-client mode and this client is 
			// already configured ignore analog mapping response
			if (_isConfigured) return;

			var len = msg.length;
			for (var i = 1; i < len; i++) {
				if (msg[i] != 127) {
					_analogPinMapping[msg[i]] = i - 1;
					_self.getPin(i-1).setAnalogNumber(msg[i]);
				}
			}
			
			if (!_isMultiClientEnabled) {
				startupInSingleClientMode();
			} else {
				startupInMultiClientMode()
			}
		}

		/**
		 * Single client mode is the default mode.
		 * Checking the "Enable multi-client" box in the Breakout Server UI
		 * to enable multi-client mode.
		 * 
		 * @private
		 */
		function startupInSingleClientMode() {
			// Perform a soft reset of the board
			// the board state will be reset to its default state
			debug("debug: System reset");
			systemReset();

			// Delay to allow systemReset function to execute in StandardFirmata
			setTimeout(startup, 500);			
		}			
		
		/**
		 * Single client mode is the default mode.
		 * Checking the "Enable multi-client" box in the Breakout Server UI to
		 * enable multi-client mode.
		 * 
		 * @private
		 */		
		function startupInMultiClientMode() {
			// Populate pin values with the current IOBoard state
			for (var i = 0; i < _self.getPinCount(); i++) {
				queryPinState(_self.getDigitalPin(i));
			}

			// Wait for the pin states to finish updating
			setTimeout(startup, 500);
			_isConfigured = true;
		}	
				
		/**
		 * @private
		 */
		function startup() {
			debug("debug: IOBoard ready");
			_isReady = true;
			_self.dispatchEvent(new IOBoardEvent(IOBoardEvent.READY));
			_self.enableDigitalPins();
		}
		
		/**
		 * Resets the board to its default state without physically resetting
		 * the board.
		 *
		 * @private
		 */
		function systemReset() {
			_self.send(SYSEX_RESET);
		}	
			
		/**
		 *
		 * @private
		 */
		function processPinStateResponse(msg) {
			// If running in multi-client mode and this client is 
			// already configured ignore pin state response
			if (_isConfigured) return;
						
			var len = msg.length,
				pinNumber = msg[1],
				pinType = msg[2],
				value,
				pin = _ioPins[pinNumber];

			if (len > 4) {
				// Get value
				value = _self.getValueFromTwo7bitBytes(msg[3], msg[4]);
			} else if (len > 3) {
				value = msg[3];
			}
			
			if (pin.getType() != pinType) {
				pin.setType(pinType);
				managePinListener(pin);
			}
			if (pin.value != value) {
				pin.value = value;
			}
			
			_self.dispatchEvent(new IOBoardEvent(IOBoardEvent.PIN_STATE_RESPONSE), {pin: pin});
		}
				
		/**
		 * Convert char to decimal value.
		 * 
		 * @private
		 */
		function toDec(ch) {
			ch = ch.substring(0, 1);
			var decVal = ch.charCodeAt(0);		
			return decVal;
		}
		
		/**
		 * Called when ever a pin value is set via pin.value = someValue.
		 * Sends digital or analog output pin and output values to the IOBoard.
		 *
		 * @private
		 * @param {Event} event A reference to the event object (Pin in this
		 * case).
		 */
		 function sendOut(event) {
		 	var type = event.target.getType(),
		 		pinNum = event.target.number,
		 		value = event.target.value;
		 	
		 	switch(type) {
		 		case Pin.DOUT:
		 			sendDigitalData(pinNum, value);
		 		break;
		 		case Pin.AOUT:
		 			sendAnalogData(pinNum, value);
		 		break;
		 		case Pin.SERVO:
		 			sendServoData(pinNum, value);
		 		break;
		 	}
		 }
		 
		/**
		 * Ensure that event listeners are properly managed for pin objects 
		 * as the pin type is changed during the execution of the program.
		 *
		 * @private
		 */	 
		function managePinListener(pin) {
			if (pin.getType() == Pin.DOUT || pin.getType() == Pin.AOUT || pin.getType() == Pin.SERVO) {
				if (!pin.hasEventListener(PinEvent.CHANGE)) {
					pin.addEventListener(PinEvent.CHANGE, sendOut);
				}
			} else {
				if (pin.hasEventListener(PinEvent.CHANGE)) {
					try {
						pin.removeEventListener(PinEvent.CHANGE, sendOut);
					} catch (e) {
						// Pin had reference to other handler, ignore
						debug("debug: Caught pin removeEventListener exception");
					}
				}
			}
		}
		
		/**
		 * @private
		 */
		function sendAnalogData(pin, value) {

			var pwmMax = _self.getDigitalPin(pin).maxPWMValue;
			value *= pwmMax;
			value = (value < 0) ? 0: value;
			value = (value > pwmMax) ? pwmMax : value;

			if (pin > 15 || value > Math.pow(2, 14)) {
				sendExtendedAnalogData(pin, value);
			} else {
				_self.send([ANALOG_MESSAGE | (pin & 0x0F), value & 0x007F,(value >> 7) & 0x007F]);
			}
		}

		/**
		 * @private
		 */	
		function sendExtendedAnalogData(pin, value) {
			var analogData = [];
			
			// If > 16 bits
			if (value > Math.pow(2, 16)) {
				var err = "error: Extended Analog values > 16 bits are not currently supported by StandardFirmata";
				console.log(err);
				throw err;
			}
			
			analogData[0] = START_SYSEX;
			analogData[1] = EXTENDED_ANALOG;
			analogData[2] = pin;
			analogData[3] = value & 0x007F;
		 	analogData[4] = (value >> 7) & 0x007F;	// Up to 14 bits
					
		 	// If > 14 bits
		 	if (value >= Math.pow(2, 14)) {
		 		analogData[5] = (value >> 14) & 0x007F;
		 	}
		 	
			analogData.push(END_SYSEX);
			_self.send(analogData);
		}
		
		/**
		 * @private
		 */
		function sendDigitalData(pin, value) {
			var portNum = Math.floor(pin / 8);

			if (value == Pin.HIGH) {
				// Set the bit
				_digitalPort[portNum] |= (value << (pin % 8));
			}
			else if (value == Pin.LOW) {
				// Clear the bit
				_digitalPort[portNum] &= ~(1 << (pin % 8));
			}
			else {
				console.log("warning: Invalid value passed to sendDigital, value must be 0 or 1.");
				return; // Invalid value
			}
			
			_self.sendDigitalPort(portNum, _digitalPort[portNum]);	
		}
		
		/**
		 * @private
		 */	
		function sendServoData(pin, value) {
			var servoPin = _self.getDigitalPin(pin);
			if (servoPin.getType() == Pin.SERVO && servoPin.lastValue != value) {
				sendAnalogData(pin, value);
			}	
		}	
		
		/**
		 * Query the cababilities and current state any board running Firmata.
		 * 
		 * @private
		 */
		function queryCapabilities() {
			_self.send([START_SYSEX,CAPABILITY_QUERY,END_SYSEX]);
		}

		/**
		 * Query which pins correspond to the analog channels
		 *
		 * @private
		 */
		function queryAnalogMapping() {
			_self.send([START_SYSEX,ANALOG_MAPPING_QUERY,END_SYSEX]);
		};
		
		/**
		 * Query the current configuration and state of any pin. Making this
		 * private for now.
		 * @private
		 * @param {Pin} pin The Pin to be queried
		 */
		function queryPinState(pin) {
			// To Do: Ensure that pin is a Pin object
			var pinNumber = pin.number;
			_self.send([START_SYSEX,PIN_STATE_QUERY,pinNumber,END_SYSEX]);
		};			
		
		/**
		 * Call this method to enable or disable analog input for the specified
		 * pin.
		 *
		 * @private
		 * @param {Number} pin The pin connected to the analog input
		 * @param {Number} mode Pin.ON to enable input or Pin.OFF to disable
		 * input for the specified pin.
		 */
		function setAnalogPinReporting(pin, mode) {
			_self.send([REPORT_ANALOG | pin, mode]);
			_self.getAnalogPin(pin).setType(Pin.AIN);
		};

		/**
		 * for debugging
		 * @private
		 */
		function debug(str) {
			if (_debugMode) {
				console.log(str); 
			}
		}	

		// Getters and setters:

		/**
		 * Get or set the sampling interval (how often to run the main loop on
		 * the IOBoard). Normally the sampling interval should not be changed. 
		 * Default = 19 (ms).
		 *
		 * @name IOBoard#samplingInterval
		 * @property
		 * @type Number
		 */ 
		this.__defineGetter__("samplingInterval", function() { return _samplingInterval; });
		this.__defineSetter__("samplingInterval", function(interval) {
			if (interval >= MIN_SAMPLING_INTERVAL && interval <= MAX_SAMPLING_INTERVAL) {
				_samplingInterval = interval;
				_self.send([START_SYSEX,SAMPLING_INTERVAL, interval & 0x007F, (interval >> 7) & 0x007F, END_SYSEX]);
			} else {
				// To Do: Throw error?
				console.log("warning: Sampling interval must be between " + MIN_SAMPLING_INTERVAL + " and " + MAX_SAMPLING_INTERVAL);
			}
		});
		
		/**
		 * Set to true when the IOBoard is ready. This can be used in place of
		 * listening for the IOBoardEvent.READY event when creating an app with
		 * a draw loop (such as when using processing.js or three.js);
		 *
		 * @name IOBoard#isReady
		 * @property
		 * @type Boolean
		 */ 
		this.__defineGetter__("isReady", function() { return _isReady; });				
		
		// Public methods:
		
		/**
		 * A utility class to assemble a single value from the 2 bytes returned
		 * from the IOBoard (since data is passed in 7 bit Bytes rather than 
		 * 8 bit it must be reassembled. This is to be used as a protected
		 * method and should not be needed in any application level code.
		 *
		 * @private
		 * @param {Number} lsb The least-significant byte of the 2 values to
		 * be concatentated
		 * @param {Number} msb The most-significant byte of the 2 values to be
		 * concatenated
		 * @return {Number} The result of merging the 2 bytes
		 */
		this.getValueFromTwo7bitBytes = function(lsb, msb) {
			return (msb <<7) | lsb;
		};
		
		/**
		 * @return {WSocketWrapper} A reference to the WebSocket
		 */
		this.getSocket = function() { return _socket };
			
		/**
		 * Request the Firmata version implemented in the firmware (sketch)
		 * running on the IOBoard.
		 * Listen for the IOBoard.FIRMWARE_VERSION event to be notified of when 
		 * the Firmata version is returned from the IOBoard.
		 */	
		this.reportVersion = function() {
			_self.send(REPORT_VERSION);
		};
		
		/**
		 * Request the name of the firmware (the sketch) running on the IOBoard.
		 * Listen for the IOBoard.FIRMWARE_NAME event to be notified of when 
		 * the name is returned from the IOBoard. The version number is also
		 * returned.
		 */
		this.reportFirmware = function() {
			_self.send([START_SYSEX,REPORT_FIRMWARE,END_SYSEX]);
		};
		
		/**
		 * Disables digital pin reporting for all digital pins.
		 */
		this.disableDigitalPins = function() {
			for (var i = 0; i < _numPorts; i++) {
				_self.sendDigitalPortReporting(i, Pin.OFF);
			}
		};
		
		/**
		 * Enables digital pin reporting for all digital pins. You must call
		 * this before you can receive digital pin data from the IOBoard.
		 */
		this.enableDigitalPins = function() {
			for (var i = 0; i < _numPorts; i++) {
				_self.sendDigitalPortReporting(i, Pin.ON);
			}
		};
		
		/**
		 * Enable or disable reporting of all digital pins for the specified
		 * port.
		 * 
		 * @param {Number} mode Either Pin.On or Pin.OFF
		 */
		this.sendDigitalPortReporting = function(port, mode) {
			_self.send([(REPORT_DIGITAL | port), mode]);
		};
		
		/**
		 * Call this method to enable analog input for the specified pin.
		 *
		 * @param {Number} pin The pin connected to the analog input
		 */
		this.enableAnalogPin = function(pin) {
			setAnalogPinReporting(pin, Pin.ON);
		};

		/**
		 * Call this method to disable analog input for the specified pin.
		 *
		 * @param {Number} pin The pin connected to the analog input
		 */
		this.disableAnalogPin = function(pin) {
			setAnalogPinReporting(pin, Pin.OFF);
		};
		
		/**
		 * Set the specified digital pin mode. 
		 *
		 * @param {Number} pin The number of the pin. When using and analog
		 * pin as a digital pin, refer the datasheet for your board to obtain 
		 * the digital pin equivalent of the analog pin number. For example on 
		 * an Arduino UNO, analog pin 0 = digital pin 14.
		 * @param {Number} mode Pin.DIN, Pin.DOUT, Pin.PWM, Pin.SERVO,
		 * Pin.SHIFT, or Pin.I2c
		 */
		this.setDigitalPinMode = function(pinNumber, mode) {
			_self.getDigitalPin(pinNumber).setType(mode);
			managePinListener(_self.getDigitalPin(pinNumber));
			
			_self.send([SET_PIN_MODE, pinNumber, mode]);			
		};

		/**
		 * Enable the internal pull-up resistor for the specified pin number.
		 *
		 * @param {Number} pinNum The number of the input pin to enable the
		 * pull-up resistor.
		 */
		this.enablePullUp = function(pinNum) {
			sendDigitalData(pinNum, Pin.HIGH);
		};

		/**
		 * @return {String} The name of the firmware running on the IOBoard.
		 */
		this.getFirmwareName = function() {
			// To Do: It seams that Firmata is reporting the Firmware
			// name malformed.
			return _firmwareName;
		};
		
		/**
		 * @return {String} The version of the firmware running on the
		 * IOBoard.
		 */
		this.getFirmwareVersion = function() {
			return _firmwareVersion;
		};

		/**
		 * @return {Array} The capabilities of the Pins on the IOBoard.
		 */
		this.getPinCapabilities = function() {
			var capabilities = [];
			var modeNames = {
				0:"input",
				1:"output",
				2:"analog",
				3:"pwm",
				4:"servo",
				5:"shift",
				6:"i2c"
				};
			for (var i = 0; i < _ioPins.length; i++) {
				var pinElements = [];
				var j = 0;
				for (var mode in _ioPins[i].getCapabilities()) {
					var pinElement = [];
					if (mode >= 0) {
						pinElement[0] = modeNames[mode];
						pinElement[1] = _ioPins[i].getCapabilities()[mode];
					}
					pinElements[j] = pinElement;
					j++;
				}
				capabilities[i] =  pinElements;
			}
			return capabilities;
		};

		/**
		 * Send the digital values for a port. Making this private for now.
		 *
		 * @private
		 * @param {Number} portNumber The number of the port
		 * @param {Number} portData A byte representing the state of the 8 pins
		 * for the specified port
		 */
		this.sendDigitalPort = function(portNumber, portData) {
			_self.send([DIGITAL_MESSAGE | (portNumber & 0x0F), portData & 0x7F, portData >> 7]);
		};
		
		/**
		 * Send a string message to the IOBoard. This is useful if you have a
		 * custom sketch running on the IOBoard rather than StandardFirmata
		 * and want to communicate with your javascript message via string
		 * messages that you then parse in javascript.
		 * You can receive string messages as well.
		 *
		 * <p>To test, load the EchoString.pde example from Firmata->Examples
		 * menu in the IOBoard Application, then use sendString("your string
		 * message") to have it echoed back to your javascript application.</p>
		 * 
		 * @param {String} str The string message to send to the IOBoard
		 */
		this.sendString = function(str) {
			// Convert chars to decimal values
			var decValues = [];
			for (var i=0, len=str.length; i<len; i++) {
				decValues.push(toDec(str[i]) & 0x007F);
				decValues.push((toDec(str[i]) >> 7) & 0x007F);
			}
			// Data > 7 bits in length must be split into 2 bytes and  
			// packed into an array before passing to the sendSysex
			// method
			this.sendSysex(STRING_DATA, decValues);
		};
		
		/**
		 * Send a sysEx message to the IOBoard. This is useful for sending
		 * custom sysEx data to the IOBoard, for example if you are not using
		 * StandardFirmata. You would likely use it in a class rather than 
		 * calling it from your main application.
		 *
		 * @private
		 * @param {Number} command The sysEx command value (see firmata.org)
		 * @param {Number[]} data A packet of data representing the sysEx
		 * message to be sent
		 * @see <a href="http://firmata.org/wiki/Protocol#Sysex_Message_Format">Firmata Sysex Message Format"</a>
		 */
		this.sendSysex = function(command, data) {
			var sysexData = [];
			sysexData[0] = START_SYSEX;
			sysexData[1] = command;
			// This would be problematic since the sysEx message format does
			// not enforce splitting all bytes after the command byte
			//for (var i=0, len=data.length; i<len; i++) {
			//	sysexData.push(data[i] & 0x007F);
			//	sysexData.push((data[i] >> 7) & 0x007F);				
			//}
			
			for (var i=0, len=data.length; i<len; i++) {
				sysexData.push(data[i]);			
			}
			sysexData.push(END_SYSEX);
			
			_self.send(sysexData);		
		};
					
		/**
		 * Call to associate a pin with a connected servo motor. See the
		 * documentation for your servo motor for the minimum and maximum 
		 * pulse width. If you can't find it, then the default values should
		 * be close enough so call sendServoAttach(pin) omitting the min and
		 * max values.
		 *
		 * @param {Number} pin The pin the server is connected to.
		 * @param {Number} minPulse [optional] The minimum pulse width for the
		 * servo. Default = 544.
		 * @param {Number} maxPulse [optional] The maximum pulse width for the
		 * servo. Default = 2400.
		 */
		this.sendServoAttach = function(pin, minPulse, maxPulse) {
			var servoPin,
				servoData = [];

			minPulse = minPulse || 544; 	// Default value = 544
			maxPulse = maxPulse || 2400;	// Default value = 2400
		
			servoData[0] = START_SYSEX;
			servoData[1] = SERVO_CONFIG;
			servoData[2] = pin;
			servoData[3] = minPulse % 128;
			servoData[4] = minPulse >> 7;
			servoData[5] = maxPulse % 128;
			servoData[6] = maxPulse >> 7;	
			servoData[7] = END_SYSEX;
			
			_self.send(servoData);
		
			servoPin = _self.getDigitalPin(pin);
			servoPin.setType(Pin.SERVO);
			managePinListener(servoPin);	
		};
						
		/**
		 * @private
		 * @return {Pin} An unmapped reference to the Pin object.
		 */
		this.getPin = function(pinNumber) {
			return _ioPins[pinNumber];
		};
		
		/**
		 * @return {Pin} A reference to the Pin object (mapped to the IOBoard
		 * board analog pin).
		 */	
		this.getAnalogPin = function(pinNumber) {
			return _ioPins[_analogPinMapping[pinNumber]];
		};
		
		/**
		 * @return {Pin} A reference to the Pin object (mapped to the IOBoard
		 * board digital pin).
		 */	
		this.getDigitalPin = function(pinNumber) {
			return _ioPins[_digitalPinMapping[pinNumber]];
		};

		/**
		 * Use this method to obtain the digital pin number equivalent 
		 * for an analog pin.
		 *
		 * @example
		 * // set analog pin A3 on an Arduino Uno to digital input
		 * board.setDigitalPinMode(board.analogToDigital(3), Pin.DIN);
		 * 
		 * <p>board.analogToDigital(3) returns 17 which is the digital
		 * equivalent of the analog pin</p>
		 *
		 * @return {Number} The digital pin number equivalent for the specified
		 * analog pin number.
		 */	
		this.analogToDigital = function(analogPinNumber) {
			return _self.getAnalogPin(analogPinNumber).number;	
		};
		
		/**
		 * @return {Number} Total number of pins
		 */
		this.getPinCount = function() {
			return _totalPins;
		};
		
		/**
		 * @return {Number[]} The pin numbers of the i2c pins if the board has
		 * i2c.
		 * Returns undefined if the board does not have i2c pins.
		 * @private (internal only)
		 */
		this.getI2cPins = function() {
			return _i2cPins;
		};
		
		/**
		 * Call this method to print the capabilities for all pins to 
		 * the console.
		 */
		this.reportCapabilities = function() {
			var modeNames = {
				0:"input",
				1:"output",
				2:"analog",
				3:"pwm",
				4:"servo",
				5:"shift",
				6:"i2c"
				};
			for (var i = 0; i < _ioPins.length; i++) {
				for (var mode in _ioPins[i].getCapabilities()) {
					console.log("Pin " + i + "\tMode: " + modeNames[mode] + "\tResolution (# of bits): " + _ioPins[i].getCapabilities()[mode]);
				}
			}
		};

		/**
		 * A wrapper for the send method of the WebSocket
		 * I'm not sure there is a case for the user to call this method
		 * So I'm making this private for now.
		 *
		 * @private
		 * @param {Number[]} message Message data to be sent to the IOBoard
		 */
		this.send = function(message) {
			_socket.sendString(message);
		};
		
		/**
		 * A wrapper for the close method of the WebSocket. Making this 
		 * private until a use case arises.
		 *
		 * @private
		 */
		this.close = function() {
			_socket.close();
		};

		
		// Implement EventDispatcher
		
		/**
		 * @param {String} type The event type
		 * @param {Function} listener The function to be called when the event
		 * is fired
		 */
		this.addEventListener = function(type, listener) {
			_evtDispatcher.addEventListener(type, listener);
		};
		
		/**
		 * @param {String} type The event type
		 * @param {Function} listener The function to be called when the event
		 * is fired
		 */
		this.removeEventListener = function(type, listener) {
			_evtDispatcher.removeEventListener(type, listener);
		};
		
		/**
		 * @param {String} type The event type
		 * return {boolean} True is listener exists for this type, false if not.
		 */
		this.hasEventListener = function(type) {
			return _evtDispatcher.hasEventListener(type);
		};
		
		/**
		 * @param {Event} type The Event object
		 * @param {Object} optionalParams Optional parameters to assign to the
		 * event object.
		 * return {boolean} True if dispatch is successful, false if not.
		 */		
		this.dispatchEvent = function(event, optionalParams) {
			return _evtDispatcher.dispatchEvent(event, optionalParams);
		};
	};

	// Document events

	/**
	 * The ioBoardReady event is dispatched when the board is ready to
	 * send and receive commands. 
	 * @name IOBoard#ioBoardReady
	 * @type BO.IOBoardEvent.READY
	 * @event
	 * @param {IOBoard} target A reference to the IOBoard
	 */

	/**
	 * The ioBoardConnected event is dispatched when the websocket 
	 * connection is established.
	 * @name IOBoard#ioBoardConnected
	 * @type BO.IOBoardEvent.CONNECTED
	 * @event
	 * @param {IOBoard} target A reference to the IOBoard
	 */

	/**
	 * The ioBoardDisconnected event is dispatched when the websocket
	 * connection is closed.
	 * @name IOBoard#ioBoardDisconnected
	 * @type BO.IOBoardEvent.DISCONNECTED
	 * @event
	 * @param {IOBoard} target A reference to the IOBoard
	 */	 
	 
	/**
	 * The stringMessage event is dispatched when a string is received
	 * from the IOBoard.
	 * @name IOBoard#stringMessage
	 * @type BO.IOBoardEvent.STRING_MESSAGE
	 * @event
	 * @param {IOBoard} target A reference to the IOBoard
	 * @param {String} message The string message received from the IOBoard
	 */

	/**
	 * The sysexMessage event is dispatched when a sysEx message is 
	 * received from the IOBoard.
	 * @name IOBoard#sysexMessage
	 * @type BO.IOBoardEvent.SYSEX_MESSAGE
	 * @event
	 * @param {IOBoard} target A reference to the IOBoard
	 * @param {Array} message The sysEx data
	 */
	 
	/**
	 * The firmwareVersion event is dispatched when the firmware version
	 * is received from the IOBoard.
	 * @name IOBoard#firmwareVersion
	 * @type BO.IOBoardEvent.FIRMWARE_VERSION
	 * @event
	 * @param {IOBoard} target A reference to the IOBoard
	 * @param {Number} version The firmware version (where Firmata 2.3 = 23)
	 */
	 
	/**
	 * The firmwareName event is dispatched when the firmware name is
	 * received from the IOBoard.
	 * @name IOBoard#firmwareName
	 * @type BO.IOBoardEvent.FIRMWARE_NAME
	 * @event
	 * @param {IOBoard} target A reference to the IOBoard
	 * @param {String} name The name of the firmware running on the IOBoard
	 * @param {Number} version The firmware version (where Firmata 2.3 = 23)
	 */	 	 	 
	 
	/**
	 * The pinStateResponse event is dispatched when the results of
	 * a pin state query (via a call to: queryPinState()) is received.
	 * @name IOBoard#pinStateResponse
	 * @type BO.IOBoardEvent.PIN_STATE_RESPONSE
	 * @event
	 * @param {IOBoard} target A reference to the IOBoard
	 * @param {BO.Pin} pin A reference to the pin object.
	 */

	/**
	 * The analogData event is dispatched when analog data is received
	 * from the IOBoard. Use thie event to be notified when any analog
	 * pin value changes. Use Pin.CHANGE to be notified when a specific
	 * pin value changes.
	 * @name IOBoard#analogData
	 * @type BO.IOBoardEvent.ANALOG_DATA
	 * @event
	 * @param {IOBoard} target A reference to the IOBoard
	 * @param {BO.Pin} pin A reference to the pin object.
	 */
	 
	/**
	 * The digitalData event is dispatched when digital data is received
	 * from the IOBoard. Use this event to be notified when any digital
	 * pin value changes. Use Pin.CHANGE to be notified when a specific
	 * pin value changes.
	 * @name IOBoard#digitalData
	 * @type BO.IOBoardEvent.DIGITAL_DATA
	 * @event
	 * @param {IOBoard} target A reference to the IOBoard
	 * @param {BO.Pin} pin A reference to the pin object.
	 */
	 
	return IOBoard;

}());
