The examples in the custom_examples directory do not use StandardFirmata.

To use either of the RFID Examples:
- Download or clone: https://github.com/soundanalogous/IDxRFIDReader to you Arduino/libraries/ folder.
- For rfid_example.html, upload RFID_Firmata.ino from IDxRFIDReader/Examples/RFID_Firmata/ to your I/O board. Follow the wiring diagram at the top of the RFID_Firmata sketch. This example allows you to use the RFID reader along with other objects from the Breakout/io/ package.
- For rfid_example_custom.html, upload IDx_Reader_Firmata_Example.ino from IDxRFIDReader/Examples/IDx_Reader_Firmata_Example/ to your I/O board. Follow the wiring diagram at the top of the RFID_Firmata sketch. This example demonstrates the use of the Firmata.sysex() funciton to send data to Breakout. You can send any type of data using this method as long as it is parsed appropriately in your javascript file. See the implementation of ID12RFIDReader.js in Breakout/src/custom/ for an example.