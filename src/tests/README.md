Breakout Test Suite
===

Unit tests were written with [mocha](http://visionmedia.github.com/mocha/), [chai](http://chaijs.com/) (for assertions) and [sinon](http://sinonjs.org/) 
(for spies and stubs).

The IOBoard unit tests use fixture data that was sampled from each of the tested
board types. Currently the capabilities of the following boards are tested:

- Arduino Uno
- Arduino Mega 2560
- Arduino Leonardo
- Arduino Fio
- Teensy 2.0
- Teensy++ 2.0

IOBoard.js handles the communication with the physical board and the Firmata 
protocol implementation so a passing IOBoard test suite indicates that the core 
functionality is behaving as expected for each of the Arduino board variants 
listed above.


Running Tests
---

Until I get around to integrating tests into the build system, the unit tests
will need to be run manually.

1. Disconnect any boards connected to your computer. The tests run against 
sampled data in the fixtures directory rather than a connected board. Any 
connected boards may actually interfere with the tests.
2. Navigate to src/tests/core/ and open runner.html in your browser. The tests 
should run and you should (hopefully) see a green check next to each test 
indicating that it has passed.