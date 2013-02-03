/*
 * Firmata is a generic protocol for communicating with microcontrollers
 * from software on a host computer. It is intended to work with
 * any host computer software package.
 *
 * To download a host software package, please clink on the following link
 * to open the download page in your default browser.
 *
 * http://firmata.org/wiki/Download
 */

/* This sketch accepts strings and raw sysex messages and echos them back.
 *
 * This example code is in the public domain.
 */
#include <Firmata.h>

int counter = 0;

void systemResetCallback() {
  counter = 0;
}

void sendJsonString() {
   String jsonString = "{\"count\":\"";
   jsonString += counter;
   jsonString += "\"}";
      
   char charBuf[jsonString.length()+1];
   jsonString.toCharArray(charBuf, jsonString.length()+1);
   
   Firmata.sendString(charBuf);

   counter++;
}

void setup() {
    Firmata.setFirmwareVersion(FIRMATA_MAJOR_VERSION, FIRMATA_MINOR_VERSION);
    Firmata.attach(SYSTEM_RESET, systemResetCallback);
    
    Firmata.begin(57600);
}

void loop() {
  
  sendJsonString();
  
  delay(2000);
  
}



