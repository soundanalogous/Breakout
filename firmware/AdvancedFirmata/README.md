AdvancedFirmata
===============

AdvancedFirmata builds on [StandardFirmata](https://github.com/firmata/arduino/tree/master/examples/StandardFirmata) to add additional functionality such 
as Stepper motor support. The idea behind AdvancedFirmata is to add features 
that are not yet available in the StandardFirmata (that is included in 
Firmata/examples/ in the Arduino IDE) and hopefully add them to the official
Firmata library at a later time. 

Like StandardFirmata (which is just an Arduino Sketch), AdvancedFirmata relies 
on the Firmata library included with the Arduino IDE. Therefore Firmata.cpp, 
Firmata.h or Boards.h should not be changed in order to add a feature to 
AdvancedFirmata.

In time, some of the featues in AdvancedFirmata may be added to StandardFirmata
and the official Firmata library.


To Use
---

Clone or download and copy AdvancedFirmata into your Arduino projects/sketch 
directory (or anywhere on your hard drive). Open in the Arduino IDE, verify and 
upload to your board.

If you download rather than clone this repository, rename the folder to 
"AdvancedFirmata" after unzipping and before copying into your Arduino projects
directory.


Features (not included in StandardFirmata)
---

- Stepper motor support. AdvancedFirmata can be used to drive bipolar and 
unipolar stepper motors.


Requested Features
---

- Shift in/out support
- Pulse in/out support
- Ethernet support (since Firmata implements the Stream interface)


Restrictions
---

Due ot the large file size, AdvancedFirmata will only run on newer Arduino 
boards that have > 16KB of flash memory. This is most Arduino and 
arduino-compatible boards released over the past few years.


Contributing
---

Please create a branch with the name of the feature you are adding (shiftout, 
rotaryencoder, etc) before submitting a pull request.