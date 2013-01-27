(function () {

   var IOBoard,
      expect,
      sinon,
      common,
      uno;

   expect = window.chai.expect;
   sinon = window.sinon;
   common = window.common;
   uno = window.uno;
   IOBoard = window.BO.IOBoard;
   //WSocketWrapper = window.BO.WSocketWrapper;

   describe('IOBoard Test Suite', function () {

      var board,
         stubs = [],
         dispatcher;

      beforeEach(function () {
         //stubs.push(sinon.stub(WSocketWrapper.prototype, "init"));
         stubs.push(sinon.stub(IOBoard.prototype, "send"));
         stubs.push(sinon.stub(IOBoard.prototype, "startupInSingleClientMode"));
         //stubs.push(sinon.stub(IOBoard.prototype, "startupInMultiClientMode"));
         
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

         // may want to run this against fixtures representing a variety of
         // arduino boards
         describe('input messages', function () {

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

                  spy = sinon.spy(board, "processSysExString"),
                  listenerSpy = sinon.spy(),
                  spyCall;

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

         describe.skip('output methods', function () {

            describe('sendAnalogData', function () {
               it("should...", function () {

               });
            });

            describe('sendExtendedAnalogData', function () {
               it("should...", function () {

               });
            });

            describe('sendDigitalData', function () {
               it("should...", function () {

               });
            });

            describe('sendServoData', function () {
               it("should...", function () {

               });
            });

            describe('sendServoAttach', function () {
               it("should...", function () {

               });
            });

            describe('sendString', function () {
               it("should...", function () {

               });
            });            

            describe('sendSysex', function () {
               it("should...", function () {

               });
            });

            describe('sendDigitalPort', function () {
               it("should...", function () {

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
                        if (capabilities[boardType.i2cPins[i]]["i2c"]) {
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
                     }

                     expect(i2cPinMatchCount).to.equal(len);
                     expect(checkI2cPins(board.getI2cPins()[0])).to.equal(true);
                     expect(checkI2cPins(board.getI2cPins()[1])).to.equal(true);
                  });

                  it("should report the correct pwm pins", function () {
                     var capabilities = board.getPinCapabilities(),
                        len = boardType.pwmPins.length,
                        pwmPinMatchCount = 0;

                     for (var i = 0; i < len; i++) {
                        if (capabilities[boardType.pwmPins[i]]["pwm"]) {
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

                  it("should parse a digital messages", function () {
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

               describe.skip("pin state query", function () {

                  it("should parse a pin state query response", function () {

                  });

               });

            });

         };

         describeBoardType("Arduino Uno", uno);

         //describeBoardType("Arduino Mega", mega);

         //describeBoardType("Arduino Fio", fio);


      });

   });

})();
