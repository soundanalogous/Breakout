Arduino-JS
===

A javascript implementation of the Firmata protocol for Arduino. This is a work in progress so expect it to change over the next few weeks.

To use
---

Install node.js and the required modules:

1. Install [node.js](http://www.github.com/joyent/node) if you don't have it (download the version tagged 'works') or clone via git and checkout version 0.4.11. Follow the instructions to build.
2. Install [npm](http://npmjs.org/) if you have not already
3. The server code depends on 2 node modules: [node-serialport](https://github.com/voodootikigod/node-serialport) and [node-websocket-server](https://github.com/miksago/node-websocket-server). Navigate to Arduino-JS/server/ then install each module (see the readme for each module for instructions)

Upload StandardFirmata to the Arduino board:

1. If you are using an Arduino UNO, upload StandardFirmata_2_2_forUNO_0_3 from File -> Examples -> Firmata (make sure you are using Arduino 0022). If you have an older Arduino or clone, upload StandardFirmata.
2. While you are in the Arduino IDE, select Tools -> Serial Port and note the serial port for your Arduino.
3. Make sure your Arduino board is attached to your computer.

Run the example file:

1. Copy the examples from Arduino-JS/examples/ to the root of the Arduino-JS folder.
2. Open Arduino-JS/server/server.js and replace the serial port string on line 25 with the serial port of your connected Arduino board (see step 3 above).
3. Navigate to the server directory of Arduino-JS and run via the following command in your terminal: node server.js
4. Verify that the server is running, you should see "Listening for connections." in your terminal. If not make sure you have installed Node.js correctly (read the Node.js wiki) and entered the serial port for your Arduino in the server.js file.
5. Open an example html file directly in Chrome and view the Developer tools (View -> Developer -> Developer Tools) and click on Console. Safari should also work but I haven't tested it extensively. You may need to refresh your browser once the tools load. You should see the firmware version and firmware name printed to the console along with other data.

Test environment
---

Google Chrome. Seems to work in Safari too, but I have not tested extensively. Does not currently work in Firefox 6. I need to change the server to use a more current WebSocket implementation.

node js version 0.4.11

Arduino UNO running StandardFirmata_2_2_forUNO_0_3

The RFID example requires RFID_Firmata and the ID12RFIDReaderLibrary for Arduino [get it here](https://github.com/soundanalogous/ID-12-RFID-Reader-Library).

Updated documentation and better examples will follow in a few days...



