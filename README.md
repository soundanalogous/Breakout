Breakout
===

Breakout enables rapid prototyping of browser-based applications that require physical inputs and outputs. Simply load StandardFirmata on your Arduino (or Arduino-compatible board) once and then write javascript to use physical I/O with your web apps. You can also load pages on capable tablets and phones if they are on the same wi-fi network as the computer running the Breakout server.

Breakout is supported for Arduino 1.0 and higher. [Download Arduino 1.0](http://arduino.cc/en/Main/Software).

Breakout is currently beta software. Additional io components and other features may be added, but the core API is relatively stable at this point.

To use
---

The first step is to upload StandardFirmata to your Arduino (or Arduino-compatible) board and wire up some components:

1. Launch Arduino 1.0 and navigate to File -> Examples -> Firmata -> StandardFirmata
2. Compile StandardFirmata for your board and upload.
3. Wire some hardware components to your board (see schematics included with the examples).

The next step is to run the Breakout Server application:

1. Make sure your board is attached and the StandardFirmata sketch is uploaded. 
2. You'll find the Breakout Server (Breakout Server.app for OS X, Breakout Server.exe for Windows, BreakoutServer.jar for Linux) in Breakout/server/. Simply double-click to launch the application.
3. Select the serial port for your board from the drop-down. If you wish to use a different network port than 8887 you may change also change it (and use the new port in steps 5 and 6 below).
4. Click the Connect button. You should see the message "Server running on: <your server name>: 8887/".
5. Open the example file: hello_world.html (http://localhost:8887/examples/getting_started/hello_world.html) in Chrome (v14 or greater), Firefox (v7 or greater), or Safari (v5 or greater).

As an alternative to Breakout Server application, a node.js-based server is also included. See the [wiki](https://github.com/soundanalogous/Breakout/wiki/Using-the-node.js-server) for details.  


Test environment
---

Tested OS:

- Mac OSX Snow Leopard and Lion
- Windows 7 ([Java JRE 1.6 or greater required](http://www.java.com/en/download/index.jsp))
- Ubuntu Linux 11.10 Running in 32-bit mode on x86-64 processor

Tested devices:

- iPhone 3GS, iPhone4, iPhone4S
- Android 2.3.3 and 3.1 (using Firefox 8 browser in Andriod). Native Android browser does not yet support websockets (you can use the node.js-based server and socket.io will use Flash or xhr polling).

Tested browsers:

- Google Chrome 14 - 16
- Safari 5 (desktop and mobile)
- Firefox 7 - 9 (desktop and mobile)

Tested boards (running StandardFirmata from Firmata -> Examples in Arduino 1.0):

- Arduino UNO, Arduino NG
- Teensy 2.0
- Arduino FIO (including XBee wireless link to computer)
- Arduino Mega

The following boards should also work (I just don't have them to confirm):

- Teensy 1.0
- Teensy++ 1.0 and 2.0
- Sanguino
- Illuminato
- other Arduinos (Duemilanove, Diecimila)
- Wiring
