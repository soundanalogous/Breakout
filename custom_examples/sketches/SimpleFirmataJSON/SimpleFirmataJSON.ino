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

/* 
 * This sketch demonstrates how to send a JSON string via Firmata.sendString.
 */
#include <Firmata.h>

int counter = 0;

// called when a system reset command is received
void systemResetCallback() {
  counter = 0;
}

void sendJsonString() {
  String jsonString = "{\"count\":\"";
  jsonString += counter;
  jsonString += "\"}";
      
  char charBuf[jsonString.length() + 1];
  jsonString.toCharArray(charBuf, jsonString.length() + 1);
   
  Firmata.sendString(charBuf);

  counter++;
}

void setup() {
  Firmata.setFirmwareVersion(FIRMATA_MAJOR_VERSION, FIRMATA_MINOR_VERSION);
  Firmata.attach(SYSTEM_RESET, systemResetCallback);
    
  Firmata.begin(57600);
}

void loop() {
  
  // alway include this in custom firmata sketches
  while(Firmata.available()) {
    Firmata.processInput();
  }
  
  sendJsonString();
  
  delay(1000);
  
}



