(function () {

    var IOBoard = window.BO.IOBoard,
        expect = window.chai.expect,
        sinon = window.sinon,
        common = window.fixtures.common,
        uno = window.fixtures.uno,
        leonardo = window.fixtures.leonardo,
        mega2560 = window.fixtures.mega2560,
        fio = window.fixtures.fio,
        teensy2 = window.fixtures.teensy2,
        teensyPlusPlus2 = window.fixtures.teensyPlusPlus2;


    describe('IOBoard Test Suite', function () {

        var board,
            stubs = [],
            stubSend;

        beforeEach(function () {
            // save a reference to this stub to use in testing output methods
            stubSend = sinon.stub(IOBoard.prototype, "send");
            stubs.push(stubSend);

            board = new IOBoard("localhost", 8887);
        });

        afterEach(function () {
            for (var i = 0, len = stubs.length; i < len; i++) {
                stubs[i].restore();
            }
            stubs = [];
        });

        describe('IOBoard Constructor', function () {

            it('should be a function', function () {
                expect(IOBoard).to.be.a('function');
            });

            it('should be a function constructor', function () {
                expect(IOBoard.prototype.constructor).to.equal(IOBoard);
            });

        });

        describe('Common capabilities', function () {

            describe('parse input messages', function () {

                describe("firmware name and version", function () {
                    var spy,
                        listenerSpy;

                    beforeEach(function () {
                        var reportFirmware = common.reportFirmware,
                            len = reportFirmware.length;

                        spy = sinon.spy(board, "processQueryFirmwareResult");
                        listenerSpy = sinon.spy();

                        board.addEventListener("firmwareName", listenerSpy);

                        for (var i = 0; i < len; i++) {
                            board.processInput(reportFirmware[i]);
                        }
                    });

                    afterEach(function () {
                        spy.restore();
                    });

                    it("should parse the firmware version and name", function () {
                        expect(spy.calledOnce).to.equal(true);
                    });

                    it("should fire a FIRMWARE_NAME event", function () {
                        expect(listenerSpy.calledOnce).to.equal(true);
                    });

                    it("should report the firmware version", function () {
                        expect(board.getFirmwareVersion()).to.equal(2.3);
                    });

                    it("should report the firmware name", function () {
                        expect(board.getFirmwareName()).to.equal("AdvancedFirmata.ino");
                    });

                });

                describe("string message", function () {
                    var spy,
                        listenerSpy,
                        spyCall;

                    beforeEach(function () {
                        var stringMessage = common.stringMessage,
                            len = stringMessage.length;

                        spy = sinon.spy(board, "processSysExString");
                        listenerSpy = sinon.spy();

                        board.addEventListener("stringMessage", listenerSpy);

                        for (var i = 0; i < len; i++) {
                            board.processInput(stringMessage[i]);
                        }

                        spyCall = listenerSpy.getCall(0);
                    });

                    afterEach(function () {
                        spy.restore();
                    });

                    it("should parse a string message", function () {
                        expect(spy.calledOnce).to.equal(true);
                    });

                    it("should fire a STRING_MESSAGE event", function () {
                        expect(listenerSpy.calledOnce).to.equal(true);
                    });

                    it("should report the expected string message", function () {
                        expect(spyCall.args[0].message).to.equal("Hello World!");
                    });

                });

            });

            describe('create output messges', function () {
                var capabilityResponse,
                    capabilitySpy;

                beforeEach(function () {
                    var len;

                    capabilityResponse = uno.capabilityResponse;
                    capabilitySpy = sinon.spy(board, "processCapabilitiesResponse");
                    len = capabilityResponse.length;

                    // need to get the capability response each time in order to
                    // setup the pins
                    for (var i = 0; i < len; i++) {
                        board.processInput(capabilityResponse[i]);
                    }
                });

                afterEach(function () {
                    capabilitySpy.restore();
                });

                describe('sendAnalogData', function () {

                    it("should send the expected data", function () {
                        var spyCall;

                        board.sendAnalogData(11, 0.7);

                        spyCall = stubSend.getCall(1);

                        // called once for processInput and a second time for
                        // sendAnalogData
                        expect(stubSend.calledTwice).to.equal(true);
                        expect(spyCall.args[0].toString()).to.equal(common.sendAnalogData.toString());
                    });

                    it("should call sendExtendedAnalogData when pin number is > 15", function () {
                        var spy = sinon.spy(board, "sendExtendedAnalogData");

                        board.sendAnalogData(16, 0.5);

                        expect(spy.calledOnce).to.equal(true);
                        spy.restore();
                    });

                });

                describe('sendExtendedAnalogData', function () {

                    it("should send analog data up to 16 bits", function () {
                        var maxBits = common.sendExtendedAnalogData.maxBits,
                         spyCall;

                        board.sendExtendedAnalogData(11, Math.pow(2, 16));

                        spyCall = stubSend.getCall(1);

                        // called once for processInput and a second time for
                        // sendAnalogData
                        expect(stubSend.calledTwice).to.equal(true);
                        expect(spyCall.args[0].toString()).to.equal(maxBits.toString());
                    });

                    it("should send data on pins up to number 128", function () {
                        var maxPins = common.sendExtendedAnalogData.maxPins,
                         spyCall;

                        board.sendExtendedAnalogData(128, 255);

                        spyCall = stubSend.getCall(1);

                        // called once for processInput and a second time for
                        // sendAnalogData
                        expect(stubSend.calledTwice).to.equal(true);
                        expect(spyCall.args[0].toString()).to.equal(maxPins.toString());
                    });

                });

                describe('sendDigitalData', function () {

                    it("should call sendDigitalPort with expected data", function () {
                        var spy = sinon.spy(board, "sendDigitalPort"),
                            spyCall;

                        board.sendDigitalData(3, 1);

                        spyCall = spy.getCall(0);

                        expect(spy.calledOnce).to.equal(true);
                        expect(spyCall.args.toString()).to.equal(common.sendDigitalData.toString());

                        spy.restore();
                    });

                });

                describe('sendDigitalPort', function () {

                    it("should send the expected data", function () {
                        var spyCall;

                        board.sendDigitalPort(common.sendDigitalData[0], common.sendDigitalData[1]);

                        spyCall = stubSend.getCall(1);

                        expect(stubSend.calledTwice).to.equal(true);
                        expect(spyCall.args[0].toString()).to.equal(common.sendDigitalPort.toString());
                    });

                });             

                describe('sendString', function () {

                    it("should call sendSysex with the expected string data", function () {
                        var spy = sinon.spy(board, "sendSysex"),
                            spyCall;

                        board.sendString("Hello World!");

                        spyCall = spy.getCall(0);

                        expect(spy.calledOnce).to.equal(true);
                        expect(spyCall.args[0]).to.equal(common.sendString[0]);
                        expect(spyCall.args[1].toString()).to.equal(common.sendString[1].toString());

                        spy.restore();
                    });

                });            

                describe('sendSysex', function () {

                    it("should send the expected message", function () {
                        var spyCall;

                        board.sendSysex(common.sendString[0], common.sendString[1]);

                        spyCall = stubSend.getCall(1);

                        expect(stubSend.calledTwice).to.equal(true);
                        expect(spyCall.args[0].toString()).to.equal(common.sendSysex.toString());
                    });

                });

                describe('sendServoAttach', function () {

                    it("should send the expected servo config data", function () {
                        var spyCall;

                        board.sendServoAttach(9);

                        spyCall = stubSend.getCall(1);

                        expect(stubSend.calledTwice).to.equal(true);
                        expect(spyCall.args[0].toString()).to.equal(common.sendServoAttach.toString());
                    });

                }); 

                describe('sendServoData', function () {

                    it("should call sendAnalogData with the expected pin and value", function () {
                        var spy = sinon.spy(board, "sendAnalogData"),
                            pin = common.sendServoData[0],
                            value = common.sendServoData[1];

                        // call to setup pin
                        board.sendServoAttach(9);
                        board.sendServoData(9, 0.5); // 90 degrees

                        expect(spy.withArgs(pin, value).calledOnce).to.equal(true);
                    });

                });

                describe('setDigitalPinMode', function () {
                    var pin = 2,
                        mode = 1,
                        getDigitalPinStub,
                        managePinStub;

                    beforeEach(function () {
                        getDigitalPinStub = sinon.stub(board, "getDigitalPin");
                        getDigitalPinStub.returns({
                            setType: sinon.stub()
                        });
                        managePinStub = sinon.stub(board, "managePinListener");
                    });

                    afterEach(function () {
                        getDigitalPinStub.restore();
                        managePinStub.restore();
                    });

                    it("should send the set pin mode command if silent param is not defined or not true", function () {
                        board.setDigitalPinMode(pin, mode);
                        
                        // called once for processInput and a second time for
                        // setDigitalPinMode
                        expect(stubSend.calledTwice).to.equal(true);

                        board.setDigitalPinMode(pin, mode, false);
                        expect(stubSend.calledThrice).to.equal(true);
                    });

                    it("should not send the set pin command if silent param is true", function () {
                        board.setDigitalPinMode(pin, mode, true);

                        // called once for processInput but not called for 
                        // setDigitalPinMode
                        expect(stubSend.calledOnce).to.equal(true);
                    });
                });

            });

        });


        describe('Capabilities by board', function () {

            // a common test set to be used by all supported board types
            var describeBoardType = function (boardName, boardType) {

                describe(boardName, function () {
                    var capabilityResponse,
                        capabilitySpy;

                    beforeEach(function () {
                        var len;

                        capabilityResponse = boardType.capabilityResponse;
                        capabilitySpy = sinon.spy(board, "processCapabilitiesResponse");
                        len = capabilityResponse.length;

                        // need to get the capability response each time in order to
                        // setup the pins
                        for (var i = 0; i < len; i++) {
                            board.processInput(capabilityResponse[i]);
                        }
                    });

                    afterEach(function () {
                        capabilitySpy.restore();
                    });

                    describe("capabilities", function () {

                        it("should parse a capability query response", function () {
                            expect(capabilitySpy.calledOnce).to.equal(true);
                        });

                        it("should report the correct number of pins", function () {
                            expect(board.getPinCount()).to.equal(boardType.numPins);
                        });

                        // default states are set in the firmware (AdvancedFirmata)
                        // the pin states set by the IOBoard should match the states
                        // set in firmware on startup
                        it("should report the default pin states", function () {
                            var pins = board.getPins(),
                            len = pins.length,
                            pinTypeMatchCount = 0;

                            for (var i = 0; i < len; i++) {
                                if (pins[i].getType() === boardType.defaultPinStates[i]) {
                                    pinTypeMatchCount++;
                                }
                            }

                            expect(pinTypeMatchCount).to.equal(len);
                        });               

                        it("should report the correct i2c pins", function () {
                            var capabilities = board.getPinCapabilities(),
                                len = boardType.i2cPins.length,
                                i2cPinMatchCount = 0;

                            for (var i = 0; i < len; i++) {
                                if (capabilities[boardType.i2cPins[i]].i2c) {
                                    i2cPinMatchCount++;
                                }
                            }

                            // because there is not way to guarantee that the i2c
                            // pins will be assigned in the same order for all boards
                            var checkI2cPins = function (boardPin) {
                                var result = false;
                                if (boardPin === boardType.i2cPins[0] || boardPin === boardType.i2cPins[1]) {
                                    result = true;
                                }
                                return result;
                            };

                            expect(i2cPinMatchCount).to.equal(len);
                            expect(checkI2cPins(board.getI2cPins()[0])).to.equal(true);
                            expect(checkI2cPins(board.getI2cPins()[1])).to.equal(true);
                        });

                        it("should report the correct pwm pins", function () {
                            var capabilities = board.getPinCapabilities(),
                                len = boardType.pwmPins.length,
                                pwmPinMatchCount = 0;

                            for (var i = 0; i < len; i++) {
                                if (capabilities[boardType.pwmPins[i]].pwm) {
                                    pwmPinMatchCount++;
                                }
                            }

                            expect(pwmPinMatchCount).to.equal(len);
                        });

                    });

                    describe("analog pin mapping", function () {
                        var analogMapping,
                            spy;

                        beforeEach(function () {
                            var len;

                            analogMapping = boardType.analogMapping;
                            spy = sinon.spy(board, "processAnalogMappingResponse");
                            len = analogMapping.length;

                            for (var j = 0; j < len; j++) {
                                board.processInput(analogMapping[j]);
                            }
                        });

                        afterEach(function () {
                            spy.restore();
                        });

                        it("should parse an analog mapping response", function () {
                            expect(spy.calledOnce).to.equal(true);
                        });

                        it("should report the correct number of analog pins", function () {
                            expect(board.getAnalogPinCount()).to.equal(boardType.analogPinCount);
                        });

                        it("should report correct analog pin range", function () {
                            expect(board.getAnalogPin(0).number).to.equal(boardType.firstAnalogPinNum);
                            expect(board.getAnalogPin(boardType.analogPinCount - 1).number).to.equal(boardType.lastAnalogPinNum);
                        });

                    });

                    describe("analog input", function () {
                        var spy,
                            listenerSpy,
                            spyCall;

                        beforeEach(function () {
                            var analogInput = common.analogInput,
                                analogMapping = boardType.analogMapping,
                                aMapLen = analogMapping.length,
                                aInLen = analogInput.length;

                            spy = sinon.spy(board, "processAnalogMessage");
                            listenerSpy = sinon.spy();

                            board.addEventListener("analogData", listenerSpy);

                            // map analog pins to test against the analog pin number
                            for (var j = 0; j < aMapLen; j++) {
                                board.processInput(analogMapping[j]);
                            }

                            for (var i = 0; i < aInLen; i++) {
                                board.processInput(analogInput[i]);
                            }

                            spyCall = listenerSpy.getCall(0);
                        });

                        afterEach(function () {
                            spy.restore();
                        });

                        it("should parse an analog message", function () {
                            expect(spy.calledOnce).to.equal(true);
                        });

                        it("should fire an ANALOG_DATA event", function () {
                            expect(listenerSpy.calledOnce).to.equal(true);
                        });

                        it("should report the correct pin number and value", function () {
                            var pin = spyCall.args[0].pin;

                            expect(pin.analogNumber).to.equal(boardType.testAnalogPin);
                            expect(pin.value.toFixed(2)).to.equal("0.79");
                        });

                    });

                    describe("digital input", function () {
                        var spy,
                            listenerSpy,
                            spyCall;

                        beforeEach(function () {
                            var digitalInput = common.digitalInput,
                                len = digitalInput.length;

                            spy = sinon.spy(board, "processDigitalMessage"),
                            listenerSpy = sinon.spy();

                            // set pin to input
                            board.setDigitalPinMode(2, 0);
                            board.addEventListener("digitalData", listenerSpy);

                            for (var i = 0; i < len; i++) {
                                board.processInput(digitalInput[i]);
                            }

                            spyCall = listenerSpy.getCall(0);
                        });

                        afterEach(function () {
                            spy.restore();
                        });

                        it("should parse a digital message", function () {
                            expect(spy.calledOnce).to.equal(true);
                        });

                        it("should fire a DIGITAL_DATA event", function () {
                            expect(listenerSpy.calledOnce).to.equal(true);
                        });

                        it("should report the correct pin number and value", function () {
                            var pin = spyCall.args[0].pin;

                            expect(pin.number).to.equal(boardType.testDigitalPin);
                            expect(pin.value).to.equal(1);
                        });

                    });

                    describe("pin state query", function () {
                        var spy,
                            listenerSpy;

                        beforeEach(function () {
                            var dOutPinState = boardType.pinStateResponse.digitalOut,
                                len = dOutPinState.length;

                            spy = sinon.spy(board, "processPinStateResponse");
                            listenerSpy = sinon.spy();

                            board.addEventListener("pinStateResponse", listenerSpy);

                            // increments pinStateRequest counter so the response can
                            // be processed
                            board.queryPinState(board.getDigitalPin(boardType.testPinStateDout));

                            for (var i = 0; i < len; i++) {
                                board.processInput(dOutPinState[i]);
                            }
                        });

                        afterEach(function () {
                            spy.restore();
                        });

                        it("should parse a pin state query response", function () {
                            expect(spy.calledOnce).to.equal(true);
                        });

                        it("should fire a PIN_STATE_RESPONSE event", function () {
                            expect(listenerSpy.calledOnce).to.equal(true);
                        });

                        it("should report the expected digital out pin number and state", function () {
                            var spyCall = listenerSpy.getCall(0),
                                pin = spyCall.args[0].pin;

                            expect(pin.number).to.equal(boardType.testPinStateDout);
                            expect(pin.state).to.equal(1);
                        });

                        it("should report the expected pwm pin number and state", function () {
                            var pwmPinState = boardType.pinStateResponse.pwm,
                                len = pwmPinState.length,
                                pin,
                                spyCall;

                            board.queryPinState(board.getDigitalPin(boardType.testPinStatePwm));   

                            for (var i = 0; i < len; i++) {
                                board.processInput(pwmPinState[i]);
                            }

                            // spy on the 2nd listener call
                            spyCall = listenerSpy.getCall(1);
                            pin = spyCall.args[0].pin;

                            expect(pin.number).to.equal(boardType.testPinStatePwm);
                            expect(pin.state.toFixed(2)).to.equal('0.85');
                        });                  

                    });

                });

            };

            describeBoardType("Arduino Uno", uno);

            describeBoardType("Arduino Mega 2560", mega2560);

            describeBoardType("Arduino Leonardo", leonardo);

            describeBoardType("Arduino Fio", fio);

            describeBoardType("Teensy 2.0", teensy2);

            describeBoardType("Teensy++ 2.0", teensyPlusPlus2);

        });

    });

})();
