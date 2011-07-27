// Arduino.js
// jeff hoefs 7/20/11
// based on as3glue (http://code.google.com/p/as3glue/)
// 
// to do:
// 1. implement Firmata i2c spec
// 2. finalize the event model
// 3. support full Firmata 2.2 protocol
// 4. decouple socket (so you could use web socket, flash socket via swf, or other)?
// 5. align code to js best practices


/**
 * Creates a new Arduino object representing the digital and analog inputs and
 * outputs of the device as well as support for sending strings between the Arduino
 * sketch and your javascript application. Also support for hardware such as controlling
 * a servo motor from javascript and additional libraries for an RFID reader with more
 * to follow such as Button, Accelerometer, i2c device implementation, etc.
 *
 * @constructor
 */
function Arduino(host, port) {
	"use strict";

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
	
	var _evtDispatcher = new EventDispatcher(this);
			
	connect();
			
	// private methods:
	
	// to do: 
	// Create a wrapper for WebSocket and compose the wrapper in this class
	// rather than using WebSockets directly.
	// This will enable the user to swap the wrapper object if do not want to
	// use WebSockets as long as all Socket wrappers maintain a consistent interface.
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
		_firmwareVersion=msg[1] + msg[2] / 10;
		self.dispatchEvent(new ArduinoEvent(ArduinoEvent.FIRMWARE_NAME, {name: fname, version: _firmwareVersion}));
		
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
	
	//public methods:
	
	/**
	 * A utility class to assemble a single value from the 2 bytes returned from the
	 * Arduino (since data is passed in 7 bit Bytes rather than 8 bit it must be 
	 * reassembled. This is to be used as a protected method and should not be needed
	 * in any application level code.
	 *
	 * @private
	 * @param lsb {number} The least-significant byte of the 2 values to be concatentated
	 * @param msb {number} The most-significant byte of the 2 values to be concatenated
	 * @return {number} The result of merging the 2 bytes
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
		self.send([REPORT_DIGITAL, 0]);
		self.send([REPORT_DIGITAL + 1, 0]);
	}
	
	/**
	 * Enables digital pin reporting for all digital pins. You must call this
	 * before you can receive digital pin data from the Arduino.
	 */
	this.enableDigitalPinReporting = function() {
		self.send([REPORT_DIGITAL + 0, 1]);
		self.send([REPORT_DIGITAL + 1, 1]);
	}
	
	/**
	 * Call this method to enable or disable analog input for the specified pin.
	 * Listen for the ArduinoEvent.ANALOG_DATA to be notified of incoming analog data.
	 *
	 * @param pin {number} The pin connected to the analog input
	 * @param mode {number} Arduino.ON to enable input or Arduino.OFF to disable input
	 * for the specified pin.
	 */
	this.setAnalogPinReporting = function(pin, mode) {
		self.send([REPORT_ANALOG | pin, mode]);
	}
	
	/**
	 * Set the specified pin to Input or Output. Also used to enable the pull-up resistor
	 * for the specified pin by writing Arduino.HIGH to the pin.
	 * For example, setPinMode(4, Arduino.HIGH) will enable the pull-up resistor for digital
	 * pin 4.
	 * For digital input, listen for the ArduinoEvent.DIGITAL_DATA to be notified 
	 * of incoming digital data.
	 *
	 * @param pin {number} The pin connected to the digital input or output
	 * @param mode {number} Arduino.INPUT or Arduino.OUTPUT and optionally Arduino.HIGH to 
	 * enable the pull-up resistor.
	 */
	this.setPinMode = function(pin, mode) {
		self.send([SET_PIN_MODE, pin, mode]);
	}
	
	/**
	 * Returns the analog data for a specified pin. When an analog value
	 * is received it is stored. However it is best in most cases to listen
	 * for the ArduinoEvent.ANALOG_DATA and get the analog value from the
	 * event parameter (event.data.value) rather than using this getter method.
	 *
	 * @param pin {number} The pin number to return analog data for
	 * @return {number} The analog data for the specified pin
	 */
	this.getAnalogData = function(pin) {
		return _analogData[pin];
	}
	
	/**
	 * Returns the digital data for a specified pin. When a digital value
	 * is received it is stored. However it is best in most cases to listen
	 * for the ArduinoEvent.DIGITAL_DATA and get the digital value from the
	 * event parameter (event.data.value) rather than using this getter method.
	 
	 * @param pin {number} The pin number to return digital data for
	 * @return {number} The digital data for the specified pin
	 */	
	this.getDigitalData = function(pin) {
		return _digitalData[pin];
	}
	
	/**
	 * @return {string} The version of the Firmata firmware running on the Arduino.
	 */
	this.getFirmwareVersion = function() {
		return _firmwareVersion;
	}
	
	/**
	 * Simulate an analog signal on a PWM pin. For example use this method to fade an LED or
	 * send an 8-bit waveform.
	 *
	 * @param pin {number} The pin to send the analog signal to.
	 * @param value {number} The value (to do: check on max resolution) to send
	 */
	this.sendAnalog = function(pin, value) {
		self.send([ANALOG_MESSAGE | (pin & 0x0F), value & 0x7F,(value >> 7) & 0x7F]);
	}
	
	/**
	 * Set a digital pin on the Arduino to High or Low.
	 *
	 * @param pin {number} The pin number to set or clear.
	 * @param mode {number} Either Arduino.HIGH or Arduino.LOW
	 */
	this.sendDigital = function(pin, mode) {
		if (mode == Arduino.HIGH) {
			// set the bit
			_digitalPins|=(mode << pin);
		}
		else if (mode == Arduino.LOW) {
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
	
	// to do: test this function... I've never actually used it.
	this.sendDigitalPort = function(portNumber, portData) {
		self.send([DIGITAL_MESSAGE | (portNumber & 0x0F), portData % 128, portData >> 7]);
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
	 * @param s {String} The string message to send to the Arduino
	 */
	this.sendString = function(s) {
		this.sendSysex(STRING_DATA, s);
	}
	
	/**
	 * Send a sysEx message to the Arduino. This is useful for sending custom sysEx data
	 * to the Arduino, for example if you are not using StandardFirmata. You would likely
	 * use it in a class rather than calling it from your main application.
	 *
	 * @private
	 * @param command {number} The sysEx command value (see firmata.org)
	 * @param data {array} A packet of data representing the sysEx message to be sent
	 * @see <a href="http://firmata.org/wiki/Protocol#Sysex_Message_Format">Firmata Sysex Message Format"</a>
	 */
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
	
	/**
	 * Set the angle (in degrees) to rotate the servo head to. Only tested for 0-180 degrees
	 * so far since that's the limit of my servo.
	 *
	 * @param pin {number} The pin the servo is connected to.
	 * @param value {number} The angle (in degrees) to rotate the servo head to
	 */
	this.sendServo = function(pin, value) {
		//if (_digitalPinMode[pin]==Arduino.SERVO && (_digitalData[pin]!=value || force)) {
			self.send([ANALOG_MESSAGE | (pin & 0x0F), value % 128, value >> 7]);
			_digitalData[pin] = value;
		//}
	}
	
	/**
	 * Call to associate a pin with a connected servo motor. See the documentation for your
	 * servo motor for the minimum and maximum pulse width. If you can't find it, then the
	 * default values should be close enough so call sendServoAttach(pin) omitting the
	 * min and max values.
	 *
	 * @param pin {number} The pin the server is connected to.
	 * @param minPulse {number} The minimum pulse width for the servo. Default = 544.
	 * @param maxPulse {number} The maximum pulse width for the servo. Default = 2400.
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
		//_digitalPinMode[pin] = Arduino.SERVO;
		
		self.send(tempArray);
	}
	
	/**
	 * Checks if a servo is connected to the specified pin number
	 *
	 * @param pin {number} The pin number you are checking for a servo on.
	 * @return {number} The pin number if it contains a servo, else -1
	 */
	this.getServo = function(pin) {
		if (_digitalPinMode[pin] == Arduino.SERVO) {
			return _digitalData[pin];
		} else {
			return -1;
		}
	}
		
	/**
	 * A wrapper for the send method of the WebSocket
	 * I'm not sure there is a case for the user to call this method
	 * So I'm making this private for now.
	 *
	 * @private
	 * @param message {array} Message data to be sent to the Arduino
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
	 * @borrows EventDispatcher#addEventListener as this.addEventListener
	 */
	this.addEventListener = function(type, listener) {
		_evtDispatcher.addEventListener(type, listener);
	}
	
	/**
	 * @borrows EventDispatcher#removeEventListener as this.removeEventListener
	 */	
	this.removeEventListener = function(type, listener) {
		_evtDispatcher.removeEventListener(type, listener);
	}
	
	/**
	 * @borrows EventDispatcher#hasEventListener as this.hasEventListener
	 */	
	this.hasEventListener = function(type) {
		return _evtDispatcher.hasEventListener(type);
	}
	
	/**
	 * @borrows EventDispatcher#dispatchEvent as this.dispatchEvent
	 */	
	this.dispatchEvent = function(event) {
		return _evtDispatcher.dispatchEvent(event);
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


/**
 * @constructor
 * @augments Event
 * @param type {string} The event type
 * @param data {object} An object containing additional parameters
 */
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
ArduinoEvent.FIRMWARE_NAME			= "firmwareName";
ArduinoEvent.STRING_MESSAGE			= "stringMessage";
ArduinoEvent.SYSEX_MESSAGE			= "sysexMessage";

// to do: figure out how to inherit a class without using 'new' when we want
// to call the super class in the subclass constructor (as we do in this case)
ArduinoEvent.prototype = new Event;
ArduinoEvent.prototype.constructor = ArduinoEvent;
