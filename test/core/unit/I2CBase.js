(function () {

    var I2CBase = window.BO.I2CBase,
        Pin = window.BO.Pin,
        expect = window.chai.expect,
        sinon = window.sinon,
        board,
        pin;

    // stub IOBoard instance
    board = {
        addEventListener: function () {},
        getI2cPins: function () {},
        sendSysex: function () {},
        getValueFromTwo7bitBytes: function () {},
        getPin: function () {},
    };

    // stub Pin instance
    pin = {
        getType: function () {}
    };

    describe('I2CBase Test Suite', function () {
        var stubs = [],
            addr = 0x01,
            i2c;

        beforeEach(function () {
            var getType = sinon.stub(pin, "getType"),
                getPin = sinon.stub(board, "getPin"),
                getI2cPins = sinon.stub(board, "getI2cPins");
            
            getPin.returns(pin);
            getType.returns(Pin.I2C);
            getI2cPins.returns([pin, pin]);

            stubs.push(getI2cPins);
            stubs.push(getPin);
            stubs.push(getType);
        });

        afterEach(function () {
            for (var i = 0, len = stubs.length; i < len; i++) {
                stubs[i].restore();
            }
            stubs = [];
        });

        describe('I2CBase Constructor', function () {
            var listenerSpy,
                sendSysexSpy;

            beforeEach(function () {
                listenerSpy = sinon.spy(board, "addEventListener");
                sendSysexSpy = sinon.spy(board, "sendSysex");

                i2c = new I2CBase(board, addr);
            });

            afterEach(function () {
                listenerSpy.restore();
                sendSysexSpy.restore();
            });

            it('should be a function', function () {
                expect(I2CBase).to.be.a('function');
            });

            it('should be a function constructor', function () {
                expect(I2CBase.prototype.constructor).to.equal(I2CBase);
            });

            it('should add event listener for SYSEX_MESSAGE', function () {
                expect(listenerSpy.calledOnce).to.equal(true);
            });

            it('should call board.sendSysex with delay of 0', function () {
                var spyCall = sendSysexSpy.getCall(0);

                expect(sendSysexSpy.calledOnce).to.equal(true);
                expect(spyCall.args[0]).to.equal(I2CBase.I2C_CONFIG);
                expect(spyCall.args[1][0]).to.equal(0);
                expect(spyCall.args[1][1]).to.equal(0);
            });

            it('should call board.sendSysex with delay of 270', function () {
                var delayUS = 270,
                    unpackDelay,
                    spyCall;

                i2c = new I2CBase(board, addr, delayUS);
                spyCall = sendSysexSpy.getCall(1);

                unpackDelay = spyCall.args[1][0] + (spyCall.args[1][1] << 7);

                // 1st call was from beforeEach function
                expect(sendSysexSpy.calledTwice).to.equal(true);
                expect(spyCall.args[0]).to.equal(I2CBase.I2C_CONFIG);
                expect(unpackDelay).to.equal(delayUS);
            });
        });

        describe('I2CBase Interface', function () {

            beforeEach(function () {
                i2c = new I2CBase(board, addr);
            });

            describe('onSysExMessage', function () {
                var event = {},
                    spy,
                    stub;

                beforeEach(function () {
                    event.message = [I2CBase.I2C_REPLY, 1, 0, 2, 0, 4, 4];
                    spy = sinon.spy(i2c, "handleI2C");
                    stub = sinon.stub(board, "getValueFromTwo7bitBytes", function (lsb, msb) {
                        return (msb << 7) | lsb;
                    });  
                });

                afterEach(function () {
                    spy.restore();
                    stub.restore();
                });

                it('should return if message is not of type I2CBase.I2C_REPLY', function () {
                    event.message[0] = 0;

                    i2c.onSysExMessage(event);

                    expect(spy.callCount).to.equal(0);
                });

                it('should return if i2c address is not matched', function () {
                    event.message[1] = 7; // set address to 7

                    i2c.onSysExMessage(event);

                    expect(spy.callCount).to.equal(0);
                });

                it('should call handleI2C with expected args', function () {
                    i2c.onSysExMessage(event);

                    expect(spy.withArgs([2, 516]).calledOnce).to.equal(true);
                });

            });

            describe('sendI2CRequest', function () {
                var data = [0, 1, 2, 3];

                it('should call board.sendSysex with expected args', function () {
                    var spy = sinon.spy(board, "sendSysex"),
                        spyCall;

                    i2c.sendI2CRequest(data);
                    spyCall = spy.getCall(0);

                    expect(spy.calledOnce).to.equal(true);
                    expect(spyCall.args[0]).to.equal(I2CBase.I2C_REQUEST);
                    expect(spyCall.args[1].length).to.equal(6);
                    // data: 1, 0, 2, 0, 3, 0
                    expect(spyCall.args[1][2]).to.equal(2);
                    expect(spyCall.args[1][4]).to.equal(3);

                    spy.restore();
                });

            });

        });

    });

})();        