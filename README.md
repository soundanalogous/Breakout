About
===

Breakout is a prototyping tool for exploring the intersection of the web and the physical world. The popular [Arduino](http://arduino.cc) platform and the [Firmata](http://firmata.org) protocol are leveraged to enable users to access physical input and output purely from javascript. This makes it easy for anyone familiar with javascript and basic web development to explore the possibilities of using sensors and actuators in their web applications. Furthermore, the Breakout framework includes a growing library of hardware abstractions such as buttons, leds, servo motors, accelerometers, gyros, etc enabling the user to easily interface with a range of sensors and actuators using just a few lines of javascript code.

![](http://breakoutjs.com/wp-content/uploads/2012/02/how_breakout_works.png)

Breakout grew out of a need for a simple platform to enable designers to prototype functional web-based interfaces to the physical world. It is based largely on the [Funnel](http://funnel.cc) toolkit and informed by the experiences of the developers of both Funnel and Breakout as designers, technologists and educators.

See [breakoutjs.com](http://breakoutjs.com) for detailed documentation and other helpful information.

Hello World example
---

```html
<!DOCTYPE html>
<html>
<head>
<meta charset=utf-8 />
<title>Hello World</title>
</head>
  <body>
    <button id="ledToggle">Toggle LED</button>
    <p id="btnStatus"></p>
    <script src="../../dist/Breakout.js"></script>
    <script>
    var arduino = new BO.IOBoard("localhost", 8887);
    arduino.addEventListener(BO.IOBoardEvent.READY, function (event) {
      var led = new BO.io.LED(arduino, arduino.getDigitalPin(11)),
        button = new BO.io.Button(arduino, arduino.getDigitalPin(2)),
        toggleBtn = document.getElementById("ledToggle"),
        btnStatus = document.getElementById("btnStatus");

      toggleBtn.addEventListener("click", function (event) {
        led.toggle();
      });

      button.addEventListener(BO.io.ButtonEvent.PRESS, function (event) {
        btnStatus.innerHTML = "Button " + event.target.pinNumber + " pressed";
      });
      button.addEventListener(BO.io.ButtonEvent.RELEASE, function (event) {
        btnStatus.innerHTML = "Button " + event.target.pinNumber + " released";
      });
    });
    </script>
  </body>
</html>
```

Quick Start
---

See the detailed [Getting Started guide](http://breakoutjs.com/getting-started/) or the quickstart guide below.

#### Wire up your board for the hello world example

Wire up a button and led to your I/O board as illustrated on page 2 in [Breakout/examples/schematics.pdf](http://breakoutjs.com/examples/schematics.pdf).

#### Install required Arduino libraries

1. Install [ConfigurableFirmata](https://github.com/firmata/ConfigurableFirmata) to your Arduino sketchbook library. The easiest way to get it if you are using Arduino 1.6.4 or higher is using the Arduino Library Manager. In the Arduino IDE, go to `Sketch > Include Library > Manage Libraries` then search for "ConfigurableFirmata" and click Install after tapping on the ConfigurableFirmata item in the filtered results. Otherwise, following the instructions in the ConfigurableFirmata readme.
2. Download or clone [Breakout.js](https://github.com/soundanalogous/Breakout) and navigate to `Breakout/firmata/BreakoutFirmata` and open `BreakoutFirmata.ino` in the Arduino IDE. Compile and upload the sketch to your board.

#### Run the Breakout Server application:

1. Make sure your I/O board is attached and the *BreakoutFirmata* sketch is uploaded.
2. You'll find **Breakout Server** for your platform (mac, win or linux) in `Breakout/server/`. Unzip and open the folder for your platform and launch the application. **Mac OS X users** may need to [temporarily disable Gatekeeper](https://answers.uchicago.edu/page.php?id=25481) to launch the app for the first time. Note: Linux users may need to run ```sudo apt-get install librxtx-java``` or manually install the librxtxSerial.so driver before launching the BreakoutServer.jar application.
3. Select the serial port for your board from the drop-down if it is not the current port displayed.
4. If your firewall is enabled, make sure port 8887 is open (or enter a new port that is open).
5. Click the Connect button. You should see the message "Server running on: [your server name]: 8887/" followed by "Connected to IOBoard on: [serial port name]".
6. Open [http://localhost:8887/examples/hello_world.html](http://localhost:8887/examples/hello_world.html) in your favorite browser. You should be able to control the LED and view the button state changes.
7. Open [http://localhost:8887/examples/index.html](http://localhost:8887/examples/index.html) and try some of the other examples (unplug your board before wiring up other examples).

**Schematics for the examples can be found here:** http://breakoutjs.com/examples/schematics.pdf

**Note OS X users:** If you are running Mavericks or later, you will need to disable the App Nap feature for Breakout Server. Right-click on the Breakout Server icon then select Get Info. Check the `Prevent App Nap` box under the General section in the info panel. If you don't disable it, the connection will be dropped a few seconds after the window goes out of focus.

You can also interact with the examples on your smartphone or tablet as long as your mobile browser supports websockets. Instead of `localhost:8887/examples/` enter the IP address or hostname of the computer running Breakout Server (`192.168.2.1:8887/examples/` or `yourhostname.local:8887/examples/`). Also make sure your mobile device is connected to the same wi-fi network as the computer running the Breakout Server application.

For more information on using Breakout Server including enabling multiple client connections, changing the webserver root directory, enabling auto start mode, or using Breakout with mobile devices, see [Using Breakout Server](http://breakoutjs.com/using-breakout-server/).

As an alternative to the Breakout Server application, a node.js-based server is also available. See [breakout-server](https://github.com/soundanalogous/breakout-server) for details.


Requirements
---

Breakout is supported for Arduino 1.0 and higher [Download Arduino](http://arduino.cc/en/Main/Software).

You will need one of the following I/O boards:

- An Arduino version Diecimila or newer (Uno, Zero, 101, Fio, Mega, Pro, LilyPad, Leonardo, Due, etc).
- [Any of the Teensy boards](http://www.pjrc.com/teensy/): Teensy 3.0/3.1/3.2, Teensy LC, Teensy++ 1.0 or 2.0
- Many Arduino clones variants may also work.
- See [Test Environment](https://github.com/soundanalogous/Breakout/wiki/Test-Environment) for full list of tested I/O boards.

OS:

- Mac OS X 10.6 or higher
- Windows 10, 8, 7 or XP ([Java JRE 1.6 or greater required to run Breakout Server](http://www.java.com/en/download/index.jsp))
- Has been tested successfully on Ubuntu versions 12.04 and 14.04 running in 64-bit mode on an x86-64 processor
- May work on older versions of OS X and Windows as well but has not been tested
- May work on other Linux distributions but has not been tested

Desktop Browsers:

- Chrome version 14 or higher
- Firefox version 11 or higher
- Safari version 5 or higher
- Opera 12 or higher
- Microsoft Edge

Mobile Browsers (browser must support websockets):

- Safari mobile
- Firefox mobile version 7 or higher
- Chrome for Android (for Android 4.0 and higher)
- See [Test Environment](https://github.com/soundanalogous/Breakout/wiki/Test-Environment) for list of tested phones and tablets

Contributing
---
Contributions are welcome. If you have any ideas, suggestions for improvements,
examples to share, or anything else you'd like to contribute please get in touch.

To contribute, fork Breakout and create a feature branch branch.
Submit pull requests for bug fixes and small changes. For any
larger changes, please first start a discussion by opening a new issue.

See [Breakout/build/README.md](https://github.com/soundanalogous/Breakout/blob/master/build/README.md) for instructions on building Breakout.


Credits
---
Breakout is developed by [Jeff Hoefs](http://jeffhoefs.com).

Breakout is based on the as3 library of [Funnel](http://funnel.cc).
The author is also a contributor to the Funnel as3 library.

Logo and icon designed by Claire Lin.

Breakout Server uses [webbit](https://github.com/webbit/webbit)

Contributors:

- [Fabian Affolter](https://github.com/fabaff)
- [Xavier Seignard](https://github.com/xseignard)

License
---
Breakout is distributed under the terms of the MIT License. See the [LICENSE](https://raw.github.com/soundanalogous/Breakout/master/LICENSE) file.

Change Log
---
See the [ChangeLog](https://github.com/soundanalogous/Breakout/blob/master/ChangeLog) file.
