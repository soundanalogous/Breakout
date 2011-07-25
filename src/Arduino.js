// Arduino.js
// jeff hoefs 7/20/11
// based on as3glue (http://code.google.com/p/as3glue/)
// 
// to do:
// 1. implement Firmata I2C spec
// 2. finalize the event model
// 3. support full Firmata 2.2 protocol
// 4. decouple socket (so you could use web socket, flash socket via swf, or other)?
// 5. align code to js best practices


// constructor
function Arduino(host, port) {
	"use strict";

	this.className = "Arduino"; 	// for testing

	// call the super class
	// 2nd parameter is passed to EventDispatcher constructor
	EventDispatcher.call(this, this);

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
	
	var _analogData = [];
	var _digitalData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	var _digitalPins = 0;
	var _executeMultiByteCommand = 0;
	var _firmwareVersion = 0;
	var _multiByteChannel = 0;
	var _previousAnalogData = [];
	var _previousDigitalData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	var _storedInputData = [];
	var _sysExData = [];
	var _waitForData = 0;
			
	connect();
			
	// private methods
	function connect () {
		
		if(!("WebSocket" in window)) {
			console.log("Websockets not supported by this browser");
			throw "Websockets not supported by this browser";
			return;
		}
		
		try{
			socket = new WebSocket("ws://"+host+":"+port);
			console.log("Starting up...");
			
			socket.onopen = function(){
				console.log("Socket Status: "+socket.readyState+" (open)");
				self.dispatchEvent(new Event(Event.CONNECTED));
			}
			
			socket.onmessage = function(msg){
				processData(msg.data);
			}
			
			socket.onclose = function(){
				console.log("Socket Status: "+socket.readyState+' (Closed)');
			}			
				
		} catch(exception){
			console.log("Error "+exception);
		}

	}
	
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
						console.log("firmware version: " + _firmwareVersion);
						self.dispatchEvent(new ArduinoEvent(ArduinoEvent.FIRMWARE_VERSION, {version: _firmwareVersion}));
						break;
					case ANALOG_MESSAGE:
						_analogData[_multiByteChannel] = self.getValueFromTwo7bitBytes(_storedInputData[1], _storedInputData[0]);
						if (_analogData[_multiByteChannel] != _previousAnalogData[_multiByteChannel]) {
							self.dispatchEvent(new ArduinoEvent(ArduinoEvent.ANALOG_DATA, {pin: _multiByteChannel, value: _analogData[_multiByteChannel]}));		
						}
						_previousAnalogData[_multiByteChannel]=_analogData[_multiByteChannel];
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
	
	function processDigitalPortBytes(port, bits0_6, bits7_13) {
		var low;
		var high;
		var offset;
		// if port is 0, write bits 2..7 into _digitalData[2..7]
		// if port is 1, write bits 0..5 into _digitalData[8..13]
		if (port == 0) {
			low=2;
			high=7;
			offset=0;
		}
		else {
			low=0;
			high=5;
			offset=8;
		}
		var twoBytesForPorts = bits0_6 + (bits7_13 << 7);
		var mask;
		for (var i = low; i <= high; i++) {
			mask=1 << i;
			_digitalData[i + offset]=(twoBytesForPorts & mask) >> i;
			if (_digitalData[i + offset] != _previousDigitalData[i + offset]) {
				self.dispatchEvent(new ArduinoEvent(ArduinoEvent.DIGITAL_DATA, {pin: (i+offset), value: _digitalData[i + offset]}));
			}
			_previousDigitalData[i + offset]=_digitalData[i + offset];
		}	
	}
	
	function processQueryFirmwareResult(msg) {
		
		//assemble string from rcv bytes - weird.
		var fname ="";
		var data;
		for (var i = 3; i < msg.length; i+=2)
		{
			data = String.fromCharCode(msg[i]);
			data += String.fromCharCode(msg[i+1]);
			fname+=data;
		}
		console.log("Firmware is: " + fname + " Version " + msg[1] + "." + msg[2]);
		_firmwareVersion=msg[1] + msg[2] / 10;
		self.dispatchEvent(new ArduinoEvent(ArduinoEvent.FIRMWARE_VERSION, {version: _firmwareVersion}));
		
	}

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
	
	// convert char to decimal value
	function toDec(ch) {
		ch = ch.substring(0, 1);
		var decVal = ch.charCodeAt(0);		
		return decVal;
	}
	
	this.getValueFromTwo7bitBytes = function(lsb, msb) {
		return (msb <<7) | lsb;
	}
	
	this.getSocket = function() { return socket }
	
	this.resetBoard = function() {
		self.send(SYSEX_RESET);
	}
	
	this.reportVersion = function() {
		self.send(REPORT_VERSION);
	}
	
	this.reportFirmware = function() {
		self.send([START_SYSEX,REPORT_FIRMWARE,END_SYSEX]);
	}
	
	this.disableDigitalPinReporting = function() {
		self.send([REPORT_DIGITAL, 0]);
		self.send([REPORT_DIGITAL + 1, 0]);
	}
	
	this.enableDigitalPinReporting = function() {
		self.send([REPORT_DIGITAL + 0, 1]);
		self.send([REPORT_DIGITAL + 1, 1]);
	}
	
	this.setAnalogPinReporting = function(pin, mode) {
		self.send([REPORT_ANALOG | pin, mode]);
	}
	
	this.setPinMode = function(pin, mode) {
		self.send([SET_PIN_MODE, pin, mode]);
	}
	
	this.getAnalogData = function(pin) {
		return _analogData[pin];
	}
	
	this.getDigitalData = function(pin) {
		return _digitalData[pin];
	}
	
	this.getFirmwareVersion = function() {
		return _firmwareVersion;
	}
	
	// writeAnalogPin
	this.sendAnalog = function(pin, value) {
		self.send([ANALOG_MESSAGE | (pin & 0x0F), value & 0x7F,(value >> 7) & 0x7F]);
	}
	
	// writeDigitalPin
	this.sendDigital = function(pin, mode) {
		if (mode == 1) {
			// set the bit
			_digitalPins|=(mode << pin);
		}
		else if (mode == 0) {
			// clear the bit
			_digitalPins&=~(1 << pin);
		}
		if (pin <= 7) {
			self.send([DIGITAL_MESSAGE|0, _digitalPins % 128, (_digitalPins >> 7) & 1]);	
		}
		else {
			self.send([DIGITAL_MESSAGE|1, _digitalPins >> 8, 0]);
		}
	}
	
	// writeDigitalPins?
	this.sendDigitalPort = function(portNumber, portData) {
		self.send([DIGITAL_MESSAGE | (portNumber & 0x0F), portData % 128, portData >> 7]);
	}
	
	// to do: allow 1 or 2 params
	// (string) and (command, string)
	this.sendString = function(s) {
		this.sendSysex(STRING_DATA, s);
	}
	
	this.sendSysex = function(command, data) {
		var tempArray = [];
		tempArray[0] = START_SYSEX;
		tempArray[1] = command;
		var charVal;
		for (var i=0, len=data.length; i<len; i++) {
			charVal = toDec(data[i]);
			tempArray.push(charVal % 128);
			tempArray.push(charVal >> 7);
		}
		tempArray.push(END_SYSEX);
		self.send(tempArray);		
	}
	
	this.sendServo = function(pin, value) {
		//if (_digitalPinMode[pin]==Arduino.SERVO && (_digitalData[pin]!=value || force)) {
			self.send([ANALOG_MESSAGE | (pin & 0x0F), value % 128, value >> 7]);
			_digitalData[pin] = value;
		//}
	}
	
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
		//_digitalPinMode[pin] = Arduino.SERVO;
		
		self.send(tempArray);
	}
	
	this.getServo = function(pin) {
		if (_digitalPinMode[pin] == Arduino.SERVO) {
			return _digitalData[pin];
		} else {
			return -1;
		}
	}
	
	// Events
	this.onReady = function() {
		
	}
	
	// SOCKET
	// public method
	this.send = function(message) {
		socket.send(message);
	}
	
	// public method
	this.close = function() {
		console.log("socket = " + socket);
		socket.close();
	}

}

Arduino.HIGH					= 1;
Arduino.LOW						= 0;
Arduino.INPUT					= 0;
Arduino.OUTPUT					= 1;
Arduino.ON						= 1;
Arduino.OFF						= 0;
	
// pin modes		
Arduino.ANALOG					= 0x02;
Arduino.PWM						= 0x03;
Arduino.SERVO					= 0x04;
Arduino.SHIFT					= 0x05;
Arduino.I2C						= 0x06;
Arduino.TOTAL_PIN_MODES			= 7;

// extend EventDispatcher
// how to prevent the constructor from being called here?
Arduino.prototype = new EventDispatcher;
Arduino.prototype.constructor = Arduino;


// ArduinoEvent class
function ArduinoEvent(type, data) {
	this.data = data;
	// call the super class
	// 2nd parameter is passed to EventDispatcher constructor
	Event.call(this, type);
}

// events
ArduinoEvent.ANALOG_DATA			= "analodData";
ArduinoEvent.DIGITAL_DATA			= "digitalData";
ArduinoEvent.FIRMWARE_VERSION		= "firmwareVersion";
ArduinoEvent.STRING_MESSAGE			= "stringMessage";
ArduinoEvent.SYSEX_MESSAGE			= "sysexMessage";

ArduinoEvent.prototype = new Event;
ArduinoEvent.prototype.constructor = ArduinoEvent;
