// Arduino.js
// Jeff Hoefs
//
// based largely on as3glue (http://code.google.com/p/as3glue/)
// and funnel (http://code.google.com/p/funnel/)


/**
 * Creates a new Arduino object representing the digital and analog inputs and
 * outputs of the device as well as support for sending strings between the Arduino
 * sketch and your javascript application. Also support for hardware such as controlling
 * a servo motor from javascript and additional libraries for an RFID reader with more
 * to follow such as Button, Accelerometer, i2c device implementation, etc.
 *
 * @constructor
 * @param {String} host The host address of the web server
 * @param {Number} port The port to connect to on the web server
 */
function Arduino(host, port, boardType) {
	"use strict";
	
	var _boardType = boardType || Arduino.STANDARD;

	this.className = "Arduino"; 	// for testing

	var		FIRMATA_MAJOR_VERSION	= 2,
			FIRMATA_MINOR_VERSION	= 2;
	
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
	var socket;
		
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
	var _ioPins = [];
	var _totalPins = 0;
	
	var _firmwareVersion = 0;	
	
	//var _isAutoConfig = false;
	
	var _evtDispatcher = new EventDispatcher(this);
			
	configure();

	connect();
	

					
	// private methods:
	
	// to do: 
	// Create a wrapper for WebSocket and compose the wrapper in this class
	// rather than using WebSockets directly.
	// This will enable the user to swap the wrapper object if do not want to
	// use WebSockets as long as all Socket wrappers maintain a consistent interface.
	/**
	 * @private
	 */
	function connect () {
		
		if(!("WebSocket" in window)) {
			console.log("Websockets not supported by this browser");
			throw "Websockets not supported by this browser";
			return;
		}
		
		try{
			socket = new WebSocket("ws://"+host+":"+port);
			console.log("Starting up...");
			/**
			 * @private
			 */
			socket.onopen = function(){
				console.log("Socket Status: "+socket.readyState+" (open)");
				self.dispatchEvent(new Event(Event.CONNECTED));
				
				setTimeout(begin, 1000);

				//self.addEventListener(ArduinoEvent.FIRMWARE_VERSION, onVersion);
				//self.reportVersion();
			}
			/**
			 * @private
			 */
			socket.onmessage = function(msg){
				processData(msg.data);
			}
			/**
			 * @private
			 */
			socket.onclose = function(){
				console.log("Socket Status: "+socket.readyState+' (Closed)');
			}			
				
		} catch(exception){
			console.log("Error "+exception);
		}

	}
	
	/**
	 * @private
	 */
	function begin() {
		console.log("ready");
		self.dispatchEvent(new ArduinoEvent(ArduinoEvent.READY));
	}
	
	// contemplating...
	/*
	function onVersion(event) {
		self.removeEventListener(ArduinoEvent.FIRMWARE_VERSION, onVersion);
		var version = event.data.version * 10;
		
		if (version >= 22) {
			autoConfigure();
		} else {
			configure();
		}
	}
	*/
	
	/**
	 * Automatically configure using queryCapabilities. This only works with StandardFirmata
	 * using Firmata version 2.2 (Arduino 0022) or higher
	 *
	 * @private
	 */
	//function autoConfigure() {
	//	_isAutoConfig = true;
	//	self.queryCapabilities();
	//}
	
	/**
	 * currently only Arduino with ATMega168 or ATMega328 is supported
	 * 
	 * @private
	 */
	function configure() {	
		var pinTypes = [];
		var pinNumCounter = 2;  // skip rx and tx pins
		
		if (_boardType == Arduino.STANDARD) {
					
			_totalPins = 24;	// 14 digital + 2 unused + 8 analog (only 6 on some boards)
			
			// map pins
			_analogPinMapping = [16, 17, 18, 19, 20, 21, 22, 23];	
			// pins 14 & 15 are not used because pin numbers align with ports (8 pins per port)
			// but pins 7 and 8 of port 1 are not broken out on the Arduino board
			_digitalPinMapping = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 16, 17, 18, 19, 20, 21, 22, 23];
			
			_numPorts = 3;
			_digitalPort = [0, 0, 0];	// 3 ports
			
			// default pin configuration
			pinTypes = [
				undefined, undefined, Pin.OUTPUT, Pin.OUTPUT, Pin.OUTPUT,
				Pin.OUTPUT, Pin.OUTPUT, Pin.OUTPUT, Pin.OUTPUT, Pin.OUTPUT,
				Pin.OUTPUT, Pin.OUTPUT, Pin.OUTPUT, Pin.OUTPUT, undefined, undefined,
				Pin.ANALOG, Pin.ANALOG, Pin.ANALOG, Pin.ANALOG,
				Pin.ANALOG, Pin.ANALOG, Pin.ANALOG, Pin.ANALOG
			];
			
			// create pins for each port
			// because not all pins in a 3 ports are broken out on the Arduino board,
			// some pins will be unused.
			for (var i=0; i<_totalPins; i++) {
				// align pin numbers with Arduino documentation (digital pin 14 = analog pin 0)
				var pin = new Pin(pinNumCounter, pinTypes[i]);
				_ioPins[i] = pin;
				// skip rx and tx pins
				if (i > 1 && pinTypes[i] != undefined) {
					pinNumCounter++;
				}
			}
			
		} else {
			// to do: configuration for other board types
		}
		
	}
	
	/**
	 * @private
	 */
	function processData(inputData) {
		inputData *= 1;	// force inputData to integer (is there a better way to do this?)
		var command;
		var analogPin = {};
		
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
						self.dispatchEvent(new ArduinoEvent(ArduinoEvent.FIRMWARE_VERSION, {version: _firmwareVersion}));
						break;
					case ANALOG_MESSAGE:
						analogPin = self.getAnalogPin(_multiByteChannel);
						analogPin.setValue(self.getValueFromTwo7bitBytes(_storedInputData[1], _storedInputData[0]));
						if (analogPin.getValue() != analogPin.getLastValue()) {
							// use analog pin number rather than actual pin number
							self.dispatchEvent(new ArduinoEvent(ArduinoEvent.ANALOG_DATA, {pin: _multiByteChannel, value: analogPin.getValue()}));		
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
						self.dispatchEvent(new ArduinoEvent(ArduinoEvent.SYSEX_MESSAGE, {message: _sysExData}));
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
		// to do: rewrite this to support full range of 128 pins

		var offset = port * 8;
		var portVal = bits0_6 | (bits7_13 << 7);
		var pinVal;
		var pin = {};
		
		for (var i=0; i<8; i++) {
			pin = self.getPin(offset + i);
			if (pin.type == Pin.OUTPUT | pin.type == Pin.INPUT) {  // only care about INPUT right?
				pinVal = (portVal >> i) & 0x01;	// test this
				// to do: update to use getter pin.lastValue
	    		if (pinVal != pin.getValue()) {
	    			// to do: update to use setter pin.value
	    			pin.setValue(pinVal);
	    			// to to: update pin.getValue(); to use getter pin.value
	    			self.dispatchEvent(new ArduinoEvent(ArduinoEvent.DIGITAL_DATA, {pin: pin.getNumber(), value: pin.getValue()}));
	    		}
	    	}
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
			fname+=data;
		}
		_firmwareVersion=msg[1] + msg[2] / 10;
		self.dispatchEvent(new ArduinoEvent(ArduinoEvent.FIRMWARE_NAME, {name: fname, version: _firmwareVersion}));
		
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
			str+=data;
		}
		self.dispatchEvent(new ArduinoEvent(ArduinoEvent.STRING_MESSAGE, {message: str}));
	}
	/**
	 * note: this implementation may change
	 *
	 * @private
	 */
	function processCapabilitiesResponse(msg) {
		var pinCapabilities = {};
		var byteCounter = 1; // skip 1st byte because it's the command
		var pinCounter = 0;
		var len = msg.length;
				
		while (byteCounter <= len) {
			// 127 denotes end of pin's modes
			if (msg[byteCounter] == 127) {
				_ioPins[pinCounter].capabilities = pinCapabilities;
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

		self.dispatchEvent(new ArduinoEvent(ArduinoEvent.CAPABILITY_RESPONSE));
	}

	// auto configure using capabilities response
	// not sure if this is a good idea... could cause more problems than it solves
	// to do: move this to a new branch
	/*
	function processCapabilitiesResponse(msg) {
		var pinCapabilities = {};
		var byteCounter = 1; // skip 1st byte because it's the command
		var pinCounter = 0;
		var digitalPinCounter = 2;
		var analogPinCounter = 0;
		var len = msg.length;
		var type;
		
		// map rx and tx pins
		_digitalPinMapping[0] = 0;
		_digitalPinMapping[1] = 1;
		
		// create default configuration
		while (byteCounter <= len) {
			// 127 denotes end of pin's modes
			if (msg[byteCounter] == 127) {

				if (pinCapabilities[Pin.OUTPUT]) {
					// map digital pins
					_digitalPinMapping[digitalPinCounter++] = pinCounter;
					// set default type
					if (pinCapabilities[Pin.ANALOG]) {
						type = Pin.ANALOG;
						_analogPinMapping[analogPinCounter++] = pinCounter;
					} else {
						type = Pin.OUTPUT;
					}
				} else {
					type = undefined;
				}
				
				var pin = new Pin(pinCounter, type);
				pin.capabilities = pinCapabilities;
				_ioPins[pinCounter] = pin;
				
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
		
		_totalPins = pinCounter;

		self.dispatchEvent(new ArduinoEvent(ArduinoEvent.READY));
	}
	*/
	
	/**
	 * note: this implementation may change
	 *
	 * @private
	 */
	function processPinStateResponse(msg) {
		var len = msg.length;
		var pinNumber = msg[1];
		var pinType = msg[2];
		var value;
		
		if (len > 4) {
			// get value
			value = self.getValueFromTwo7bitBytes(msg[3], msg[4]);
		} else if (len > 3) {
			value = msg[3];
		}
		
		_ioPins[pinNumber].type = pinType;
		_ioPins[pinNumber].setValue(value);
		
		self.dispatchEvent(new ArduinoEvent(ArduinoEvent.PIN_STATE_RESPONSE));
	}
	
	/**
	 * note: this implementation may change
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
	
	//public methods:
	
	/**
	 * A utility class to assemble a single value from the 2 bytes returned from the
	 * Arduino (since data is passed in 7 bit Bytes rather than 8 bit it must be 
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
	}
	
	/**
	 * @return {WebSocket} A reference to the WebSocket
	 */
	this.getSocket = function() { return socket }
	
	/**
	 * Resets the Arduino. To know when the Arduino is available after reset, listen for
	 * Arduino.FIRMWARE_VERSION, because the version is automatically send from Arduino
	 * upon reset.
	 */
	this.resetBoard = function() {
		self.send(SYSEX_RESET);
	}
	
	/**
	 * Request the Firmata version implemented in the firmware (sketch) running
	 * on the Arduino.
	 * Listen for the Arduino.FIRMWARE_VERSION event to be notified of when 
	 * the Firmata version is returned from the Arduino.
	 */	
	this.reportVersion = function() {
		self.send(REPORT_VERSION);
	}
	
	/**
	 * Request the name of the firmware (the sketch) running on the Arduino.
	 * Listen for the Arduino.FIRMWARE_NAME event to be notified of when 
	 * the name is returned from the Arduino. The version number is also returned.
	 */
	this.reportFirmware = function() {
		self.send([START_SYSEX,REPORT_FIRMWARE,END_SYSEX]);
	}
	
	/**
	 * Disables digital pin reporting for all digital pins
	 */
	this.disableDigitalPinReporting = function() {
		for (var i=0; i <_numPorts; i++) {
			self.send([(REPORT_DIGITAL | i), Pin.OFF]);
		}
	}
	
	/**
	 * Enables digital pin reporting for all digital pins. You must call this
	 * before you can receive digital pin data from the Arduino.
	 */
	this.enableDigitalPinReporting = function() {
		for (var i=0; i<_numPorts; i++) {
			self.send([(REPORT_DIGITAL | i), Pin.ON]);
		}
	}
	
	/**
	 * Call this method to enable or disable analog input for the specified pin.
	 * Listen for the ArduinoEvent.ANALOG_DATA to be notified of incoming analog data.
	 *
	 * @param {Number} pin The pin connected to the analog input
	 * @param {Number} mode Pin.ON to enable input or Pin.OFF to disable input
	 * for the specified pin.
	 */
	this.setAnalogPinReporting = function(pin, mode) {
		self.send([REPORT_ANALOG | pin, mode]);
	}
	
	/**
	 * Set the specified pin to Input or Output. Also used to enable the pull-up resistor
	 * for the specified pin by writing Pin.HIGH to the pin.
	 * For example, setPinMode(4, Pin.HIGH) will enable the pull-up resistor for digital
	 * pin 4.
	 * For digital input, listen for the ArduinoEvent.DIGITAL_DATA to be notified 
	 * of incoming digital data.
	 *
	 * @param {Number} pin The pin connected to the digital input or output
	 * @param {Number} mode Pin.INPUT or Pin.OUTPUT and optionally Pin.HIGH to 
	 * enable the pull-up resistor.
	 */
	this.setPinMode = function(pin, mode) {
		self.getDigitalPin(pin).type = mode;
		self.send([SET_PIN_MODE, pin, mode]);
	}
	
	/**
	 * Returns the analog data for a specified pin. When an analog value
	 * is received it is stored. However it is best in most cases to listen
	 * for the ArduinoEvent.ANALOG_DATA and get the analog value from the
	 * event parameter (event.data.value) rather than using this getter method.
	 *
	 * @param {Number} pin The pin number to return analog data for
	 * @return {Number} The analog data for the specified pin
	 */
	this.getAnalogData = function(pin) {
		return self.getAnalogPin(pin).getValue();
	}
	
	/**
	 * Returns the digital data for a specified pin. When a digital value
	 * is received it is stored. However it is best in most cases to listen
	 * for the ArduinoEvent.DIGITAL_DATA and get the digital value from the
	 * event parameter (event.data.value) rather than using this getter method.
	 
	 * @param {Number} pin The pin number to return digital data for
	 * @return {Number} The digital data for the specified pin
	 */	
	this.getDigitalData = function(pin) {
		return self.getDigitalPin(pin).getValue();
	}
	
	/**
	 * @return {String} The version of the Firmata firmware running on the Arduino.
	 */
	this.getFirmwareVersion = function() {
		return _firmwareVersion;
	}
	
	/**
	 * Simulate an analog signal on a PWM pin. For example use this method to fade an LED or
	 * send an 8-bit waveform.
	 *
	 * @param {Number} pin The pin to send the analog signal to.
	 * @param {Number} value The value (to do: check on max resolution) to send
	 */
	this.sendAnalog = function(pin, value) {
		var pwmPin = self.getDigitalPin(pin); 
		self.send([ANALOG_MESSAGE | (pin & 0x0F), value & 0x007F,(value >> 7) & 0x007F]);
		
		pwmPin.setValue(value);
		if (pwmPin.type != Pin.PWM) {
			pwmPin.type = Pin.PWM;
		}		
	}
	
	/**
	 * An alternative to the normal analog message allowing addressing beyond pin 15
	 * and supports sending analog values up to 16 bits.
	 *
	 * @param {Number} pin The pin to send the analog signal to
	 * @param {Number} value The value to send to the specified pin
	 */
	this.sendExtendedAnalog = function(pin, value) {
		var pwmPin = self.getDigitalPin(pin);
		var tempArray = [];
		
		// if > 16 bits
		if (value > Math.pow(2, 16)) {
			var err = "Extended Analog values > 16 bits are not currently supported by StandardFirmata";
			console.log(err);
			throw err;
			return;
		}
		
		tempArray[0] = START_SYSEX;
		tempArray[1] = EXTENDED_ANALOG;
		tempArray[2] = pin;
		tempArray[3] = value & 0x007F;
	 	tempArray[4] = (value >> 7) & 0x007F;	// up to 14 bits
				
	 	// if > 14 bits
	 	if (value >= Math.pow(2, 14)) {
	 		tempArray[5] = (value >> 14) & 0x007F;
	 	}
	 	
		tempArray.push(END_SYSEX);
		self.send(tempArray);
		
		pwmPin.setValue(value);
		if (pwmPin.type != Pin.PWM) {
			pwmPin.type = Pin.PWM;
		}			
	}	
	
	/**
	 * Set a digital pin on the Arduino to High or Low.
	 *
	 * @param {Number} pin The pin number to set or clear.
	 * @param {Number} value Either Pin.HIGH or Pin.LOW
	 */
	this.sendDigital = function(pin, value) {
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
		
		// set the value of the Pin object
		self.getDigitalPin(pin).setValue(value);		
	}
	
	/**
	 * Send the digital values for a port. Making this private for now.
	 *
	 * @private
	 * @param {Number} portNumber The number of the port
	 * @param {Number} portData A byte representing the state of the 8 pins for the specified port
	 */
	this.sendDigitalPort = function(portNumber, portData) {
		// to do: update Pin.value for each pin that changed?
		self.send([DIGITAL_MESSAGE | (portNumber & 0x0F), portData & 0x7F, portData >> 7]);
	}
	
	// to do: allow 1 or 2 params
	// (string) and (command, string)
	/**
	 * Send a string message to the Arduino. This is useful if you have a custom sketch
	 * running on the Arduino rather than StandardFirmata and want to communicate with
	 * your javascript message via string messages that you then parse in javascript.
	 * You can receive string messages as well.
	 *
	 * <p>To test, load the EchoString.pde example from Firmata->Examples menu in the
	 * Arduino Application, then use sendString("your string message") to have it
	 * echoed back to your javascript application.</p>
	 * 
	 * @param {String} str The string message to send to the Arduino
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
	}
	
	/**
	 * Send a sysEx message to the Arduino. This is useful for sending custom sysEx data
	 * to the Arduino, for example if you are not using StandardFirmata. You would likely
	 * use it in a class rather than calling it from your main application.
	 *
	 * @private
	 * @param {Number} command The sysEx command value (see firmata.org)
	 * @param {Number[]} data A packet of data representing the sysEx message to be sent
	 * @see <a href="http://firmata.org/wiki/Protocol#Sysex_Message_Format">Firmata Sysex Message Format"</a>
	 */
	this.sendSysex = function(command, data) {
		var tempArray = [];
		tempArray[0] = START_SYSEX;
		tempArray[1] = command;
		// this would be problematic since the sysex message format does not enforce
		// splitting all bytes after the command byte
		//for (var i=0, len=data.length; i<len; i++) {
		//	tempArray.push(data[i] & 0x007F);
		//	tempArray.push((data[i] >> 7) & 0x007F);				
		//}
		
		for (var i=0, len=data.length; i<len; i++) {
			tempArray.push(data[i]);			
		}
		tempArray.push(END_SYSEX);
		self.send(tempArray);		
	}
		
	/**
	 * Set the angle (in degrees) to rotate the servo head to. Only tested for 0-180 degrees
	 * so far since that's the limit of my servo.
	 *
	 * @param {Number} pin The pin the servo is connected to.
	 * @param {Number} value The angle (in degrees) to rotate the servo head to
	 */
	this.sendServo = function(pin, value) {
		var servoPin = self.getDigitalPin(pin);
		//if (_digitalPinMode[pin]==Pin.SERVO && (_digitalData[pin]!=value || force)) {
		if (servoPin.type == Pin.SERVO && servoPin.getValue() != value) {
			self.send([ANALOG_MESSAGE | (pin & 0x0F), value % 128, value >> 7]);
			servoPin.setValue(value);
		}
	}
	
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

		minPulse = minPulse || 544; 	// default value = 544
		maxPulse = maxPulse || 2400;	// default value = 2400
	
		var tempArray = [];
		tempArray[0] = START_SYSEX;
		tempArray[1] = SERVO_CONFIG;
		tempArray[2] = pin;
		tempArray[3] = minPulse % 128;
		tempArray[4] = minPulse >> 7;
		tempArray[5] = maxPulse % 128;
		tempArray[6] = maxPulse >> 7;
		tempArray[7] = END_SYSEX;
		
		self.send(tempArray);
	
		self.getDigitalPin(pin).type = Pin.SERVO;	
	}
	
	/**
	 * Checks if a servo is connected to the specified pin number
	 *
	 * @param {Number} pin The pin number you are checking for a servo on.
	 * @return {Number} If Servo Pin, the current value (angle) of the servo, else -1
	 */
	this.getServo = function(pin) {
		var servoPin = self.getDigitalPin(pin);

		if (servoPin.type == Pin.SERVO) {
			return servoPin.getValue();			
		} else {
			return -1;
		}
	}
	
	/**
	 * Query the cababilities and current state any board running Firmata.
	 * 
	 * @private
	 */
	this.queryCapabilities = function() {
		self.send([START_SYSEX,CAPABILITY_QUERY,END_SYSEX]);
	}
	
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
	}
	
	/**
	 * Query which pins correspond to the analog channels
	 */
	this.queryAnalogMapping = function() {
		self.send([START_SYSEX,ANALOG_MAPPING_QUERY,END_SYSEX]);
	}
	
	/**
	 * Set the sampling interval (how often to run the main loop on the Arduino). Normally
	 * this method should not be called.
	 *
	 * @param {Number} interval The interval for main loop in the Arduino application. Default = 19ms.
	 */
	this.setSamplingInterval = function(interval) {
		// to do: test this to ensure it is working properly
		// also set a range to prevent people from entering extreme values.
		self.send([START_SYSEX,SAMPLING_INTERVAL, interval & 0x007F, (interval >> 7) & 0x007F, END_SYSEX]);
	}
	
	/**
	 * @return {Pin} A reference to the Pin object.
	 */
	this.getPin = function(pinNumber) {
		return _ioPins[pinNumber];
	}
	
	/**
	 * @return {Pin} A reference to the Pin object.
	 */	
	this.getAnalogPin = function(pinNumber) {
		return _ioPins[_analogPinMapping[pinNumber]];
	}
	
	/**
	 * @return {Pin} A reference to the Pin object.
	 */	
	this.getDigitalPin = function(pinNumber) {
		return _ioPins[_digitalPinMapping[pinNumber]];
	}
	
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
	}
	
	/**
	 * A wrapper for the send method of the WebSocket
	 * I'm not sure there is a case for the user to call this method
	 * So I'm making this private for now.
	 *
	 * @private
	 * @param {Number[]} message Message data to be sent to the Arduino
	 */
	this.send = function(message) {
		socket.send(message);
	}
	
	/**
	 * A wrapper for the close method of the WebSocket
	 */
	this.close = function() {
		console.log("socket = " + socket);
		socket.close();
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


// board types:
Arduino.STANDARD				= 0; // UNO, Duemilanove, Diecimila, NG
Arduino.MEGA					= 1; // not yet supported
	

/**
 * An object to represent an Arduino pin
 * @constructor
 * @param {Number} number The pin number
 * @param {Number} type The type of pin
 */
function Pin(number, type) {
	this.type = type;
	this.capabilities;
	
	var _number = number;
	var _value = 0;
	var _lastValue = 0;
	
	/**
	 * Get the pin number corresponding to the Arduino documentation for the type of board.
	 * The number has been adjusted to match the Arduino documentation rather than truly represent
	 * the pin number of the AVR. For example, with a Standard Arduino board, analog pin 0 = digital 
	 * pin 14 even though analog pin 0 is actually pin 16 (because there are 3 ports and it's the 
	 * first pin of the 3rd port). This will be different for other board types such as the
	 * Arduino Mega.
	 * 
	 * @return {Number} The pin number
	 */
	this.getNumber = function() {
		return _number;
	}
	
	/**
	 * @return {Number} Get the current digital or analog value of the pin
	 */
	this.getValue = function() {
		return _value;
	}
	
	/**
	 * @param {Number} val Set the pin value
	 */
	this.setValue = function(val) {
		_lastValue = _value;
		_value = val;
	}
	
	/**
	 * @return {Number} Get the last pin value
	 */
	this.getLastValue = function() {
		return _lastValue;
	}
}

/** @constant */
Pin.HIGH					= 1;
/** @constant */
Pin.LOW						= 0;
/** @constant */
Pin.ON						= 1;
/** @constant */
Pin.OFF						= 0;

// pin modes
/** @constant */
Pin.INPUT					= 0x00;
/** @constant */
Pin.OUTPUT					= 0x01;
/** @constant */
Pin.ANALOG					= 0x02;
/** @constant */
Pin.PWM						= 0x03;
/** @constant */
Pin.SERVO					= 0x04;
/** @constant */
Pin.SHIFT					= 0x05;
/** @constant */
Pin.I2C						= 0x06;
/** @constant */
Pin.TOTAL_PIN_MODES			= 7;


/**
 * @constructor
 * @augments Event
 * @param {String} type The event type
 * @param {Object} data An object containing additional parameters
 */
function ArduinoEvent(type, data) {
	this.data = data;
	// call the super class
	// 2nd parameter is passed to EventDispatcher constructor
	Event.call(this, type);
}

// events
/** @constant */
ArduinoEvent.ANALOG_DATA				= "analodData";
/** @constant */
ArduinoEvent.DIGITAL_DATA				= "digitalData";
/** @constant */
ArduinoEvent.FIRMWARE_VERSION			= "firmwareVersion";
/** @constant */
ArduinoEvent.FIRMWARE_NAME				= "firmwareName";
/** @constant */
ArduinoEvent.STRING_MESSAGE				= "stringMessage";
/** @constant */
ArduinoEvent.SYSEX_MESSAGE				= "sysexMessage";
/** @constant */
ArduinoEvent.CAPABILITY_RESPONSE		= "capabilityResponse";
/** @constant */
ArduinoEvent.PIN_STATE_RESPONSE			= "pinStateResponse";
/** @constant */
ArduinoEvent.ANALOG_MAPPING_RESPONSE	= "analogMappingResponse";
/** @constant */
ArduinoEvent.READY						= "arduinoReady";


// to do: figure out how to inherit a class without using 'new' when we want
// to call the super class in the subclass constructor (as we do in this case)
ArduinoEvent.prototype = new Event;
ArduinoEvent.prototype.constructor = ArduinoEvent;
