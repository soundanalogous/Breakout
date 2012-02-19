The examples in the custom_examples directory do not use StandardFirmata.

To use either of the RFID Examples, first download or clone the [IDxRFIDReader library for Arduino](https://github.com/soundanalogous/IDxRFIDReader) to your Arduino/libraries/ folder.

###rfid_example1.html

This example allows you to use the RFID reader along with other objects from the Breakout/io/ package.

1. Follow the wiring diagram in /custom_examples/schematics.pdf.
2. Upload RFID_Firmata.ino from IDxRFIDReader/Examples/RFID_Firmata/ to your I/O board.
3. Launch Breakout Server and open the example in your browser.

###rfid_example2.html

This example demonstrates the use of the Firmata.sysex() funciton to send data to Breakout. You can send any type of data using this method as long as it is parsed appropriately in your javascript file. See the implementation of ID12RFIDReader.js in Breakout/src/custom/ for an example.

1. Follow the wiring diagram in /custom_examples/schematics.pdf.
2. Upload IDx_Reader_Firmata_Example.ino from IDxRFIDReader/Examples/IDx_Reader_Firmata_Example/ to your I/O board. 
3. Launch Breakout Server and open the example in your browser.

###string_test.html

This example demonstrates how you can send strings between the I/O board and the browser as a form of communication.

1. From the Arduino Application, upload Examples -> Firmata -> EchoString.ino to your I/O board. Look over the code in EchoString to see how Firmata.sendString() is used to send string data and how the stringCallback function is used to process incoming strings (from the computer). In this example the string data is simply echoed back.
2. Once the EchoString has been uploaded to your I/O board, launch Breakout Server and open string_test.html in a web browser.