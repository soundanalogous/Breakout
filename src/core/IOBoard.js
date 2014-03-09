/**
 * Copyright (c) 2011-2014 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.IOBoard');

BO.IOBoard = (function () {

    var IOBoard;

    // Private static constants:

    // Message command bytes (128-255/0x80-0xFF)
    var DIGITAL_MESSAGE         = 0x90,
        ANALOG_MESSAGE          = 0xE0,
        REPORT_ANALOG           = 0xC0,
        REPORT_DIGITAL          = 0xD0,
        SET_PIN_MODE            = 0xF4,
        REPORT_VERSION          = 0xF9,
        SYSEX_RESET             = 0xFF,
        START_SYSEX             = 0xF0,
        END_SYSEX               = 0xF7;
    
    // Extended command set using sysex (0-127/0x00-0x7F)
    var SERVO_CONFIG            = 0x70,
        STRING_DATA             = 0x71,
        SHIFT_DATA              = 0x75,
        I2C_REQUEST             = 0x76,
        I2C_REPLY               = 0x77,
        I2C_CONFIG              = 0x78,
        EXTENDED_ANALOG         = 0x6F,
        PIN_STATE_QUERY         = 0x6D,
        PIN_STATE_RESPONSE      = 0x6E,
        CAPABILITY_QUERY        = 0x6B,
        CAPABILITY_RESPONSE     = 0x6C,
        ANALOG_MAPPING_QUERY    = 0x69,
        ANALOG_MAPPING_RESPONSE = 0x6A,
        REPORT_FIRMWARE         = 0x79,
        SAMPLING_INTERVAL       = 0x7A,
        SYSEX_NON_REALTIME      = 0x7E,
        SYSEX_REALTIME          = 0x7F;

    var MIN_SAMPLING_INTERVAL   = 10,
        MAX_SAMPLING_INTERVAL   = 100,
        MULTI_CLIENT = "multiClient";


    // Dependencies
    var Pin = BO.Pin,
        EventDispatcher = JSUTILS.EventDispatcher,
        PinEvent = BO.PinEvent,
        IOBoardEvent = BO.IOBoardEvent;

    /**
     * Creates an interface to the I/O board. The IOBoard object brokers
     * the communication between your application and the physical I/O board.
     * Currently you can only connect to a single I/O board per computer.
     * However you could connect to multiple I/O boards if they are attached to
     * multiple computers on your network. In that case you would create a
     * separate IOBoard instance for each board you are connecting to in your
     * network.
     *
     * @class IOBoard
     * @constructor
     * @uses JSUTILS.EventDispatcher
     * @param {String} host The host address of the web server.
     * @param {Number} port The port to connect to on the web server.
     * Default = false.
     * @param {String} protocol [optional] The websockt protocol definition 
     * (if necessary).
     */
    IOBoard = function (host, port, protocol) {
        "use strict";
        
        this.name = "IOBoard";
                        
        // Private properties
        this._socket = null;
        this._inputDataBuffer = [];
        this._digitalPort = [];
        this._numPorts = 0;
        this._analogPinMapping = [];
        this._digitalPinMapping = [];
        this._i2cPins = [];
        this._ioPins = [];
        this._totalPins = 0;
        this._totalAnalogPins = 0;
        this._samplingInterval = 19; // Default sampling interval
        this._isReady = false;
        this._firmwareName = "";
        this._firmwareVersion = 0;
        this._evtDispatcher = null;
        this._isMultiClientEnabled = false;
        this._isConfigured = false;
        this._capabilityQueryResponseReceived = false;
        this._debugMode = BO.enableDebugging;
        this._numPinStateRequests = 0;
        
        this._evtDispatcher = new EventDispatcher(this);

        // bind event handlers to this
        this.initialVersionResultHandler = this.onInitialVersionResult.bind(this);
        this.sendOutHandler = this.sendOut.bind(this);
        this.socketConnectionHandler = this.onSocketConnection.bind(this);
        this.socketMessageHandler = this.onSocketMessage.bind(this);
        this.socketClosedHandler = this.onSocketClosed.bind(this);

        this._socket = new BO.WSocketWrapper(host, port, protocol);
        this._socket.addEventListener(BO.WSocketEvent.CONNECTED, this.socketConnectionHandler);
        this._socket.addEventListener(BO.WSocketEvent.MESSAGE, this.socketMessageHandler);
        this._socket.addEventListener(BO.WSocketEvent.CLOSE, this.socketClosedHandler);

    };

    IOBoard.prototype = {

        constructor: IOBoard,

        // Private methods:

        /**
         * A websocket connection has been established.
         * @private
         * @method onSocketConnection
         */
        onSocketConnection: function (event) {
            this.debug("debug: Socket Status: (open)");
            this.dispatchEvent(new IOBoardEvent(IOBoardEvent.CONNECTED));
            this.begin();
        },

        /**
         * A websocket message has been received.
         * @param {Object} event The message property is an array of one or
         * more stringified bytes from the board or a config string from
         * the server.
         * @private
         * @method onSocketMessage
         */
        onSocketMessage: function (event) {
            var message = event.message,
                data = [],
                len;

            if (message.length > 1) {
                data = message.split(",");

                len = data.length;
                for (var i = 0; i < len; i++) {
                    this.parseInputMessage(data[i]);
                }
            } else {
                this.parseInputMessage(message);
            }
        },

        /**
         * Determine if the incoming data is a config message or a byte.
         * @param {String} data A string representing a config message or
         * an 8-bit unsigned integer.
         * @private
         * @method parseInputMessage
         */
        parseInputMessage: function (data) {
            var pattern = /config/,
                message = "";

            // Check for config messages from the server
            if (data.match(pattern)) {
                // to do: update servers to send a JSON string
                // then parse the string here
                message = data.substr(data.indexOf(':') + 2);
                this.processStatusMessage(message);
            } else {
                // We have data from the IOBoard
                this.processInput(parseInt(data, 10));
            }
        },

        /**
         * Report that the websocket connection has been closed.
         * @private
         * @method onSocketClosed
         */
        onSocketClosed: function (event) {
            this.debug("debug: Socket Status: " + this._socket.readyState + " (Closed)");
            this.dispatchEvent(new IOBoardEvent(IOBoardEvent.DISCONNECTED));
        },

        /**
         * Request the firmware version from the IOBoard.
         * @private
         * @method begin
         */
        begin: function () {
            this.addEventListener(IOBoardEvent.FIRMWARE_NAME, this.initialVersionResultHandler);
            this.reportFirmware();
        },

        /**
         * On startup, Firmata reports its version. Make sure the version is
         * 2.3 or greater before proceeding. If the Firmata version is < 2.3
         * report this to the user (to do: throw appropriate error?).
         *
         * @private
         * @method onInitialVersionResult
         */
        onInitialVersionResult: function (event) {
            var version = event.version * 10,
                name = event.name,
                self = this;

            this.removeEventListener(IOBoardEvent.FIRMWARE_NAME, this.initialVersionResultHandler);

            this.debug("debug: Firmware name = " + name + ", Firmware version = " + event.version);
            
            // Make sure the user has uploaded StandardFirmata 2.3 or greater
            if (version >= 23) {

                if (!this._isMultiClientEnabled) {
                    // reset IOBoard to its default state
                    this.systemReset();

                    // Delay to allow systemReset function to execute in StandardFirmata
                    setTimeout(function () {
                        self.queryCapabilities();
                        self.checkForQueryResponse();
                    }, 200);
                } else {
                    this.queryCapabilities();
                    this.checkForQueryResponse();
                }

            } else {
                var err = "error: You must upload StandardFirmata version 2.3 or greater from Arduino version 1.0 or higher";
                console.log(err);
                //throw err;
            }
        },

        /**
         * Check if a capability response was received. If not, assume that
         * a custom sketch was loaded to the IOBoard and fire a READY event.
         * @private
         * @method checkForQueryResponse
         */
        checkForQueryResponse: function () {
            var self = this;

            // If after 200ms a capability query response is not received,
            // assume that the user is running a custom sketch that does
            // not implement a capability query response.

            // 200ms is sufficient for an Arduino Mega (current longest
            // response time). Need to revisit when Arduino Due support is
            // added to Firmata.
            setTimeout(function () {
                if (self._capabilityQueryResponseReceived === false) {
                    self.startup();
                }
            }, 200);
        },

        /**
         * Process a status message from the websocket server
         * @private
         * @method processStatusMessage
         */
        processStatusMessage: function (message) {
            if (message === MULTI_CLIENT) {
                this.debug("debug: Multi-client mode enabled");
                this._isMultiClientEnabled = true;
            }
        },

        /**
         * Process input data from the IOBoard.
         * @param {Number} inputData Number as an 8-bit unsigned integer
         * @private
         * @method processInput
         */
        processInput: function (inputData) {
            var len;

            this._inputDataBuffer.push(inputData);
            len = this._inputDataBuffer.length;

            if (this._inputDataBuffer[0] >= 128 && this._inputDataBuffer[0] != START_SYSEX) {
                if (len === 3) {
                    this.processMultiByteCommand(this._inputDataBuffer);
                    // Clear buffer
                    this._inputDataBuffer = [];
                }
            } else if (this._inputDataBuffer[0] === START_SYSEX && this._inputDataBuffer[len - 1] === END_SYSEX) {
                this.processSysexCommand(this._inputDataBuffer);
                // Clear buffer
                this._inputDataBuffer = [];
            } else if (inputData >= 128 && this._inputDataBuffer[0] < 128) {
                // If for some reason we got a new command and there is already data
                // in the buffer, reset the buffer
                console.log("warning: Malformed input data... resetting buffer");
                this._inputDataBuffer = [];
                if (inputData !== END_SYSEX) {
                    this._inputDataBuffer.push(inputData);
                }
            }
        },

        /**
         * Incoming data is either multibyte or sysex. Route multibyte
         * data to the appropriate method.
         *
         * @private
         * @method processMultiByteCommand
         */
        processMultiByteCommand: function (commandData) {
            var command = commandData[0],
                channel;

            if (command < 0xF0) {
                command = command & 0xF0;
                channel = commandData[0] & 0x0F;
            }

            switch (command) {
            case DIGITAL_MESSAGE:
                this.processDigitalMessage(channel, commandData[1], commandData[2]); //(LSB, MSB)
                break;
            case REPORT_VERSION:
                this._firmwareVersion = commandData[1] + commandData[2] / 10;
                this.dispatchEvent(new IOBoardEvent(IOBoardEvent.FIRMWARE_VERSION), {version: this._firmwareVersion});
                break;
            case ANALOG_MESSAGE:
                this.processAnalogMessage(channel, commandData[1], commandData[2]);
                break;
            }
        },

        /**
         * Processing inmcoming digital data. Parse the port number and value
         * to determine if any digital input data has changed. Dispatch an
         * event if the value has changed.
         *
         * @param {Number} port Digital data is sent per port. This does not
         * align with the concept of a microcontroller port, but is a
         * collection of 8 pins on the microcontroller.
         *
         * @param {Number} bits0_6 Bits 0 - 6 of the port value.
         * @param {Number} bits7_13 Bits 7 - 13 of the port value.
         * @private
         * @method processDigitalMessage
         */
        processDigitalMessage: function (port, bits0_6, bits7_13) {
            var offset = port * 8,
                lastPin = offset + 8,
                portVal = bits0_6 | (bits7_13 << 7),
                pinVal,
                pin = {};
            
            if (lastPin >= this._totalPins) {
                lastPin = this._totalPins;
            }
            
            var j = 0;
            for (var i = offset; i < lastPin; i++) {
                pin = this.getDigitalPin(i);
                // Ignore data send on Firmata startup
                if (pin === undefined) {
                    return;
                }
                
                if (pin.getType() == Pin.DIN) {
                    pinVal = (portVal >> j) & 0x01;
                    if (pinVal != pin.value) {
                        pin.value = pinVal;
                        this.dispatchEvent(new IOBoardEvent(IOBoardEvent.DIGITAL_DATA), {pin: pin});
                    }
                }
                j++;
            }
        },

        /**
         * Process incoming analog data. The value is mapped from
         * 0 - pin.analogReadResolution to a floating point value between
         * 0.0 - 1.0.
         *
         * @private
         * @method processAnalogMessage
         */
        processAnalogMessage: function (channel, bits0_6, bits7_13) {
            var analogPin = this.getAnalogPin(channel);

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

            // scale according to the analog read resolution set for the pin
            analogPin.value = this.getValueFromTwo7bitBytes(bits0_6, bits7_13) / analogPin.analogReadResolution;
            if (analogPin.value != analogPin.lastValue) {
                this.dispatchEvent(new IOBoardEvent(IOBoardEvent.ANALOG_DATA), {pin: analogPin});
            }
        },

        /**
         * Route the incoming sysex data to the appropriate method.
         * @private
         * @method processSysexCommand
         */
        processSysexCommand: function (sysexData) {
            // Remove the first and last element from the array
            // since these are the START_SYSEX and END_SYSEX 
            sysexData.shift();
            sysexData.pop();

            var command = sysexData[0];
            switch (command) {
            case REPORT_FIRMWARE:
                this.processQueryFirmwareResult(sysexData);
                break;
            case STRING_DATA:
                this.processSysExString(sysexData);
                break;
            case CAPABILITY_RESPONSE:
                this.processCapabilitiesResponse(sysexData);
                break;
            case PIN_STATE_RESPONSE:
                this.processPinStateResponse(sysexData);
                break;
            case ANALOG_MAPPING_RESPONSE:
                this.processAnalogMappingResponse(sysexData);
                break;
            default:
                // Custom sysEx message
                this.dispatchEvent(new IOBoardEvent(IOBoardEvent.SYSEX_MESSAGE), {message: sysexData});
                break;
            }
        },

        /**
         * Construct the firmware name and version from incoming ascii data.
         * @private
         * @method processQueryFirmwareResult
         */
        processQueryFirmwareResult: function (msg) {
            var data;
            for (var i = 3, len = msg.length; i < len; i += 2) {
                data = msg[i];
                data += msg[i + 1];
                this._firmwareName += String.fromCharCode(data);
            }
            this._firmwareVersion = msg[1] + msg[2] / 10;
            this.dispatchEvent(new IOBoardEvent(IOBoardEvent.FIRMWARE_NAME), {name: this._firmwareName, version: this._firmwareVersion});
        },
        
        /**
         * Construct a String from an incoming ascii data.
         * @private
         * @method processSysExString
         */
        processSysExString: function (msg) {
            var str = "",
                data,
                len = msg.length;

            for (var i = 1; i < len; i += 2) {
                data = msg[i];
                data += msg[i + 1];
                str += String.fromCharCode(data);
            }
            this.dispatchEvent(new IOBoardEvent(IOBoardEvent.STRING_MESSAGE), {message: str});
        },

        /** 
         * Auto configure using capabilities response.
         * This creates a configuration for any board in the Firmata boards.h 
         * file.
         *
         * @private
         * @method processCapabilitiesResponse
         */
        processCapabilitiesResponse: function (msg) {
            // If running in multi-client mode and this client is already 
            // configured, ignore capabilities response
            if (this._isConfigured) {
                return;
            }

            var pinCapabilities = {},
                byteCounter = 1, // Skip 1st byte because it's the command
                pinCounter = 0,
                analogPinCounter = 0,
                len = msg.length,
                type,
                pin;

            this._capabilityQueryResponseReceived = true;
                    
            // Create default configuration
            while (byteCounter <= len) {
                // 127 denotes end of pin's modes
                if (msg[byteCounter] == 127) {
                    
                    // Is digital pin mapping even necessary anymore?
                    this._digitalPinMapping[pinCounter] = pinCounter;
                    type = undefined;
                    
                    // Assign default types
                    if (pinCapabilities[Pin.DOUT]) {
                        // Map digital pins
                        type = Pin.DOUT;
                    }
                    
                    if (pinCapabilities[Pin.AIN]) {
                        type = Pin.AIN;
                        // Map analog input pins
                        this._analogPinMapping[analogPinCounter++] = pinCounter;
                    }
                    
                    pin = new Pin(pinCounter, type);
                    pin.setCapabilities(pinCapabilities);
                    this.managePinListener(pin);
                    this._ioPins[pinCounter] = pin;
                    
                    // Store the 2 i2c pin numbers if they exist
                    // To Do: allow for more than 2 i2c pins on a board?
                    // How to identify SDA-SCL pairs in that case?
                    if (pin.getCapabilities()[Pin.I2C]) {
                        this._i2cPins.push(pin.number);
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
            
            this._numPorts = Math.ceil(pinCounter / 8);
            this.debug("debug: Num ports = " + this._numPorts);
            
            // Initialize port values
            for (var j = 0; j < this._numPorts; j++) {
                this._digitalPort[j] = 0;
            }
            
            this._totalPins = pinCounter;
            this._totalAnalogPins = analogPinCounter;
            this.debug("debug: Num pins = " + this._totalPins);

            // Map the analog pins to the board pins
            // This will map the IOBoard analog pin numbers (printed on IOBoard)
            // to their digital pin number equivalents
            this.queryAnalogMapping();
        },

        /**
         * Map map analog pins to board pin numbers. Need to do this because
         * the capability query does not provide the correct order of analog
         * pins.
         *
         * @private
         * @method processAnalogMappingResponse
         */
        processAnalogMappingResponse: function (msg) {
            // If running in multi-client mode and this client is 
            // already configured ignore analog mapping response
            if (this._isConfigured) {
                return;
            }

            var len = msg.length;
            for (var i = 1; i < len; i++) {
                if (msg[i] != 127) {
                    this._analogPinMapping[msg[i]] = i - 1;
                    this.getPin(i - 1).setAnalogNumber(msg[i]);
                }
            }
            
            if (!this._isMultiClientEnabled) {
                this.startup();
            } else {
                this.startupInMultiClientMode();
            }
        },
        
        /**
         * Single client mode is the default mode.
         * Checking the "Enable multi-client" box in the Breakout Server UI to
         * enable multi-client mode.
         * 
         * @private
         * @method startupInMultiClientMode
         */
        startupInMultiClientMode: function () {
            var len = this.getPinCount();
            // Populate pins with the current IOBoard state
            for (var i = 0; i < len; i++) {
                this.queryPinState(this.getDigitalPin(i));
            }

            // Wait for the pin states to finish updating
            setTimeout(this.startup.bind(this), 500);
            this._isConfigured = true;
        },

        /**
         * The IOBoard is configured and ready to send and accept commands.
         * @private
         * @method startup
         */
        startup: function () {
            this.debug("debug: IOBoard ready");
            this._isReady = true;
            this.enableDigitalPins();
            this.dispatchEvent(new IOBoardEvent(IOBoardEvent.READY));
        },
        
        /**
         * Resets the board to its default state without physically resetting
         * the board.
         *
         * @private
         * @method systemReset
         */
        systemReset: function () {
            this.debug("debug: System reset");
            this.send(SYSEX_RESET);
        },

        /**
         * Reads the current configuration of the requested pin. The following
         * values are returned: 1: pin number, 2: pin type (0: DIN, 1: DOUT, 
         * 2: AIN, 3: AOUT / PWM, 4: SERVO, 5: SHIFT, 6: I2C), 3: pin state.
         * The pin state for output modes is the value previously written
         * to the pin. For input modes (AIN, DIN, etc) the state is typically
         * zero (it is not the value that was written to the pin). For digital
         * inputs the state is the status of the pullup resistor.
         *
         * @private
         * @method processPinStateResponse
         */
        processPinStateResponse: function (msg) {
            // Ignore requests that were not made by this client
            if (this._numPinStateRequests <= 0) {
                return;
            }
                        
            var len = msg.length,
                pinNumber = msg[1],
                pinType = msg[2],
                pinState,
                pin = this._ioPins[pinNumber];

            if (len > 4) {
                pinState = this.getValueFromTwo7bitBytes(msg[3], msg[4]);
            } else if (len > 3) {
                pinState = msg[3];
            }
            
            // update the pin type if it has changed
            // typically this only happens when multiple clients are connecting
            // to a single IOBoard. Each client (aside from the initial client) 
            // needs to get the current pin type
            if (pin.getType() != pinType) {
                pin.setType(pinType);
                this.managePinListener(pin);
            }

            pin.setState(pinState);
            
            this._numPinStateRequests--;
            if (this._numPinStateRequests < 0) {
                // should never happen, but just in case...
                this._numPinStateRequests = 0;
            }

            this.dispatchEvent(new IOBoardEvent(IOBoardEvent.PIN_STATE_RESPONSE), {pin: pin});
        },

        /**
         * Convert char to decimal value.
         * 
         * @private
         * @method toDec
         */
        toDec: function (ch) {
            ch = ch.substring(0, 1);
            var decVal = ch.charCodeAt(0);
            return decVal;
        },
        
        /**
         * Called when ever a pin value is set via pin.value = someValue.
         * Sends digital or analog output pin and output values to the IOBoard.
         *
         * @private
         * @method sendOut
         * @param {Event} event A reference to the event object (Pin in this
         * case).
         */
        sendOut: function (event) {
            var type = event.target.getType(),
                pinNum = event.target.number,
                value = event.target.value;

            switch (type) {
            case Pin.DOUT:
                this.sendDigitalData(pinNum, value);
                break;
            case Pin.AOUT:
                this.sendAnalogData(pinNum, value);
                break;
            case Pin.SERVO:
                this.sendServoData(pinNum, value);
                break;
            }
        },

        /**
         * Ensure that event listeners are properly managed for pin objects 
         * as the pin type is changed during the execution of the program.
         *
         * @private
         * @method managePinListener
         */
        managePinListener: function (pin) {
            if (pin.getType() == Pin.DOUT || pin.getType() == Pin.AOUT || pin.getType() == Pin.SERVO) {
                if (!pin.hasEventListener(PinEvent.CHANGE)) {
                    pin.addEventListener(PinEvent.CHANGE, this.sendOutHandler);
                }
            } else {
                if (pin.hasEventListener(PinEvent.CHANGE)) {
                    try {
                        pin.removeEventListener(PinEvent.CHANGE, this.sendOutHandler);
                    } catch (e) {
                        // Pin had reference to other handler, ignore
                        this.debug("debug: Caught pin removeEventListener exception");
                    }
                }
            }
        },

        /**
         * Sends an analog value up to 14 bits on an analog pin number between
         * 0 and 15. The value passed to this method should be in the range of
         * 0.0 to 1.0. It is multiplied by the analog write (PWM) resolution
         * set for the pin.
         *
         * @param {Number} pin The analog pin number.
         * param {Number} value The value to send (0.0 to 1.0).
         * @private
         * @method sendAnalogData
         */
        sendAnalogData: function (pin, value) {
            var pwmResolution = this.getDigitalPin(pin).analogWriteResolution;
            value *= pwmResolution;
            value = (value < 0) ? 0: value;
            value = (value > pwmResolution) ? pwmResolution : value;

            if (pin > 15 || value > Math.pow(2, 14)) {
                this.sendExtendedAnalogData(pin, value);
            } else {
                this.send([ANALOG_MESSAGE | (pin & 0x0F), value & 0x007F, (value >> 7) & 0x007F]);
            }
        },

        /**
         * Sends an analog value > 14 bits and/or send a value for a pin number
         * greater than 15.
         * @param {Number} pin The analog pin number (up to 128).
         * @param {Number} value The value to send (up to 16 bits).
         * @private
         * @method sendExtendedAnalogData
         */
        sendExtendedAnalogData: function (pin, value) {
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
            analogData[4] = (value >> 7) & 0x007F;  // Up to 14 bits
                    
            // If > 14 bits
            if (value >= Math.pow(2, 14)) {
                analogData[5] = (value >> 14) & 0x007F;
            }

            analogData.push(END_SYSEX);
            this.send(analogData);
        },

        /**
         * Add the pin value to the appropriate digital port and send the 
         * updated digital port value.
         * 
         * @param {Number} pin The digital pin number.
         * @param {Number} value The value of the digital pin (0 or 1).
         * @private
         * @method sendDigitalData
         */
        sendDigitalData: function (pin, value) {
            var portNum = Math.floor(pin / 8);

            if (value == Pin.HIGH) {
                // Set the bit
                this._digitalPort[portNum] |= (value << (pin % 8));
            }
            else if (value == Pin.LOW) {
                // Clear the bit
                this._digitalPort[portNum] &= ~(1 << (pin % 8));
            }
            else {
                console.log("warning: Invalid value passed to sendDigital, value must be 0 or 1.");
                return; // Invalid value
            }
            
            this.sendDigitalPort(portNum, this._digitalPort[portNum]);
        },

        /**
         * Send the servo angle.
         * @param {Number} pin The digital pin number the servo is attached to.
         * @param {Number} value The angle to rotate to (0.0 to 1.0 mapped to 0 - 180).
         * @private
         * @method sendServoData
         */
        sendServoData: function (pin, value) {
            var servoPin = this.getDigitalPin(pin);
            if (servoPin.getType() == Pin.SERVO && servoPin.lastValue != value) {
                this.sendAnalogData(pin, value);
            }
        },
        
        /**
         * Query the cababilities and current state any board running Firmata.
         * 
         * @private
         * @method queryCapabilities
         */
        queryCapabilities: function () {
            this.send([START_SYSEX, CAPABILITY_QUERY, END_SYSEX]);
        },

        /**
         * Query which pins correspond to the analog channels
         *
         * @private
         * @method queryAnalogMapping
         */
        queryAnalogMapping: function () {
            this.send([START_SYSEX, ANALOG_MAPPING_QUERY, END_SYSEX]);
        },

        /**
         * Call this method to enable or disable analog input for the specified
         * pin.
         *
         * @private
         * @method setAnalogPinReporting
         * @param {Number} pin The pin connected to the analog input
         * @param {Number} mode Pin.ON to enable input or Pin.OFF to disable
         * input for the specified pin.
         */
        setAnalogPinReporting: function (pin, mode) {
            this.send([REPORT_ANALOG | pin, mode]);
            this.getAnalogPin(pin).setType(Pin.AIN);
        },

        /**
         * for debugging
         * @private
         */
        debug: function (str) {
            if (this._debugMode) {
                console.log(str);
            }
        },

        // Getters and setters:

        /**
         * Get or set the sampling interval (how often to run the main loop on
         * the IOBoard). Normally the sampling interval should not be changed. 
         * Default = 19 (ms).
         *
         * @property samplingInterval
         * @type Number
         */
        get samplingInterval() {
            return this._samplingInterval;
        },
        set samplingInterval(interval) {
            if (interval >= MIN_SAMPLING_INTERVAL && interval <= MAX_SAMPLING_INTERVAL) {
                this._samplingInterval = interval;
                this.send([START_SYSEX, SAMPLING_INTERVAL, interval & 0x007F, (interval >> 7) & 0x007F, END_SYSEX]);
            } else {
                // To Do: Throw error?
                console.log("warning: Sampling interval must be between " + MIN_SAMPLING_INTERVAL + " and " + MAX_SAMPLING_INTERVAL);
            }
        },
        
        /**
         * Set to true when the IOBoard is ready. This can be used in place of
         * listening for the IOBoardEvent.READY event when creating an app with
         * a draw loop (such as when using processing.js or three.js);
         *
         * @property isReady
         * @type Boolean
         */
        get isReady() {
            return this._isReady;
        },


        // Public methods:

        /**
         * A utility class to assemble a single value from the 2 bytes returned
         * from the IOBoard (since data is passed in 7 bit Bytes rather than 
         * 8 bit it must be reassembled. This is to be used as a protected
         * method and should not be needed in any application level code.
         *
         * @private
         * @method getValueFromTwo7bitBytes
         * @param {Number} lsb The least-significant byte of the 2 values to
         * be concatentated
         * @param {Number} msb The most-significant byte of the 2 values to be
         * concatenated
         * @return {Number} The result of merging the 2 bytes
         */
        getValueFromTwo7bitBytes: function (lsb, msb) {
            return (msb << 7) | lsb;
        },
        
        /**
         * @method getSocket
         * @return {WSocketWrapper} A reference to the WebSocket
         */
        getSocket: function () {
            return this._socket;
        },
            
        /**
         * Request the Firmata version implemented in the firmware (sketch)
         * running on the IOBoard.
         * Listen for the IOBoard.FIRMWARE_VERSION event to be notified of when 
         * the Firmata version is returned from the IOBoard.
         * @method reportVersion
         */
        reportVersion: function () {
            this.send(REPORT_VERSION);
        },

        /**
         * Request the name of the firmware (the sketch) running on the IOBoard.
         * Listen for the IOBoard.FIRMWARE_NAME event to be notified of when 
         * the name is returned from the IOBoard. The version number is also
         * returned.
         * @method reportFirmware
         */
        reportFirmware: function () {
            this.send([START_SYSEX, REPORT_FIRMWARE, END_SYSEX]);
        },
        
        /**
         * Disables digital pin reporting for all digital pins.
         * @method disableDigitalPins
         */
        disableDigitalPins: function () {
            for (var i = 0; i < this._numPorts; i++) {
                this.sendDigitalPortReporting(i, Pin.OFF);
            }
        },
        
        /**
         * Enables digital pin reporting for all digital pins. You must call
         * this before you can receive digital pin data from the IOBoard.
         * @method enableDigitalPins
         */
        enableDigitalPins: function () {
            for (var i = 0; i < this._numPorts; i++) {
                this.sendDigitalPortReporting(i, Pin.ON);
            }
        },

        /**
         * Enable or disable reporting of all digital pins for the specified
         * port.
         * @method sendDigitalPortReporting
         * @param {Number} mode Either Pin.On or Pin.OFF
         */
        sendDigitalPortReporting: function (port, mode) {
            this.send([(REPORT_DIGITAL | port), mode]);
        },
        
        /**
         * Call this method to enable analog input for the specified pin.
         * @method enableAnalogPin
         * @param {Number} pin The pin connected to the analog input
         */
        enableAnalogPin: function (pin) {
            this.setAnalogPinReporting(pin, Pin.ON);
        },

        /**
         * Call this method to disable analog input for the specified pin.
         * @method disableAnalogPin
         * @param {Number} pin The pin connected to the analog input
         */
        disableAnalogPin: function (pin) {
            this.setAnalogPinReporting(pin, Pin.OFF);
        },

        /**
         * Set the specified digital pin mode. 
         *
         * @method setDigitalPinMode
         * @param {Number} pin The number of the pin. When using and analog
         * pin as a digital pin, refer the datasheet for your board to obtain 
         * the digital pin equivalent of the analog pin number. For example on 
         * an Arduino UNO, analog pin 0 = digital pin 14.
         * @param {Number} mode Pin.DIN, Pin.DOUT, Pin.PWM, Pin.SERVO,
         * Pin.SHIFT, or Pin.I2c
         * @param {Boolean} silent [optional] Set to true to not send
         * SET_PIN_MODE command. Default = false.
         */
        setDigitalPinMode: function (pinNumber, mode, silent) {
            this.getDigitalPin(pinNumber).setType(mode);
            this.managePinListener(this.getDigitalPin(pinNumber));
            
            // sometimes we want to set up a pin without sending the set pin
            // mode command because the firmware handles the pin mode
            if (!silent || silent !== true) {
                this.send([SET_PIN_MODE, pinNumber, mode]);
            }
        },

        /**
         * Enable the internal pull-up resistor for the specified pin number.
         * @method enablePullUp
         * @param {Number} pinNum The number of the input pin to enable the
         * pull-up resistor.
         */
        enablePullUp: function (pinNum) {
            this.sendDigitalData(pinNum, Pin.HIGH);
        },

        /**
         * @method getFirmwareName
         * @return {String} The name of the firmware running on the IOBoard.
         */
        getFirmwareName: function () {
            // To Do: It seams that Firmata is reporting the Firmware
            // name malformed.
            return this._firmwareName;
        },
        
        /**
         * @method getFirmwareVersion
         * @return {String} The version of the firmware running on the
         * IOBoard.
         */
        getFirmwareVersion: function () {
            return this._firmwareVersion;
        },

        /**
         * Returns the capabilities for each pin on the IOBoard. The array is
         * indexed by pin number (beginning at pin 0). Each array element
         * contains an object with a property for each modes (input, output, 
         * pwm, servo, i2c, etc) supported by the pin. The mode value is the
         * resolution in bits.
         *
         * @method getPinCapabilities
         * @return {Array} The capabilities of the Pins on the IOBoard.
         */
        getPinCapabilities: function () {
            var capabilities = [],
                len,
                pinElements,
                pinCapabilities,
                hasCapabilities;

            var modeNames = {
                0: "input",
                1: "output",
                2: "analog",
                3: "pwm",
                4: "servo",
                5: "shift",
                6: "i2c",
                7: "onewire",
                8: "stepper"
            };

            len = this._ioPins.length;
            for (var i = 0; i < len; i++) {
                pinElements = {};
                pinCapabilities = this._ioPins[i].getCapabilities();
                hasCapabilities = false;

                for (var mode in pinCapabilities) {
                    if (pinCapabilities.hasOwnProperty(mode)) {
                        hasCapabilities = true;
                        if (mode >= 0) {
                            pinElements[modeNames[mode]] = this._ioPins[i].getCapabilities()[mode];
                        }
                    }
                }

                if (!hasCapabilities) {
                    capabilities[i] = {"not available": "0"};
                } else {
                    capabilities[i] = pinElements;
                }
                
            }

            return capabilities;
        },

        /**
         * Reads the current state of the requested pin. Listen for the
         * IOBoardEvent.PIN_STATE_RESPONSE event to get the response.
         * The response contains a reference to the pin object with its
         * state updated to match the current state of the pin on the IOBoard.
         *
         * You should not typically need to call this method since the pin
         * states are maintained client-side. Use the getAnalogPin or 
         * getDigitalPin to get the current state of a pin or getPins to
         * get an array of all Pin objects for the IOBoard.
         *
         * Cases for queryPinState are to update the pin state after a period
         * of inactivity. For example if multiple client applications are
         * using the same IOBoard (so multiple JavaScript apps connected to
         * the same Arduino). When a new client connection is made, 
         * queryPinState is called automatically to copy the IOBoard pin state
         * to the client. If for some reason you needed to copy the state of a
         * single or multiple Pins again, you could call queryPinState in your
         * application. In most cases however you should never need to call 
         * this method.
         *
         * @method queryPinState
         * @param {Pin} pin The pin object to query the pin state for.
         */
        queryPinState: function (pin) {
            // To Do: Ensure that pin is a Pin object
            var pinNumber = pin.number;
            this.send([START_SYSEX, PIN_STATE_QUERY, pinNumber, END_SYSEX]);
            this._numPinStateRequests++;
        },

        /**
         * Send the digital values for a port. Making this private for now.
         *
         * @private
         * @method sendDigitalPort
         * @param {Number} portNumber The number of the port
         * @param {Number} portData A byte representing the state of the 8 pins
         * for the specified port
         */
        sendDigitalPort: function (portNumber, portData) {
            this.send([DIGITAL_MESSAGE | (portNumber & 0x0F), portData & 0x7F, portData >> 7]);
        },

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
         * @method sendString
         * @param {String} str The string message to send to the IOBoard
         */
        sendString: function (str) {
            // Convert chars to decimal values
            var decValues = [];
            for (var i = 0, len = str.length; i < len; i++) {
                decValues.push(this.toDec(str[i]) & 0x007F);
                decValues.push((this.toDec(str[i]) >> 7) & 0x007F);
            }
            // Data > 7 bits in length must be split into 2 bytes and  
            // packed into an array before passing to the sendSysex
            // method
            this.sendSysex(STRING_DATA, decValues);
        },

        /**
         * Send a sysEx message to the IOBoard. This is useful for sending
         * custom sysEx data to the IOBoard, for example if you are not using
         * StandardFirmata. You would likely use it in a class rather than 
         * calling it from your main application.
         *
         * @private
         * @method sendSysex
         * @param {Number} command The sysEx command value (see firmata.org)
         * @param {Number[]} data A packet of data representing the sysEx
         * message to be sent
         * @see <a href="http://firmata.org/wiki/Protocol#Sysex_Message_Format">Firmata Sysex Message Format"</a>
         */
        sendSysex: function (command, data) {
            var sysexData = [];
            sysexData[0] = START_SYSEX;
            sysexData[1] = command;
            // This would be problematic since the sysEx message format does
            // not enforce splitting all bytes after the command byte
            //for (var i=0, len=data.length; i<len; i++) {
            //  sysexData.push(data[i] & 0x007F);
            //  sysexData.push((data[i] >> 7) & 0x007F);                
            //}
            
            for (var i = 0, len = data.length; i < len; i++) {
                sysexData.push(data[i]);
            }
            sysexData.push(END_SYSEX);
            
            this.send(sysexData);
        },

        /**
         * Call to associate a pin with a connected servo motor. See the
         * documentation for your servo motor for the minimum and maximum 
         * pulse width. If you can't find it, then the default values should
         * be close enough so call sendServoAttach(pin) omitting the min and
         * max values.
         *
         * @method sendServoAttach
         * @param {Number} pin The pin the server is connected to.
         * @param {Number} minPulse [optional] The minimum pulse width for the
         * servo. Default = 544.
         * @param {Number} maxPulse [optional] The maximum pulse width for the
         * servo. Default = 2400.
         */
        sendServoAttach: function (pin, minPulse, maxPulse) {
            var servoPin,
                servoData = [];

            minPulse = minPulse || 544;      // Default value = 544
            maxPulse = maxPulse || 2400;     // Default value = 2400
        
            servoData[0] = START_SYSEX;
            servoData[1] = SERVO_CONFIG;
            servoData[2] = pin;
            servoData[3] = minPulse % 128;
            servoData[4] = minPulse >> 7;
            servoData[5] = maxPulse % 128;
            servoData[6] = maxPulse >> 7;
            servoData[7] = END_SYSEX;
            
            this.send(servoData);
        
            servoPin = this.getDigitalPin(pin);
            servoPin.setType(Pin.SERVO);
            this.managePinListener(servoPin);
        },

        /**
         * @private
         * @method getPin
         * @return {Pin} An unmapped reference to the Pin object.
         */
        getPin: function (pinNumber) {
            return this._ioPins[pinNumber];
        },
        
        /**
         * @method getAnalogPin
         * @return {Pin} A reference to the Pin object (mapped to the IOBoard
         * board analog pin).
         */
        getAnalogPin: function (pinNumber) {
            return this._ioPins[this._analogPinMapping[pinNumber]];
        },
        
        /**
         * @method getDigitalPin
         * @return {Pin} A reference to the Pin object (mapped to the IOBoard
         * board digital pin).
         */
        getDigitalPin: function (pinNumber) {
            return this._ioPins[this._digitalPinMapping[pinNumber]];
        },

        /**
         * @method getPins
         * @return {Pin[]} An array containing all pins on the IOBoard
         */
        getPins: function () {
            return this._ioPins;
        },

        /**
         * Use this method to obtain the digital pin number equivalent 
         * for an analog pin.
         *
         * @example
         *     // set analog pin A3 on an Arduino Uno to digital input
         *     board.setDigitalPinMode(board.analogToDigital(3), Pin.DIN);
         *
         * <p>board.analogToDigital(3) returns 17 which is the digital
         * equivalent of the analog pin</p>
         *
         * @method analogToDigital
         * @return {Number} The digital pin number equivalent for the specified
         * analog pin number.
         */
        analogToDigital: function (analogPinNumber) {
            return this.getAnalogPin(analogPinNumber).number;
        },
        
        /**
         * @method getPinCount
         * @return {Number} Total number of pins
         */
        getPinCount: function () {
            return this._totalPins;
        },

        /**
         * @method getAnalogPinCount
         * @return {Number} The total number of analog pins supported by this
         * IOBoard
         */
        getAnalogPinCount: function () {
            return this._totalAnalogPins;
        },
        
        /**
         * Returns undefined if the board does not have i2c pins.
         * @private
         * @method getI2cPins
         * @return {Number[]} The pin numbers of the i2c pins if the board has
         * i2c.
         */
        getI2cPins: function () {
            return this._i2cPins;
        },

        /**
         * Call this method to print the capabilities for all pins to 
         * the console.
         * @method reportCapabilities
         */
        reportCapabilities: function () {
            var capabilities = this.getPinCapabilities(),
                len = capabilities.length,
                resolution;

            for (var i = 0; i < len; i++) {
                console.log("Pin " + i + ":");
                for (var mode in capabilities[i]) {
                    if (capabilities[i].hasOwnProperty(mode)) {
                        resolution = capabilities[i][mode];
                        console.log("\t" + mode + " (" + resolution + (resolution > 1 ? " bits)" : " bit)"));
                    }
                }
            }
        },

        /**
         * A wrapper for the send method of the WebSocket
         * I'm not sure there is a case for the user to call this method
         * So I'm making this private for now.
         *
         * @private
         * @method send
         * @param {Number[]} message Message data to be sent to the IOBoard
         */
        send: function (message) {
            this._socket.sendString(message);
        },
        
        /**
         * A wrapper for the close method of the WebSocket. Making this 
         * private until a use case arises.
         *
         * @private
         * @method close
         */
        close: function () {
            this._socket.close();
        },

        // Implement EventDispatcher
        
        /**
         * @param {String} type The event type
         * @param {Function} listener The function to be called when the event
         * is fired
         */
        addEventListener: function (type, listener) {
            this._evtDispatcher.addEventListener(type, listener);
        },
        
        /**
         * @param {String} type The event type
         * @param {Function} listener The function to be called when the event
         * is fired
         */
        removeEventListener: function (type, listener) {
            this._evtDispatcher.removeEventListener(type, listener);
        },
        
        /**
         * @param {String} type The event type
         * return {boolean} True is listener exists for this type, false if not.
         */
        hasEventListener: function (type) {
            return this._evtDispatcher.hasEventListener(type);
        },
        
        /**
         * @param {Event} type The Event object
         * @param {Object} optionalParams Optional parameters to assign to the
         * event object.
         * return {boolean} True if dispatch is successful, false if not.
         */
        dispatchEvent: function (event, optionalParams) {
            return this._evtDispatcher.dispatchEvent(event, optionalParams);
        }

    };

    // Document events

    /**
     * The ioBoardReady event is dispatched when the board is ready to
     * send and receive commands. 
     * @type BO.IOBoardEvent.READY
     * @event ioBoardReady
     * @param {IOBoard} target A reference to the IOBoard
     */

    /**
     * The ioBoardConnected event is dispatched when the websocket 
     * connection is established.
     * @type BO.IOBoardEvent.CONNECTED
     * @event ioBoardConnected
     * @param {IOBoard} target A reference to the IOBoard
     */

    /**
     * The ioBoardDisconnected event is dispatched when the websocket
     * connection is closed.
     * @type BO.IOBoardEvent.DISCONNECTED
     * @event ioBoardDisconnected
     * @param {IOBoard} target A reference to the IOBoard
     */
     
    /**
     * The stringMessage event is dispatched when a string is received
     * from the IOBoard.
     * @type BO.IOBoardEvent.STRING_MESSAGE
     * @event stringMessage
     * @param {IOBoard} target A reference to the IOBoard
     * @param {String} message The string message received from the IOBoard
     */

    /**
     * The sysexMessage event is dispatched when a sysEx message is 
     * received from the IOBoard.
     * @type BO.IOBoardEvent.SYSEX_MESSAGE
     * @event sysexMessage
     * @param {IOBoard} target A reference to the IOBoard
     * @param {Array} message The sysEx data
     */
     
    /**
     * The firmwareVersion event is dispatched when the firmware version
     * is received from the IOBoard.
     * @type BO.IOBoardEvent.FIRMWARE_VERSION
     * @event firmwareVersion
     * @param {IOBoard} target A reference to the IOBoard
     * @param {Number} version The firmware version (where Firmata 2.3 = 23)
     */
     
    /**
     * The firmwareName event is dispatched when the firmware name is
     * received from the IOBoard.
     * @type BO.IOBoardEvent.FIRMWARE_NAME
     * @event firmwareName
     * @param {IOBoard} target A reference to the IOBoard
     * @param {String} name The name of the firmware running on the IOBoard
     * @param {Number} version The firmware version (where Firmata 2.3 = 23)
     */
     
    /**
     * The pinStateResponse event is dispatched when the results of
     * a pin state query (via a call to: queryPinState()) is received.
     * @type BO.IOBoardEvent.PIN_STATE_RESPONSE
     * @event pinStateResponse
     * @param {IOBoard} target A reference to the IOBoard
     * @param {BO.Pin} pin A reference to the pin object.
     */

    /**
     * The analogData event is dispatched when analog data is received
     * from the IOBoard. Use thie event to be notified when any analog
     * pin value changes. Use Pin.CHANGE to be notified when a specific
     * pin value changes.
     * @type BO.IOBoardEvent.ANALOG_DATA
     * @event analogData
     * @param {IOBoard} target A reference to the IOBoard
     * @param {BO.Pin} pin A reference to the pin object.
     */
     
    /**
     * The digitalData event is dispatched when digital data is received
     * from the IOBoard. Use this event to be notified when any digital
     * pin value changes. Use Pin.CHANGE to be notified when a specific
     * pin value changes.
     * @type BO.IOBoardEvent.DIGITAL_DATA
     * @event digitalData
     * @param {IOBoard} target A reference to the IOBoard
     * @param {BO.Pin} pin A reference to the pin object.
     */
     
    return IOBoard;

}());
