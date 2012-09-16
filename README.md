About
===

Breakout is a prototyping tool for exploring the intersection of the web and the physical world. The popular [Arduino](http://arduino.cc) platform and the [Firmata](http://firmata.org) protocol are leveraged to enable users to access physical input and output purely from javascript. This makes it easy for anyone familiar with javascript and basic web development to explore the possibilities of using sensors and actuators in their web applications. Furthermore, the Breakout framework includes a growing library of hardware abstractions such as buttons, leds, servo motors, accelerometers, gyros, etc enabling the user to easily interface with a range of sensors and actuators using just a few lines of javascript code.

![](http://breakoutjs.com/wp-content/uploads/2012/02/how_breakout_works.png)

Breakout grew out of a need for a simple platform to enable designers to prototype functional web-based interfaces to the physical world. It is based largely on the [Funnel](http://funnel.cc) toolkit and informed by the experiences of the developers of both Funnel and Breakout as designers, technologists and educators.

Breakout is currently beta software. The API is stable, but bugs are possible. Please submit an issue if you suspect a bug.

See [breakoutjs.com](http://breakoutjs.com) for detailed documentation and other helpful information.


Quick Start
---

See the detailed [Getting Started guide](http://breakoutjs.com/getting-started/) on [breakoutjs.com](breakoutjs.com) or the quickstart guide below.

The first step is to upload **StandardFirmata** to your Arduino (or Arduino-compatible) board and wire up some components:

1. Launch Arduino (1.0 or higher) and navigate to *File* -> *Examples* -> *Firmata* -> *StandardFirmata*
2. Compile *StandardFirmata* for your board and upload.
3. Wire up a button, led and potentiometer to your I/O board as illustrated on page 3 in *Breakout/examples/schematics.pdf* (or download [here](http://breakoutjs.com/examples/schematics.pdf)).

The next step is to run the Breakout Server application:

1. Make sure your I/O board is attached and the *StandardFirmata* sketch is uploaded. 
2. You'll find **Breakout Server** (Breakout Server.app for OS X, Breakout Server.exe for Windows, BreakoutServer.jar for Linux) in *Breakout/server/*. Simply double-click to launch the application. Note: Linux users may need to run ```sudo apt-get install librxtx-java``` or manually install the librxtxSerial.so driver before launching the BreakoutServer.jar application.
3. Select the serial port for your board from the drop-down if it is not the current port displayed.
4. If your firewall is enabled, make sure port 8887 is open (or enter a new port that is open).
5. Click the Connect button. You should see the message "Server running on: [your server name]: 8887/" followed by "Connected to IOBoard on: [serial port name]".
6. Open [http://localhost:8887/examples/index.html](http://localhost:8887/examples/index.html) in Chrome (v14 or greater), Firefox (v11 or greater), or Safari (v5 or greater) and try the Getting Started examples. Note that if you changed the network port in step 4, you will need to update the 2nd parameter of the IOBoard constructor to the new port number.

You can also interact with the examples on your smartphone or tablet as long as your mobile browser supports websockets (Safari, Chrome for Android, Firefox Mobile). Instead of "localhost:8887/examples/" enter the IP address or hostname of the computer running Breakout Server (192.168.2.1:8887/examples/ or yourhostname.local:8887/examples/). Also make sure your mobile device is connected to the same wi-fi network as the computer running the Breakout Server application.

For more information on using Breakout Server including enabling multiple client connections, changing the webserver root directory, or using Breakout with mobile devices, see [Using Breakout Server](http://breakoutjs.com/using-breakout-server/).

As an alternative to the Breakout Server application, a node.js-based server is also included. See the [Using the node.js server](https://github.com/soundanalogous/Breakout/wiki/Using-the-node.js-server) for details.


Requirements
---

Breakout is only supported for Arduino 1.0 and higher [Download Arduino](http://arduino.cc/en/Main/Software).

You will need one of the following I/O boards:

- An Arduino version Diecimila or newer (Uno, Fio, Mega, Pro, LilyPad, Leonardo, etc). 
- [Teensy 2.0](http://www.pjrc.com/teensy/), Teensy++ 1.0 or 2.0
- Many Arduino clones / variants should also work
- See [Test Environment](https://github.com/soundanalogous/Breakout/wiki/Test-Environment) for full list of tested I/O boards

Note: In order to use Breakout with an Arduino Leonardo board, you need to update the Firmata library in your Arduino application. [Please refer to the instructions here](https://github.com/soundanalogous/Breakout/wiki/Updating-Firmata-in-Arduino).

OS:

- Mac OS X 10.6 or higher
- Windows 7 or XP ([32-bit Java JRE 1.6 or greater required](http://www.java.com/en/download/index.jsp))
- Has been tested successfuly on Ubuntu 11.10 running in 64-bit mode on an x86-64 processor
- May work on older versions of OS X and Windows as well but has not been tested
- May work on other Linux distributions but has not been tested

Desktop Browsers:

- Chrome version 14 - 21
- Firefox version 7 - 15 (version 11 or higher is recommended)
- Safari version 5 - 6

Mobile Browsers (browser must support websockets):

- Safari mobile
- Firefox mobile version 7 or higher
- Chrome for Android (for Android 4.0 and higher)
- See [Test Environment](https://github.com/soundanalogous/Breakout/wiki/Test-Environment) for list of tested phones and tablets

Contributing
---
Contributors are welcome. If you have any ideas, suggestions for improvements, examples to share, or anything else you'd like to contribute please get in touch.

Please submit pull requests against the *dev* branch. Test against Chrome, Firefox and Safari.

Credits
---
Breakout is developed by Jeff Hoefs.

Breakout is based largely on the as3 library of [Funnel](http://funnel.cc). The author is also a contributor to the Funnel as3 library.

Logo and icon designed by Claire Lin.

Breakout Server uses [webbit](https://github.com/webbit/webbit)

Contributors:

- Fabian Affolter

License
---
Breakout is distributed under the terms of the MIT License. See the [LICENSE](https://raw.github.com/soundanalogous/Breakout/master/LICENSE) file.

Change Log
---
See the [ChangeLog](https://github.com/soundanalogous/Breakout/blob/master/ChangeLog) file.
