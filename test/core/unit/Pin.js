(function () {

    var Pin = window.BO.Pin,
        expect = window.chai.expect,
        sinon = window.sinon;

    describe('Pin Test Suite', function () {
        var pinNumber = 2,
            pin;

        describe('Pin Constructor', function () {

            beforeEach(function () {
                pin = new Pin(pinNumber, Pin.PWM);
            });

            it('should be a function', function () {
                expect(Pin).to.be.a('function');
            });

            it('should be a function constructor', function () {
                expect(Pin.prototype.constructor).to.equal(Pin);
            });

            it('should set the pin number', function () {
                expect(pin.number).to.equal(pinNumber);
            });

            it('should set the pin type', function () {
                expect(pin.getType()).to.equal(Pin.PWM);
            });
        });

        describe('Pin Interface', function () {

            describe('setState', function () {
                it('should convert PWM value to 0.0 - 1.0 range', function () {
                    pin = new Pin(pinNumber, Pin.PWM);
                    pin.setState(240);

                    expect(pin.state.toFixed(2)).to.equal('0.94');
                });
            });

            describe('set value', function () {
                var calcSpy,
                    filterSpy,
                    changeSpy;

                beforeEach(function () {
                    pin = new Pin(pinNumber, Pin.AIN);

                    calcSpy = sinon.spy(pin, "calculateMinMaxAndMean");
                    filterSpy = sinon.spy(pin, "applyFilters");
                    changeSpy = sinon.spy(pin, "detectChange");

                    pin.value = 0.77;
                });

                afterEach(function () {
                    calcSpy.restore();
                    filterSpy.restore();
                    changeSpy.restore();
                });

                it('should call calculateMinMaxAndMean with expected args', function () {
                    expect(calcSpy.withArgs(0.77).calledOnce).to.equal(true);
                });

                it('should call applyFilters with expected args', function () {
                    expect(filterSpy.withArgs(0.77).calledOnce).to.equal(true);
                });

                it('should call detectChange with expected args', function () {
                    var lastVal = pin.lastValue;
                    expect(changeSpy.withArgs(lastVal, 0.77).calledOnce).to.equal(true);
                });
            });

            describe('detectChange', function () {
                var spy;

                beforeEach(function () {
                    pin = new Pin(pinNumber, Pin.DOUT);
                    spy = sinon.spy(pin, "dispatchEvent");
                });

                afterEach(function () {
                    spy.restore();
                });

                it('should fire a CHANGE event', function () {
                    var spyCall;

                    pin.detectChange(0, 1);
                    spyCall = spy.getCall(0);

                    // once for change and once for either rising or falling
                    expect(spy.calledTwice).to.equal(true);
                    expect(spyCall.args[0].type).to.equal("pinChange");
                });

                it('should fire a RISING_EDGE event', function () {
                    var spyCall;

                    pin.detectChange(0, 1);
                    spyCall = spy.getCall(1);

                    // once for change and once for rising
                    expect(spy.calledTwice).to.equal(true);
                    expect(spyCall.args[0].type).to.equal("risingEdge");
                });                

                it('should fire a FALLING_EDGE event', function () {
                    var spyCall;

                    pin.detectChange(1, 0);
                    spyCall = spy.getCall(1);

                    // once for change and once for falling
                    expect(spy.calledTwice).to.equal(true);
                    expect(spyCall.args[0].type).to.equal("fallingEdge");
                });

            });

            describe('calculateMinMaxAndMean', function () {
                var values = [0.47, 0.14, 0.89, 0.66, 0.31];

                beforeEach(function () {
                    pin = new Pin(pinNumber, Pin.AIN);

                    for (var i = 0, len = values.length; i < len; i++) {
                        pin.calculateMinMaxAndMean(values[i]);
                    }
                });

                it('should calculate minimum value', function () {
                    expect(pin.minimum).to.equal(0.14);
                });

                it('should calculate maximum value', function () {
                    expect(pin.maximum).to.equal(0.89);
                });

                it('should calculate average value', function () {
                    expect(pin.average.toFixed(3)).to.equal('0.494');
                });

            });

            describe('addFilter', function () {
                var filter1 = {name: "filter1"},
                    filter2 = {name: "filter2"};

                beforeEach(function () {
                    pin = new Pin(pinNumber, Pin.AIN);
                });

                it('should add a filter', function () {
                    pin.addFilter(filter1);

                    expect(pin.filters.length).to.equal(1);
                    expect(pin.filters[0].name).to.equal("filter1");
                });

                it('should add 2 filters', function () {
                    pin.addFilter(filter1);
                    pin.addFilter(filter2);

                    expect(pin.filters.length).to.equal(2);
                    expect(pin.filters[1].name).to.equal("filter2");
                });
            });

            describe('removeFilter', function () {
                var filter1 = {name: "filter1"},
                    filter2 = {name: "filter2"},
                    filter3 = {name: "filter3"};

                it('should remove the specified filter', function () {
                    pin = new Pin(pinNumber, Pin.AIN);
                    pin.filters = [filter1, filter2, filter3];

                    expect(pin.filters.length).to.equal(3);

                    pin.removeFilter(filter2);

                    expect(pin.filters.length).to.equal(2);
                    expect(pin.filters.indexOf(filter2)).to.equal(-1);
                });
            });

            describe('applyFilters', function () {
                var filter1 = {
                    name: "filter1",
                    processSample: function (result) { return result; }
                };
                var filter2 = {
                    name: "filter2",
                    processSample: function (result) { return result; }
                };

                beforeEach(function () {
                    pin = new Pin(pinNumber, Pin.AIN);
                });

                it('should return the pin value if no filters are set', function () {
                    var value = pin.applyFilters(0.8);

                    expect(value).to.equal(0.8);
                });

                it('should call processSample for each filter', function () {
                    var spyProcessFilter1 = sinon.spy(filter1, "processSample");
                    var spyProcessFilter2 = sinon.spy(filter2, "processSample");

                    pin.filters = [filter1, filter2];
                    pin.applyFilters(0.8);

                    expect(spyProcessFilter1.calledOnce).to.equal(true);
                    expect(spyProcessFilter2.calledOnce).to.equal(true);

                    spyProcessFilter1.restore();
                    spyProcessFilter2.restore();
                });
            });            

            describe('addGenerator', function () {
                var generator = new BO.generators.GeneratorBase(),
                    spy;

                beforeEach(function () {
                    pin = new Pin(pinNumber, Pin.PWM);
                });

                afterEach(function () {
                    spy.restore();
                });

                it('should call removeGenerator', function () {
                    spy = sinon.spy(pin, "removeGenerator");
                    pin.addGenerator(generator);

                    expect(spy.calledOnce).to.equal(true);
                });

                it('should add a new generator', function () {
                    pin.addGenerator(generator);

                    expect(pin.generator).to.equal(generator);
                });

                it('should add an event listener to the generator', function () {
                    spy = sinon.stub(generator, "addEventListener");
                    pin.addGenerator(generator);

                    expect(spy.calledOnce).to.equal(true);
                });
            });

            describe('removeGenerator', function () {
                var generator = new BO.generators.GeneratorBase(),
                    spy;

                beforeEach(function () {
                    pin = new Pin(pinNumber, Pin.PWM);
                    pin.addGenerator(generator);
                });

                afterEach(function () {
                    spy.restore();
                });

                it('should remove the event listener from the generator', function () {
                    spy = sinon.spy(generator, "removeEventListener");
                    pin.removeGenerator();

                    expect(spy.calledOnce).to.equal(true);
                });

                it('should remove the generator', function () {
                    pin.removeGenerator();

                    expect(pin.generator).to.equal(null);
                });
            });

            describe('clear', function () {
                beforeEach(function () {
                    pin = new Pin(pinNumber, Pin.AIN);
                });

                it('should set min, max, avg, and last value to preFilterValue', function () {
                    pin.value = 0.22;
                    pin.value = 0.47;

                    pin.clear();

                    expect(pin.minimum).to.equal(pin.preFilterValue);
                    expect(pin.maximum).to.equal(pin.preFilterValue);
                    expect(pin.average).to.equal(pin.preFilterValue);
                    expect(pin.lastValue).to.equal(pin.preFilterValue);
                });

                it('should call clearWeight', function () {
                    var spy = sinon.spy(pin, "clearWeight");
                    pin.clear();
                    expect(spy.calledOnce).to.equal(true);

                    spy.restore();
                });
            });

        });

    });

})();        