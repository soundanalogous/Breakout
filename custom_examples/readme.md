The examples in the custom_examples directory do not use StandardFirmata.

To use either of the RFID Examples, first download or clone the [IDxRFIDReader library for Arduino](https://github.com/soundanalogous/IDxRFIDReader) to your Arduino/libraries/ folder.

###rfid_example1.html

This example allows you to use the RFID reader along with other objects from the 
Breakout/io/ package.

1. Follow the wiring diagram in /custom_examples/schematics.pdf.
2. Upload RFID_Firmata.ino from IDxRFIDReader/Examples/RFID_Firmata/ to your 
I/O board.
3. Launch Breakout Server and open the example in your browser.

###rfid_example2.html

This example demonstrates the use of the Firmata.sysex() funciton to send data 
to Breakout. You can send any type of data using this method as long as it is 
parsed appropriately in your javascript file. See the implementation of 
ID12RFIDReader.js in Breakout/src/custom/ for an example.

1. Follow the wiring diagram in /custom_examples/schematics.pdf.
2. Upload IDx_Reader_Firmata_Example.ino from 
IDxRFIDReader/Examples/IDx_Reader_Firmata_Example/ to your I/O board. 
3. Launch Breakout Server and open the example in your browser.

###simple_json.html

This example demonstrates how you can send JSON strings from the IOBoard to the
client application.

1. Compile and load Breakout/custom_examples/sketches/SimpleFirmataJSON to your 
I/O board. Look over the code in SimpleFirmataJSON to see how Firmata.sendString() 
is used to send JSON data.
2. Once the SimpleFirmataJSON seketch has been uploaded to your I/O board, launch 
Breakout Server and open simple_json.html in a web browser.

*Note that if you run simple_json with Breakout Server set to multi-client mode
that the count will not be reset when you refresh the browser. This is
intentional so that multiple clients can use the count without resetting it. In 
single-client mode (default) the IOBoard is reset to a default state each time
the browser is refreshed, but in multi-client mode the IOBoard is never reset.*