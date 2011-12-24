Breakout
===

Breakout enables rapid prototyping of browser-based applications that require physical inputs and outputs. Simply load StandardFirmata on your Arduino (or Arduino-compatible board, see list below) once and then use javascript (and html, css, etc) to use physical I/O with your web apps. You can also load pages on capable tablets and phones (browser must support websockets) if they are on the same wi-fi network as the computer running the Breakout server.

Breakout is currently only supported for Arduino 1.0 and higher. [Download Arduino 1.0](http://arduino.cc/en/Main/Software).

Breakout is currently alpha so the API is not 100% stable so expect changes if you pull future releases. The API should be locked down by mid January.

To use
---

The first step is to upload StandardFirmata to your Arduino board:

1. Launch Arduino 1.0 and navigate to File -> Examples -> Firmata -> StandardFirmata
2. Compile StandardFirmata for your board and upload.

There are 2 choices of servers to use with Breakout. The simplest is Breakout Server which is a java application with a simple GUI. The alternative server requires [node.js](http://nodejs.org/). See instructions in the [wiki](https://github.com/soundanalogous/Breakout/wiki/Using-the-node.js-server) to use the node.js server.

Instructions for using Breakout Server:

1. Wire some hardware components to your Arduino (see schematics included with the examples).
2. Make sure your Arduino is attached and the StandardFirmata sketch is uploaded. 
3. You'll find the Breakout Server (Breakout Server.app for OS X or Breakout Server.exe for Windows) in the Breakout/server/. Simply double-click to launch the application.
4. Select the serial port for your Arduino from the drop-down. If you wish to use a different network port than 8887 you may change also change it (and use the new port in steps 5 and 6 below).
5. Click the Connect button. You should see the message "Server started on port: 8887".
6. Open the example file: hello_world.html (http://localhost:8887/examples/hello_world.html) in Chrome (v14 or greater), Firefox (v7 or greater), or Safari (v5 or greater).


Test environment (for Breakout Server)
---

Tested OS:

- Mac OSX Snow Leopard and Lion
- Windows 7 ([Java JRE 1.6 or greater required](http://www.java.com/en/download/index.jsp))
- Linux not yet supported (if you want to help, please let me know)

Tested devices:

- iPhone 3GS, iPhone4, iPhone4S
- Android 2.3.3 and 3.1 (using Firefox 8 browser in Andriod). Native Android browser does not yet support websockets (you can use the node.js-based server.js and socket.io will use Flash or xhr polling).

Tested browsers:

- Google Chrome 14 & 15
- Safari 5 (desktop and mobile)
- Firefox 7 & 8 (desktop and mobile)

node js version 0.6.4

Tested boards (running StandardFirmata from Firmata -> Examples in Arduino 1.0):

- Arduino UNO
- Teensy 2.0
- Arduino FIO
- Arduino Mega

The following boards should also work (I just don't have them to confirm):
- Teensy 1.0
- Teensy++ 1.0 and 2.0
- Sanguino
- Illuminato
- older Arduinos (Duemilanove, Diecimila, NG)
- Wiring

The RFID example requires RFID_Firmata and the IDxRFIDReader library for Arduino [get it here](https://github.com/soundanalogous/IDxRFIDReader). RFID_Firmata is included in the Examples directory of the IDxRFIDReader library.



