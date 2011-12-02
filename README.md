Arduino-JS
===

A javascript framework for Arduino. Arduino-JS is only supported for Arduino 1.0 and higher. [Download Arduino 1.0](http://arduino.cc/en/Main/Software).

Arduino-JS is currently alpha software so exptect it to change.

To use
---

Install node.js and the required modules:

1. Install [node.js](http://www.github.com/joyent/node) if you don't have it (download the version tagged 'works') or clone via git and checkout version 0.4.12. Follow the instructions to build.
2. Install [npm](http://npmjs.org/) if you have not already
3. The server code depends on 3 node modules: [node-serialport](https://github.com/voodootikigod/node-serialport), [WebSocket-Node](https://github.com/Worlize/WebSocket-Node) and [node-websocket-server](https://github.com/miksago/node-websocket-server). Navigate to Arduino-JS/server/ then install each module (see the readme for each module for instructions)

Upload StandardFirmata to the Arduino board:

1. Launch Arduino 1.0 and navigate to File -> Examples -> Firmata -> StandardFirmata
2. While you are in the Arduino IDE, select Tools -> Serial Port and note the serial port for your Arduino.
3. Make sure your Arduino board is attached to your computer.

Run an example file:

1. Open Arduino-JS/server/server.js and replace the serial port string on line 31 with the serial port of your connected Arduino board (see step 3 above).
2. Navigate to the server directory of Arduino-JS and run via the following command in your terminal: node server.js
3. Verify that the server is running, you should see "...Server is listening on port 8080" in your terminal. If not make sure you have installed Node.js correctly (read the Node.js wiki) and entered the serial port for your Arduino in the server.js file.
4. Open an example html file directly in Chrome or Safari and view the console (in Chrome: View -> Developer -> Developer Tools). You can also load the application by typing the url in the browser 'http://localhost:8080/examples/filename.html"

Test environment
---

Mac OSX Snow Leopard and Lion (have not tested in Linux or Windows)

Supported browsers:

- Google Chrome 14
- Safari 5
- Firefox 7

node js version 0.4.12

Tested boards (running StandardFirmata from Firmata -> Examples in Arduino 1.0):

- Arduino UNO
- Teensy 2.0
- Arduino FIO
- Arduino Mega

The RFID example requires RFID_Firmata and the IDxRFIDReader library for Arduino [get it here](https://github.com/soundanalogous/IDxRFIDReader). RFID_Firmata is included in the Examples directory of the IDxRFIDReader library.



