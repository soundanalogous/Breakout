Arduino-JS
===

A javascript implementation of the Firmata protocol for Arduino. This is an early release so expect it to change over the next few weeks (however there should be little change in the interface, but probably considerable change in the implementation).

To use:

1. Install [node.js](http://www.github.com/joyent/node) if you don't have it (download the version tagged 'works') or clone via git and checkout version 0.4.9. Follow the instructions to build.
2. If you are using an Arduino UNO, upload StandardFirmata_2_2_forUNO_0_3 from File -> Examples -> Firmata (make sure you are using Arduino 0022). If you have an older Arduino or clone, upload StandardFirmata.
3. While you are in the Arduino IDE, select Tools -> Serial Port and node the serial port for your Arduino.
4. Make sure your Arduino board is attached to your computer.
5. Copy the examples from Arduino-JS/examples/ to the root of the Arduino-JS folder.
6. Open Arduino-JS/server/server.js and replace the serial port string on line 25 with the serial port of your connected Arduino board (see step 3 above).
7. Navigate to the server directory of Arduino-JS and run via the following command in your terminal: node server.js
8. Verify that the server is running, you should see "Listening for connections." in your terminal. If not make sure you have installed Node.js correctly (read the Node.js wiki) and entered the serial port for your Arduino in the server.js file.
9. Open an example file directly in Chrome and view the Developer tools (View -> Developer -> Developer Tools) and click on Console. Safari should also work but I haven't tested it extensively. You may need to refresh your browser once the tools load. You should see the firmware version and firmware name printed to the console along with other data.

Development Progress
---

Arduino-JS is still in the early phase of development. Currently Arduino-JS is mostly a port of [as3glue](http://code.google.com/p/as3glue/) to javascript.

The plan is to implement the full Firmata 2.2 protocol. So far everything from as3glue is implemented, including the new Servo spec for Firmata 2.2. Next up is i2c support. I've also added a class for the Innovations ID-12 RFID reader. This class also serves as an example of a method to add hardware abstractions to Arduino-JS. More HW classes will follow - similar to those implemented in the funnel.ui and funnel.i2c packets of [funnel]http://code.google.com/p/funnel/) as3 library.

Test environment
---

Google Chrome. Seems to work in Safari too, but I have not tested extensively. May work in Firefox if you enable WebSockets.

Arduino UNO running StandardFirmata_2_2_forUNO_0_3

The RFID example requires RFID_Firmata and the ID12RFIDReaderLibrary for Arduino [get it here](https://github.com/soundanalogous/ID-12-RFID-Reader-Library).

Updated documentation and better examples will follow in a few days...



