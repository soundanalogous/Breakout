#Using the Node server

A [node.js](http://nodejs.org/)-based server is provided as an alternative to the Breakout Server GUI application.

## To Install

Navigate to *Breakout/node_server/* and type: `npm install` to install the dependencies.

Windows users, refer to the [readme](https://github.com/voodootikigod/node-serialport/blob/master/README.md) for node-serialport before installing. I have not had any luck getting node-serialport to work in Windows 7 (but that does not mean all hope is lost).

You can alternatively install the breakout-server npm package: `npm install breakout-server` from outside of the Breakout directory (for example to create a new Breakout project). This will install server.js and its dependencies.

## To Run

1. Wire some hardware components to your Arduino, see [schematics](http://breakoutjs.com/examples/schematics.pdf)
2. Navigate to *Breakout/firmata/AdvancedFirmata* and open **AdvancedFirmata.ino** in the Arduino IDE (1.0 or higher). Compile and upload the sketch to your board.
3. Navigate to *Breakout/node_server/* and run `node server.js --help` to view the command line options.
4. The default serial port is */dev/tty.usbmodemfd121*. If your Arduino board is connected to a different port (get this by typing: `ls /dev/tty.*` in the terminal in OS X, `ls /dev/ttyACM*` in the terminal in Linux, or get it from the Arduino IDE under Tools -> Serial Port) you can add the command line argument: `-p /dev/tty.usbmodemfd131` (or whatever your unique serial port is). To permanently change the default port, modify line 26 in the server.js file.
5. Run `node server.js` (plus any optional command line arguments) to start the server. If you are trying to run an example from the Breakout root directory then use `node node_server/server.js` or if you are in the *node_server directory*, run `node server.js -d ../` to set the path to the Breakout root directory.
6. Verify that the server is running. You should see `"info - socket.io started  Server is runnint at: http://localhost:8887 -> CTRL + C to shutdown"` in your terminal.
7. Load an example in your browser: [http://localhost:8887/examples/getting_started/hello_world.html](http://localhost:8887/examples/getting_started/hello_world.html)

When creating your index.html file, include `<script src="../../socket.io/socket.io.js"></script>` before the Breakout.min.js script (the path should be relative to the root web directory, which is either the location of server.js or an alternate location that you specify with the -d command line option when running server.js). The socket.io.js file is included automatically by the server so you do not need to include it separately in your project. Make sure the network port in the IOBoard constructor is 8887 or any other value you set in the server.js file.

If you're looking for a pure node.js implementation for Arduino, please see [johnny-five](https://github.com/rwldrn/johnny-five) and [firmata](https://github.com/jgautier/firmata).
