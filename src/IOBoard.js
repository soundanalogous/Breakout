// IOBoard.js
// Copyright (C) 2011 Jeff Hoefs.  All rights reserved.
//
// based on:
// Funnel as3 library (http://code.google.com/p/funnel/)
// and as3glue (http://code.google.com/p/as3glue/)

BREAKOUT.namespace('BREAKOUT.IOBoard');

BREAKOUT.IOBoard = (function() {

	var IOBoard;

	// dependencies
	var Pin = BREAKOUT.Pin,
		EventDispatcher = BREAKOUT.EventDispatcher,
		Event = BREAKOUT.Event,
		SocketEvent = BREAKOUT.SocketEvent,
		WSocketWrapper = BREAKOUT.WSocketWrapper,
		IOBoardEvent = BREAKOUT.IOBoardEvent;

	/**
	 * Creates a new IOBoard object representing the digital and analog inputs and
	 * outputs of the device as well as support for sending strings between the IOBoard
	 * sketch and your javascript application. Also support for hardware such as controlling
	 * a servo motor from javascript and additional libraries for an RFID reader with more
	 * to follow such as Button, Accelerometer, i2c device implementation, etc.
	 *
	 * @exports IOBoard as BREAKOUT.IOBoard
	 * @constructor
	 * @param {String} host The host address of the web server.
	 * @param {Number} port The port to connect to on the web server.
	 * @param {String} protocol The websockt protocol definition (if necessary).
	 */
	IOBoard = function(host, port, useSocketIO, protocol) {
		"use strict";
		
		this.name = "IOBoard"; // for testing
				
		// message command bytes (128-255/0x80-0xFF)
		var		DIGITAL_MESSAGE			= 0x90,
				ANALOG_MESSAGE			= 0xE0,
				REPORT_ANALOG			= 0xC0,
				REPORT_DIGITAL			= 0xD0,
				SET_PIN_MODE			= 0xF4,
				REPORT_VERSION			= 0xF9,
				SYSEX_RESET				= 0xFF,
				START_SYSEX				= 0xF0,
				END_SYSEX				= 0xF7;
		
		// extended command set using sysex (0-127/0x00-0x7F)
		var		SERVO_CONFIG			= 0x70,
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
		

		// private properties
		var self = this;	// get a reference to this class
		var host = host;
		var port = port;
		var protocol = protocol || "default-protocol";
		var useSocketIO = useSocketIO || false;
		var socket;
		var _browser = "";
		
		// input processing
		var _executeMultiByteCommand = 0;
		var _multiByteChannel = 0;
		var _storedInputData = [];
		var _sysExData = [];
		var _waitForData = 0;
		
		var _digitalPort = [];
		var _numPorts;
		var _analogPinMapping = [];
		var _digitalPinMapping = [];
		var _i2cPins = [];
		var _ioPins = [];
		var _totalPins = 0;

		var _useSocketIO = false;
		
		var _firmwareVersion = 0;
		
		var _evtDispatcher = new EventDispatcher(this);

		socket = new WSocketWrapper(host, port, useSocketIO, protocol);
		socket.addEventListener(SocketEvent.CONNECTED, onSocketConnection);
		socket.addEventListener(SocketEvent.MESSAGE, onSocketMessage);
		socket.addEventListener(SocketEvent.CLOSE, onSocketClosed);

		// private methods:

		/**
		 * @private
		 */
		function onSocketConnection(event) {
			console.log("Socket Status: (open)");
			self.dispatchEvent(new Event(Event.CONNECTED));
			begin();			
		}

		/**
		 * @private
		 */
		function onSocketMessage(event) {
			processData(event.message);
		}

		/**
		 * @private
		 */
		function onSocketClosed(event) {
			console.log("Socket Status: "+socket.readyState+' (Closed)');
		}
						
								
		/**
		 * @private
		 */
		function begin() {
			self.addEventListener(IOBoardEvent.FIRMWARE_VERSION, onVersion);
			self.reportVersion();
		}
		
		/**
		 * @private
		 */
		function onVersion(event) {
			self.removeEventListener(IOBoardEvent.FIRMWARE_VERSION, onVersion);
			var version = event.version * 10;
			
			// make sure the user has uploaded StandardFirmata 2.3 or greater
			if (version >= 23) {
				queryCapabilities();
			} else {
				// to do: abort script if possible, or use default config for Standard IOBoard
				// pop up an alert dialog instead?
				console.log("You must upload StandardFirmata version 2.3 or greater from IOBoard version 1.0 or higher");
			}
		}	
			
		/**
		 * @private
		 */
		function processData(inputData) {
			inputData *= 1;	// force inputData to integer (is there a better way to do this?)
			var command;
			
			// we have command data
			if (_waitForData > 0 && inputData < 128) {
				_waitForData--;
				// collect the data
				_storedInputData[_waitForData]=inputData;
				// we have all data executeMultiByteCommand
				if (_waitForData == 0) {
					switch (_executeMultiByteCommand) {
						case DIGITAL_MESSAGE:
							processDigitalPortBytes(_multiByteChannel, _storedInputData[1], _storedInputData[0]); //(LSB, MSB)
							break;
						case REPORT_VERSION:
							_firmwareVersion=_storedInputData[1] + _storedInputData[0] / 10;
							self.dispatchEvent(new IOBoardEvent(IOBoardEvent.FIRMWARE_VERSION), {version: _firmwareVersion});
							break;
						case ANALOG_MESSAGE:
							var analogPin = self.getAnalogPin(_multiByteChannel);
							// NOTE: is there a better way to handle this? This issue is on browser refresh
							// the IOBoard board is still sending analog data if analog reporting was set
							// before the refresh. Analog reporting won't be disabled by systemReset systemReset()
							// is called. There is not way to call that method fast enough so the following code is
							// needed. An alternative would be to set a flag that prevents critical operations
							// before systemReset has completed
							if (analogPin == undefined) {
								//console.log("analog pin undefined");
								break;
							}
							// map analog input values from 0-1023 to 0.0 to 1.0
							analogPin.value = self.getValueFromTwo7bitBytes(_storedInputData[1], _storedInputData[0])/1023;
							if (analogPin.value != analogPin.lastValue) {
								// use analog pin number rather than actual pin number
								self.dispatchEvent(new IOBoardEvent(IOBoardEvent.ANALOG_DATA), {pin: analogPin});
							}
							break;
					}
				}
			}
			// we have SysEx command data
			else if (_waitForData < 0) {
				// we have all sysex data
				if (inputData == END_SYSEX) {
					_waitForData = 0;
					switch (_sysExData[0]) {
						case REPORT_FIRMWARE:
							processQueryFirmwareResult(_sysExData);
							break;
						case STRING_DATA:
							processSysExString(_sysExData);
							break;
						case CAPABILITY_RESPONSE:
							processCapabilitiesResponse(_sysExData);
							break;
						case PIN_STATE_RESPONSE:
							processPinStateResponse(_sysExData);
							break;
						case ANALOG_MAPPING_RESPONSE:
							processAnalogMappingResponse(_sysExData);
							break;
						default:
							// custom sysEx message
							self.dispatchEvent(new IOBoardEvent(IOBoardEvent.SYSEX_MESSAGE), {message: _sysExData});
							break;
					}
					_sysExData = [];
				}
				else {
					_sysExData.push(inputData);
				}
			}
			// we have a command
			else {
				// extract the command and channel info from a byte if it is less than 0xF0
				if (inputData < 240) {
					command = inputData & 240;
					_multiByteChannel = inputData & 15;
				}
				else {
					// commands in the 0xF* range don't use channel data
					command = inputData;
				}
				switch (command) {
					case REPORT_VERSION:
					case DIGITAL_MESSAGE:
					case ANALOG_MESSAGE:
						_waitForData = 2;	// 2 bytes needed
						_executeMultiByteCommand = command;
						break;
					case START_SYSEX:
						_waitForData = -1; // n bytes needed
						_executeMultiByteCommand = command;
						break;
					default:
						break;
				}
			}
		}
		
		/**
		 * @private
		 */
		function processDigitalPortBytes(port, bits0_6, bits7_13) {
			var offset = port * 8;
			var lastPin = offset + 8;
			var portVal = bits0_6 | (bits7_13 << 7);
			var pinVal;
			var pin = {};
			
			if (lastPin >= _totalPins) lastPin = _totalPins;
			
			var j=0;
			for (var i=offset; i<lastPin; i++) {
				pin = self.getDigitalPin(i);
				// ignore data send on Firmata startup
				// same for analog?
				if (pin == undefined) return;
				
				if (pin.type == Pin.DIN) {
					pinVal = (portVal >> j) & 0x01;
		    		if (pinVal != pin.value) {
		    			pin.value = pinVal;
		    			self.dispatchEvent(new IOBoardEvent(IOBoardEvent.DIGITAL_DATA), {pin: pin});
		    		}
		    	}
		    	j++;
		    }
		}
		
		/**
		 * @private
		 */
		function processQueryFirmwareResult(msg) {
			var fname ="";
			var data;
			for (var i = 3; i < msg.length; i+=2)
			{
				data = String.fromCharCode(msg[i]);
				data += String.fromCharCode(msg[i+1]);
				fname += data;
			}
			_firmwareVersion=msg[1] + msg[2] / 10;
			self.dispatchEvent(new IOBoardEvent(IOBoardEvent.FIRMWARE_NAME), {name: fname, version: _firmwareVersion});
			
		}
		
		/**
		 * @private
		 */
		function processSysExString(msg) {
			var str = "";
			var data;
			for (var i = 1; i < msg.length; i+=2) {
				data = String.fromCharCode(msg[i]);
				data += String.fromCharCode(msg[i+1]);		
				str+=data.charAt(0);
			}
			self.dispatchEvent(new IOBoardEvent(IOBoardEvent.STRING_MESSAGE), {message: str});
		}
			
		/** 
		 * Auto configure using capabilities response
		 * This should create a configuration for any board in the Firmata boards.h file
		 *
		 * @private
		 */
		function processCapabilitiesResponse(msg) {
			var pinCapabilities = {};
			var byteCounter = 1; // skip 1st byte because it's the command
			var pinCounter = 0;
			var analogPinCounter = 0;
			var len = msg.length;
			var type;
					
			// create default configuration
			while (byteCounter <= len) {
				// 127 denotes end of pin's modes
				if (msg[byteCounter] == 127) {
					
					// is digital pin mapping even necessary anymore?
					_digitalPinMapping[pinCounter] = pinCounter;
					type = undefined;
					
					// assign default types
					if (pinCapabilities[Pin.DOUT]) {
						// map digital pins
						type = Pin.DOUT;
					}
					
					if (pinCapabilities[Pin.AIN]) {
						type = Pin.AIN;
						// map analog input pins
						_analogPinMapping[analogPinCounter++] = pinCounter;
					} 
					
					var pin = new Pin(pinCounter, type);
					pin.capabilities = pinCapabilities;
					managePinListener(pin);
					_ioPins[pinCounter] = pin;
					
					// store the 2 i2c pin numbers if they exist
					if (pin.capabilities[Pin.I2C]) {
						_i2cPins.push(pin.number);
					}
					
					pinCapabilities = {};
					pinCounter++;
					byteCounter++;
				} else {
					// create capabilities object (mode: resolution) for each  mode
					// supported by each pin
					pinCapabilities[msg[byteCounter]] = msg[byteCounter + 1];
					byteCounter += 2;
				}
			}
			
			_numPorts = Math.ceil(pinCounter / 8);
			console.log("debug: num ports = " + _numPorts);
			
			// initialize port values
			for (var j=0; j<_numPorts; j++) {
				_digitalPort[j] = 0;
			}
			
			_totalPins = pinCounter;
			console.log("debug: num pins = " + _totalPins);
			
			//self.reportCapabilities();

			console.log("debug: system reset");
			systemReset();

			// delay to allow systemReset function to execute in StandardFirmata
			setTimeout(startup, 500);
			console.log("debug: configured");
		}
		
		/**
		 * @private
		 */
		function startup() {
			console.log("debug: startup");
			self.dispatchEvent(new IOBoardEvent(IOBoardEvent.READY));
			self.enableDigitalPinReporting();
		}
		
		/**
		 * Resets the board to its default state without physically resetting the board.
		 *
		 * @private
		 */
		function systemReset() {
			self.send(SYSEX_RESET);
		}	
			
		/**
		 *
		 * @private
		 */
		function processPinStateResponse(msg) {
			var len = msg.length;
			var pinNumber = msg[1];
			var pinType = msg[2];
			var value;
			var pin = _ioPins[pinNumber];
			
			if (len > 4) {
				// get value
				value = self.getValueFromTwo7bitBytes(msg[3], msg[4]);
			} else if (len > 3) {
				value = msg[3];
			}
			
			if (pin.type != pinType) {
				pin.type = pinType;
				managePinListener(pin);
			}
			if (pin.value != value) {
				pin.value = value;
			}
			
			// to do: update this
			self.dispatchEvent(new IOBoardEvent(IOBoardEvent.PIN_STATE_RESPONSE), {pin: pinNumber, type: pinType, value: value});
		}
		
		/**
		 *
		 * @private
		 */
		function processAnalogMappingResponse(msg) {
			var len = msg.length;		
			for (var i=1; i<len; i++) {
				if (msg[i] != 127) {
					_analogPinMapping[msg[i]] = i - 1;
				}
			}
		}
		
		/**
		 * convert char to decimal value
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
		 * @param {Event} event A reference to the event object (Pin in this case).
		 */
		 function sendOut(event) {
		 	var type = event.target.type;
		 	var pinNum = event.target.number;
		 	var value = event.target.value;
		 	
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
		 * Ensure that event listeners are properly managed for pin objects as the pin
		 * type is changed during the execution of the program.
		 *
		 * @private
		 */	 
		function managePinListener(pin) {
			if (pin.type == Pin.DOUT || pin.type == Pin.AOUT || pin.type == Pin.SERVO) {
				if (!pin.hasEventListener(Event.CHANGE)) {
					pin.addEventListener(Event.CHANGE, sendOut);
				}
			} else {
				if (pin.hasEventListener(Event.CHANGE)) {
					try {
						pin.removeEventListener(Event.CHANGE, sendOut);
					} catch (e) {
						// pin had reference to other handler, ignore
						console.log("debug: caught pin removeEventListener exception");
					}
				}
			}
		}
		
		/**
		 * @private
		 */
		function sendAnalogData(pin, value) {
			if (pin > 15 || value > Math.pow(2, 14)) {
				sendExtendedAnalogData(pin, value);
			} else {
				self.send([ANALOG_MESSAGE | (pin & 0x0F), value & 0x007F,(value >> 7) & 0x007F]);
			}
		}

		/**
		 * @private
		 */	
		function sendExtendedAnalogData(pin, value) {
			var analogData = [];
			
			// if > 16 bits
			if (value > Math.pow(2, 16)) {
				var err = "Extended Analog values > 16 bits are not currently supported by StandardFirmata";
				console.log(err);
				throw err;
				return;
			}
			
			analogData[0] = START_SYSEX;
			analogData[1] = EXTENDED_ANALOG;
			analogData[2] = pin;
			analogData[3] = value & 0x007F;
		 	analogData[4] = (value >> 7) & 0x007F;	// up to 14 bits
					
		 	// if > 14 bits
		 	if (value >= Math.pow(2, 14)) {
		 		analogData[5] = (value >> 14) & 0x007F;
		 	}
		 	
			analogData.push(END_SYSEX);
			self.send(analogData);
		}
		
		/**
		 * @private
		 */
		function sendDigitalData(pin, value) {
			var portNum = Math.floor(pin / 8);

			if (value == Pin.HIGH) {
				// set the bit
				_digitalPort[portNum] |= (value << (pin % 8));
			}
			else if (value == Pin.LOW) {
				// clear the bit
				_digitalPort[portNum] &= ~(1 << (pin % 8));
			}
			else {
				console.log("invalid value passed to sendDigital, value must be 0 or 1");
				return; // invalid value
			}
			
			self.sendDigitalPort(portNum, _digitalPort[portNum]);	
		}
		
		/**
		 * @private
		 */	
		function sendServoData(pin, value) {
			var servoPin = self.getDigitalPin(pin);
			if (servoPin.type == Pin.SERVO && servoPin.lastValue != value) {
				self.send([ANALOG_MESSAGE | (pin & 0x0F), value % 128, value >> 7]);
			}	
		}	
		
		/**
		 * Query the cababilities and current state any board running Firmata.
		 * 
		 * @private
		 */
		function queryCapabilities() {
			self.send([START_SYSEX,CAPABILITY_QUERY,END_SYSEX]);
		}
		
		/**
		 * Call this method to enable or disable analog input for the specified pin.
		 *
		 * @private
		 * @param {Number} pin The pin connected to the analog input
		 * @param {Number} mode Pin.ON to enable input or Pin.OFF to disable input
		 * for the specified pin.
		 */
		function setAnalogPinReporting(pin, mode) {
			self.send([REPORT_ANALOG | pin, mode]);
			self.getAnalogPin(pin).type = Pin.AIN;
			self.getAnalogPin(pin).analogReporting = mode;
		}			
		
		//public methods:
		
		/**
		 * A utility class to assemble a single value from the 2 bytes returned from the
		 * IOBoard (since data is passed in 7 bit Bytes rather than 8 bit it must be 
		 * reassembled. This is to be used as a protected method and should not be needed
		 * in any application level code.
		 *
		 * @private
		 * @param {Number} lsb The least-significant byte of the 2 values to be concatentated
		 * @param {Number} msb The most-significant byte of the 2 values to be concatenated
		 * @return {Number} The result of merging the 2 bytes
		 */
		this.getValueFromTwo7bitBytes = function(lsb, msb) {
			return (msb <<7) | lsb;
		};
		
		/**
		 * @return {WebSocket} A reference to the WebSocket
		 */
		this.getSocket = function() { return socket };
			
		/**
		 * Request the Firmata version implemented in the firmware (sketch) running
		 * on the IOBoard.
		 * Listen for the IOBoard.FIRMWARE_VERSION event to be notified of when 
		 * the Firmata version is returned from the IOBoard.
		 */	
		this.reportVersion = function() {
			self.send(REPORT_VERSION);
		};
		
		/**
		 * Request the name of the firmware (the sketch) running on the IOBoard.
		 * Listen for the IOBoard.FIRMWARE_NAME event to be notified of when 
		 * the name is returned from the IOBoard. The version number is also returned.
		 */
		this.reportFirmware = function() {
			self.send([START_SYSEX,REPORT_FIRMWARE,END_SYSEX]);
		};
		
		/**
		 * Disables digital pin reporting for all digital pins
		 */
		this.disableDigitalPinReporting = function() {
			for (var i=0; i <_numPorts; i++) {
				self.sendDigitalPortReporting(i, Pin.OFF);
			}
		};
		
		/**
		 * Enables digital pin reporting for all digital pins. You must call this
		 * before you can receive digital pin data from the IOBoard.
		 */
		this.enableDigitalPinReporting = function() {
			for (var i=0; i<_numPorts; i++) {
				self.sendDigitalPortReporting(i, Pin.ON);
			}
		};
		
		/**
		 * Enable or disable reporting of all digital pins for the specified port.
		 * @param {Number} mode Either Pin.On or Pin.OFF
		 */
		this.sendDigitalPortReporting = function(port, mode) {
			self.send([(REPORT_DIGITAL | port), mode]);
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
		 * Set the specified pin to Input or Output. 
		 *
		 * @param {Pin} pin A reference to the pin connected to the digital input or output
		 * @param {Number} mode Pin.DIN or Pin.DOUT and optionally Pin.HIGH to 
		 * enable the pull-up resistor.
		 */
		this.setPinMode = function(pin, mode) {
			
			self.getDigitalPin(pin).type = mode;
			managePinListener(self.getDigitalPin(pin));
			
			self.send([SET_PIN_MODE, pin, mode]);			
		};

		/**
		 * Enable the internal pull-up resistor for the specified pin number
		 *
		 * @param {number} pinNum The number of the input pin to enable the pull-up resistor.
		 */
		this.enablePullUp = function(pinNum) {
			sendDigitalData(pinNum, Pin.HIGH);
		};
		
		/**
		 * @return {String} The version of the Firmata firmware running on the IOBoard.
		 */
		this.getFirmwareVersion = function() {
			return _firmwareVersion;
		};
				
		/**
		 * Send the digital values for a port. Making this private for now.
		 *
		 * @private
		 * @param {Number} portNumber The number of the port
		 * @param {Number} portData A byte representing the state of the 8 pins for the specified port
		 */
		this.sendDigitalPort = function(portNumber, portData) {
			self.send([DIGITAL_MESSAGE | (portNumber & 0x0F), portData & 0x7F, portData >> 7]);
		};
		
		// to do: allow 1 or 2 params
		// (string) and (command, string)
		/**
		 * Send a string message to the IOBoard. This is useful if you have a custom sketch
		 * running on the IOBoard rather than StandardFirmata and want to communicate with
		 * your javascript message via string messages that you then parse in javascript.
		 * You can receive string messages as well.
		 *
		 * <p>To test, load the EchoString.pde example from Firmata->Examples menu in the
		 * IOBoard Application, then use sendString("your string message") to have it
		 * echoed back to your javascript application.</p>
		 * 
		 * @param {String} str The string message to send to the IOBoard
		 */
		this.sendString = function(str) {
			// convert chars to decimal values
			var decValues = [];
			for (var i=0, len=str.length; i<len; i++) {
				decValues.push(toDec(str[i]) & 0x007F);
				decValues.push((toDec(str[i]) >> 7) & 0x007F);
			}
			// data > 7 bits in length must be split into 2 bytes and packed into an
			// array before passing to the sendSysex method
			this.sendSysex(STRING_DATA, decValues);
		};
		
		/**
		 * Send a sysEx message to the IOBoard. This is useful for sending custom sysEx data
		 * to the IOBoard, for example if you are not using StandardFirmata. You would likely
		 * use it in a class rather than calling it from your main application.
		 *
		 * @private
		 * @param {Number} command The sysEx command value (see firmata.org)
		 * @param {Number[]} data A packet of data representing the sysEx message to be sent
		 * @see <a href="http://firmata.org/wiki/Protocol#Sysex_Message_Format">Firmata Sysex Message Format"</a>
		 */
		this.sendSysex = function(command, data) {
			var sysexData = [];
			sysexData[0] = START_SYSEX;
			sysexData[1] = command;
			// this would be problematic since the sysex message format does not enforce
			// splitting all bytes after the command byte
			//for (var i=0, len=data.length; i<len; i++) {
			//	sysexData.push(data[i] & 0x007F);
			//	sysexData.push((data[i] >> 7) & 0x007F);				
			//}
			
			for (var i=0, len=data.length; i<len; i++) {
				sysexData.push(data[i]);			
			}
			sysexData.push(END_SYSEX);
			
			self.send(sysexData);		
		};
					
		/**
		 * Call to associate a pin with a connected servo motor. See the documentation for your
		 * servo motor for the minimum and maximum pulse width. If you can't find it, then the
		 * default values should be close enough so call sendServoAttach(pin) omitting the
		 * min and max values.
		 *
		 * @param {Number} pin The pin the server is connected to.
		 * @param {Number} minPulse [optional] The minimum pulse width for the servo. Default = 544.
		 * @param {Number} maxPulse [optional] The maximum pulse width for the servo. Default = 2400.
		 */
		this.sendServoAttach = function(pin, minPulse, maxPulse) {
			var servoPin;

			minPulse = minPulse || 544; 	// default value = 544
			maxPulse = maxPulse || 2400;	// default value = 2400
		
			var servoData = [];
			servoData[0] = START_SYSEX;
			servoData[1] = SERVO_CONFIG;
			servoData[2] = pin;
			servoData[3] = minPulse % 128;
			servoData[4] = minPulse >> 7;
			servoData[5] = maxPulse % 128;
			servoData[6] = maxPulse >> 7;	
			servoData[7] = END_SYSEX;
			
			self.send(servoData);
		
			servoPin = self.getDigitalPin(pin);
			servoPin.type = Pin.SERVO;
			managePinListener(servoPin);	
		};
					
		/**
		 * Query the current configuration and state of any pin. Making this private for now.
		 * 
		 * @private
		 * @param {Pin} pin The Pin to be queried
		 */
		this.queryPinState = function(pin) {
			// to do: ensure that pin is a Pin object
			var pinNumber = pin.number;
			self.send([START_SYSEX,PIN_STATE_QUERY,pinNumber,END_SYSEX]);
		};
		
		/**
		 * Query which pins correspond to the analog channels
		 */
		this.queryAnalogMapping = function() {
			self.send([START_SYSEX,ANALOG_MAPPING_QUERY,END_SYSEX]);
		};
		
		/**
		 * Set the sampling interval (how often to run the main loop on the IOBoard). Normally
		 * this method should not be called.
		 *
		 * @param {Number} interval The interval for main loop in the IOBoard application. Default = 19ms.
		 */
		this.setSamplingInterval = function(interval) {
			// To do: set a range to prevent people from entering extreme values.
			self.send([START_SYSEX,SAMPLING_INTERVAL, interval & 0x007F, (interval >> 7) & 0x007F, END_SYSEX]);
		};
		
		/**
		 * @return {Pin} An unmapped reference to the Pin object.
		 */
		this.getPin = function(pinNumber) {
			return _ioPins[pinNumber];
		};
		
		/**
		 * @return {Pin} A reference to the Pin object (mapped to the IOBoard board analog pin).
		 */	
		this.getAnalogPin = function(pinNumber) {
			return _ioPins[_analogPinMapping[pinNumber]];
		};
		
		/**
		 * @return {Pin} A reference to the Pin object (mapped to the IOBoard board digital pin).
		 */	
		this.getDigitalPin = function(pinNumber) {
			return _ioPins[_digitalPinMapping[pinNumber]];
		};
		
		/**
		 * @return {Number} Total number of pins
		 */
		this.getPinCount = function() {
			return _totalPins;
		};
		
		/**
		 * @return {Number[]} The pin numbers of the i2c pins if the board has i2c.
		 * Returns undefined if the board does not have i2c pins.
		 * @private (internal only)
		 */
		this.getI2cPins = function() {
			return _i2cPins;
		};
		
		/**
		 * Call this method to print the capabilities for all pins to the console
		 */
		this.reportCapabilities = function() {
			var modeNames = {0:"input", 1:"output", 2:"analog", 3:"pwm", 4:"servo", 5:"shift", 6:"i2c"};
			for (var i=0, len=_ioPins.length; i<len; i++) {
				for (var mode in _ioPins[i].capabilities) {
					console.log("pin " + i + "\tmode: " + modeNames[mode] + "\tresolution (# of bits): " + _ioPins[i].capabilities[mode]);
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
			socket.send(message);
		};
		
		/**
		 * A wrapper for the close method of the WebSocket
		 */
		this.close = function() {
			console.log("socket = " + socket);
			socket.close();
		};
		
		/* implement EventDispatcher */
		
		/**
		 * @param {String} type The event type
		 * @param {Function} listener The function to be called when the event is fired
		 */
		this.addEventListener = function(type, listener) {
			_evtDispatcher.addEventListener(type, listener);
		};
		
		/**
		 * @param {String} type The event type
		 * @param {Function} listener The function to be called when the event is fired
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
		 * @param {Object} optionalParams Optional parameters to assign to the event object.
		 * return {boolean} True if dispatch is successful, false if not.
		 */		
		this.dispatchEvent = function(event, optionalParams) {
			return _evtDispatcher.dispatchEvent(event, optionalParams);
		};

	}

	return IOBoard;

}());	
