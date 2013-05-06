Breakout Server
===

Breakout Server is a simple GUI application to create link between a serial
stream and a websocket stream. See the [Using Breakout Server](http://breakoutjs.com/guides/using-breakout-server/) guide for a detailed overview.

Source
---

The source is located in the [BreakoutServer repository](https://github.com/soundanalogous/BreakoutServer).

Quick Start
---

1. Make sure your Arduino (or compatible) is attached and the *AdvancedFirmata* sketch is uploaded (you'll find AdvancedFirmata in Breakout/firmware/). 
2. Unzip and open the server folder for your platform and launch the application. Mountain Lion users may need to [temporarily disable Gatekeeper](https://answers.uchicago.edu/page.php?id=25481) to launch the app for the first time. Note: Linux users may need to run ```sudo apt-get install librxtx-java``` or manually install the librxtxSerial.so driver before launching the BreakoutServer.jar application.
3. Select the serial port for your board from the drop-down if it is not the current port displayed.
4. If your firewall is enabled, make sure port 8887 is open (or enter a new port that is open).
5. Click the Connect button. You should see the message "Server running on: [your server name]: 8887/" followed by "Connected to IOBoard on: [serial port name]".
6. Open [http://localhost:8887/examples/index.html](http://localhost:8887/examples/index.html) in Chrome (v14 or greater), Firefox (v11 or greater), or Safari (v5 or greater) and try the Getting Started examples. Note that if you changed the network port in step 4, you will need to update the 2nd parameter of the IOBoard constructor to the new port number.

*If the examples page does not open, click Disconnect then click on the Settings 
tab and click on "Choose New Webserver Root" and navigate to and select the 
Breakout folder.* and try to connect again.
