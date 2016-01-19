(function() {

  var Serial = window.BO.Serial;
  var expect = window.chai.expect;
  var sinon = window.sinon;
  var board;

  var SERIAL_MESSAGE = 0x60;
  var CONFIG = 0x10;
  var WRITE = 0x20;
  var READ = 0x30;
  var REPLY = 0x40;
  var CLOSE = 0x50;
  var FLUSH = 0x60;
  var LISTEN = 0x70;

  var READ_CONTINUOUS = 0x00;
  var STOP_READING = 0x01;

  // stub IOBoard methods
  board = {
    addEventListener: function() {},
    sendSysex: function() {},
  };

  describe("Serial Test Suite", function() {

    describe("Serial Constructor", function() {

      it("should be a function", function() {
        expect(Serial).to.be.a("function");
      });

      it("should be a function constructor", function() {
        expect(Serial.prototype.constructor).to.equal(Serial);
      });

      it("should throw an error if no options are passed", function () {
        var fn = function () {
          var serial = new Serial();
        }
        expect(fn).to.throw(Error);
      });

      it("should throw an error if port is not defined", function () {
        var fn = function () {
          var serial = new Serial({
            board: board
          });
        }
        expect(fn).to.throw(Error);
      });

      it("should throw an error if SoftwareSerial RX and TX pins are not defined", function () {
        var fn = function () {
          var serial = new Serial({
            board: board,
            port: Serial.SW_SERIAL0
          });
        }
        expect(fn).to.throw(Error);
      })

      it("should default to 57600 baud", function () {
        var serial = new Serial({
          board: board,
          port: Serial.HW_SERIAL1
        })
        expect(serial.baud).to.equal(57600);
      });

      it("should set a baud rate of 9600", function () {
        var serial = new Serial({
          board: board,
          port: Serial.HW_SERIAL1,
          baud: 9600
        });
        expect(serial.baud).to.equal(9600);
      });

      it("should add event listener for SYSEX_MESSAGE", function () {
        var listenerSpy = sinon.spy(board, "addEventListener");
        var serial = new Serial({
          board: board,
          port: Serial.HW_SERIAL1
        });
        expect(listenerSpy.calledOnce).to.equal(true);
        listenerSpy.restore();
      });

      it("should call board.sendSysex with expected data", function () {
        var sendSysexSpy = sinon.spy(board, "sendSysex");
        var serial = new Serial({
          board: board,
          port: Serial.HW_SERIAL1
        });
        var spyCall = sendSysexSpy.getCall(0);
        expect(sendSysexSpy.calledOnce).to.equal(true);
        expect(spyCall.args[0]).to.equal(SERIAL_MESSAGE);
        expect(spyCall.args[1][0]).to.equal(CONFIG | Serial.HW_SERIAL1);
        sendSysexSpy.restore();
      });

    });

    describe("write", function () {
      var serial;
      var sendSysexSpy;

      beforeEach(function () {
        serial = new Serial({
          board: board,
          port: Serial.HW_SERIAL1
        });
        sendSysexSpy = sinon.spy(board, "sendSysex");
      });

      afterEach(function () {
        sendSysexSpy.restore();
      })

      it("should write a single byte to the Serial object", function () {
        serial.write(213);
        var spyCall = sendSysexSpy.getCall(0);
        expect(sendSysexSpy.calledOnce).to.equal(true);
        expect(spyCall.args[0]).to.equal(SERIAL_MESSAGE);
        expect(spyCall.args[1][0]).to.equal(WRITE | Serial.HW_SERIAL1);
        expect(spyCall.args[1][1]).to.equal(213 & 0x007F);
        expect(spyCall.args[1][2]).to.equal((213 >> 7) & 0x007F);
      });

      it("should write an array of bytes to the Serial object", function () {
        serial.write([213, 22, 187]);
        var spyCall = sendSysexSpy.getCall(0);
        expect(sendSysexSpy.calledOnce).to.equal(true);
        expect(spyCall.args[1][1]).to.equal(213 & 0x007F);
        expect(spyCall.args[1][2]).to.equal((213 >> 7) & 0x007F);
        expect(spyCall.args[1][5]).to.equal(187 & 0x007F);
        expect(spyCall.args[1][6]).to.equal((187 >> 7) & 0x007F);
      });

    });

    describe("startReading", function () {
      var serial;
      var sendSysexSpy;

      beforeEach(function () {
        serial = new Serial({
          board: board,
          port: Serial.HW_SERIAL1
        });
        sendSysexSpy = sinon.spy(board, "sendSysex");
      });

      afterEach(function () {
        sendSysexSpy.restore();
      })

      it("should send a request to start continuous reading", function () {
        serial.startReading();
        var spyCall = sendSysexSpy.getCall(0);
        expect(sendSysexSpy.calledOnce).to.equal(true);
        expect(spyCall.args[0]).to.equal(SERIAL_MESSAGE);
        expect(spyCall.args[1].length).to.equal(4);
        expect(spyCall.args[1][0]).to.equal(READ | Serial.HW_SERIAL1);
        expect(spyCall.args[1][1]).to.equal(READ_CONTINUOUS);
        expect(spyCall.args[1][2]).to.equal(0);
      });

      it("should send a request to start continuous reading with a max bytes limit", function () {
        serial.startReading(4);
        var spyCall = sendSysexSpy.getCall(0);
        expect(sendSysexSpy.calledOnce).to.equal(true);
        expect(spyCall.args[0]).to.equal(SERIAL_MESSAGE);
        expect(spyCall.args[1].length).to.equal(4);
        expect(spyCall.args[1][0]).to.equal(READ | Serial.HW_SERIAL1);
        expect(spyCall.args[1][1]).to.equal(READ_CONTINUOUS);
        expect(spyCall.args[1][2]).to.equal(4);
      });

    });

    describe("stopReading", function () {
      var serial;
      var sendSysexSpy;

      beforeEach(function () {
        serial = new Serial({
          board: board,
          port: Serial.HW_SERIAL1
        });
        sendSysexSpy = sinon.spy(board, "sendSysex");
      });

      afterEach(function () {
        sendSysexSpy.restore();
      })

      it("should send a request to stop continuous reading", function () {
        serial.stopReading();
        var spyCall = sendSysexSpy.getCall(0);
        expect(sendSysexSpy.calledOnce).to.equal(true);
        expect(spyCall.args[0]).to.equal(SERIAL_MESSAGE);
        expect(spyCall.args[1].length).to.equal(2);
        expect(spyCall.args[1][0]).to.equal(READ | Serial.HW_SERIAL1);
        expect(spyCall.args[1][1]).to.equal(STOP_READING);
      });

    });

    describe("close", function () {
      var serial;
      var sendSysexSpy;

      beforeEach(function () {
        serial = new Serial({
          board: board,
          port: Serial.HW_SERIAL1
        });
        sendSysexSpy = sinon.spy(board, "sendSysex");
      });

      afterEach(function () {
        sendSysexSpy.restore();
      })

      it("should send a request to close the serial port", function () {
        serial.close();
        var spyCall = sendSysexSpy.getCall(0);
        expect(sendSysexSpy.calledOnce).to.equal(true);
        expect(spyCall.args[0]).to.equal(SERIAL_MESSAGE);
        expect(spyCall.args[1][0]).to.equal(CLOSE | Serial.HW_SERIAL1);
      });

    });

    describe("flush", function () {
      var serial;
      var sendSysexSpy;

      beforeEach(function () {
        serial = new Serial({
          board: board,
          port: Serial.HW_SERIAL1
        });
        sendSysexSpy = sinon.spy(board, "sendSysex");
      });

      afterEach(function () {
        sendSysexSpy.restore();
      })

      it("should send a request to flush the serial port", function () {
        serial.flush();
        var spyCall = sendSysexSpy.getCall(0);
        expect(sendSysexSpy.calledOnce).to.equal(true);
        expect(spyCall.args[0]).to.equal(SERIAL_MESSAGE);
        expect(spyCall.args[1][0]).to.equal(FLUSH | Serial.HW_SERIAL1);
      });

    });

    describe("listen", function () {

      it("should send a request to listen to a software serial port", function () {
        serial = new Serial({
          board: board,
          port: Serial.SW_SERIAL0,
          baud: 9600,
          rxPin: 10,
          txPin: 11
        });
        sendSysexSpy = sinon.spy(board, "sendSysex");
        serial.listen();
        var spyCall = sendSysexSpy.getCall(0);
        expect(sendSysexSpy.calledOnce).to.equal(true);
        expect(spyCall.args[0]).to.equal(SERIAL_MESSAGE);
        expect(spyCall.args[1][0]).to.equal(LISTEN | Serial.SW_SERIAL0);
        sendSysexSpy.restore();
      });

      it("should not send a listen request to a hardware serial port", function () {
        serial = new Serial({
          board: board,
          port: Serial.HW_SERIAL1
        });
        sendSysexSpy = sinon.spy(board, "sendSysex");
        serial.listen();
        var spyCall = sendSysexSpy.getCall(0);
        expect(sendSysexSpy.callCount).to.equal(0);
        sendSysexSpy.restore();
      });

    });

  });

})();
