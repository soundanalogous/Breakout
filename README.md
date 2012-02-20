About
===

Breakout is a prototyping tool for exploring the intersection of the web and the physical world. The popular [Arduino](http://arduino.cc) platform and the [Firmata](http://firmata.org) protocol are leveraged to enable users to access physical input and output purely from javascript. This makes it easy for anyone familiar with javascript and basic web development to explore the possibilities of using physical I/O in their web applications. Furthermore, the Breakout framework includes a growing library of hardware abstractions such as buttons, leds, servo motors, accelerometers, gyros, etc enabling the user to easily interface with a range of sensors and actuators using just a few lines of javascript code.

Breakout grew out of a need for a simple platform to enable designers to prototype functional web-based interfaces to the physical world. It is based largely on the [Funnel](http://funnel.cc) toolkit and informed by the experiences of the developers of both Funnel and Breakout as designers, technologists and educators.

Breakout is currently beta software. The API is stable, but bugs are possible. Please create an issue if you suspect a bug. Additional examples and hardware abstractions (Breakout/src/io/) will likely be added.

See [breakoutjs.com](http://breakoutjs.com) for detailed documentation and other helpful information.


Quick Start
---

See the detailed [Getting Started guide](http://breakoutjs.com/?page_id=28) on breakoutjs.com or the quickstart guide below.

The first step is to upload StandardFirmata to your Arduino (or Arduino-compatible) board and wire up some components:

1. Launch Arduino 1.0 and navigate to File -> Examples -> Firmata -> StandardFirmata
2. Compile StandardFirmata for your board and upload.
3. Wire up a button and led to you I/O board as illustrated on page 2 in Breakout/examples/schematics.pdf (or download [here](http://breakoutjs.com/examples/schematics.pdf)).

The next step is to run the Breakout Server application:

1. Make sure your I/O board is attached and the StandardFirmata sketch is uploaded. 
2. You'll find Breakout Server (Breakout Server.app for OS X, Breakout Server.exe for Windows, BreakoutServer.jar for Linux) in Breakout/server/. Simply double-click to launch the application. Note: Linux users need to run ```sudo apt-get install librxtx-java``` or manually install the librxtxSerial.so driver before launching the BreakoutServer.jar application.
3. Select the serial port for your board from the drop-down if it is not the current port displayed.
4. If your firewall is enabled, make sure port 8887 is open (or enter a new port that is open).
5. Click the Connect button. You should see the message "Server running on: <your server name>: 8887/".
6. Open http://localhost:8887/examples/getting_started/hello_world.html in Chrome (v14 or greater), Firefox (v7 or greater), or Safari (v5 or greater). If you changed the network port in step 4, update it on line 36 of the hello_world.html example and in the url above.

For more information on using Breakout Server including enabling multiple client connections, changing the webserver root directory, or using Breakout with mobile devices, see [Using Breakout Server](http://breakoutjs.com/?page_id=136).

As an alternative to the Breakout Server application, a node.js-based server is also included. See the [Using the node.js server](https://github.com/soundanalogous/Breakout/wiki/Using-the-node.js-server) for details.  


Requirements
---

Breakout is only supported for Arduino 1.0 and higher [Download Arduino 1.0](http://arduino.cc/en/Main/Software).

You will need one of the following I/O boards:

- An Arduino version Diecimila or newer (Uno, Fio, Mega, Pro, LilyPad, etc). 
- Any of the [Teensy Boards](http://www.pjrc.com/teensy/)
- Many Arduino clones / variants should also work
- See [Test Environment](https://github.com/soundanalogous/Breakout/wiki/Test-Environment) for full list of tested I/O boards

OS:

- Mac OS X 10.6 or higher
- Windows 7 ([Java JRE 1.6 or greater required](http://www.java.com/en/download/index.jsp))
- Has been tested successfuly on Ubuntu 11.10 running in 64-bit mode on an x86-64 processor
- May work on older versions of OS X and Windows as well but has not been tested
- May work on other Linux distributions but has not been tested

Desktop Browsers:

- Chrome version 14 or higher
- Firefox version 7 or higher
- Safari version 5 or higher

Mobile Browsers (browser must support websockets):

- Safari mobile
- Firefox mobile version 7 or higher
- Chrome Beta (for Android 4.0 and higher)
- See [Test Environment](https://github.com/soundanalogous/Breakout/wiki/Test-Environment) for list of tested phones and tablets

Change Log
---
2012.02.20 Version 0.1.0

- First public beta

