/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

var express = require('express'),
  app = express(),
  server = require('http').createServer(app),
  io = require('socket.io').listen(server),
  path = require('path'),
  connectedSocket = null,
  isConnected = false,
  enableMultiConnect = false;  // Set to true to enable multiple clients to connect


/**************** COMMAND LINE OPTIONS *************/
var program = require('commander');
program
  .version('0.1.7')
  .option('-p, --port <device>', 'Specify the serial port [/dev/tty.usbmodemfd121]', '/dev/tty.usbmodemfd121')
  .option('-s, --server <port>', 'Specify the port [8887]', Number, 8887)
  .option('-m, --multi <connection>', 'Enable multiple connections [false]', "false")
  .parse(process.argv);


/******************* FILE SERVER ********************/
var rootDir = program.root;
var serverPort = program.server;

if (program.multi == "true") {
  enableMultiConnect = true;
}

server.listen(parseInt(serverPort, 10));
console.log("Server is running at: http://localhost:" + serverPort + " -> CTRL + C to shutdown");

app.configure(function() {
  var dir =  path.dirname(__dirname);
  app.use(express.static(path.resolve(dir)));
});


/******************** SERIAL ************************/
var serialport = require("serialport");
var serialPort = serialport.SerialPort;
var port = program.port;

var serialDefaults = {
  baudrate: 57600,
  buffersize: 1
};

// Create new serialport pointer
var serial = new serialPort(port , serialDefaults);

serial.on( "data", function( data ) {
  if ( data[0] >= 0 ) {
    if(isConnected) {
      // Relay serial data to websocket
      connectedSocket.send(String(data[0]));
      if (enableMultiConnect) {
        connectedSocket.broadcast.send(String(data[0]));
      }        
    }
  }
});

serial.on( "error", function( msg ) {
    console.log("serial error: " + msg );
});


/************************* SOCKET.IO ***********************/
// configure socket.io
io.configure(function() {
  // Suppress socket.io debug output
  io.set('log level', 1);
  io.set('transports', ['websocket', 'flashsocket', 'xhr-polling']);
});
  
io.configure('production', function() {
	io.enable('browser client etag');
	io.set('log level', 1);
	
	io.set('transports', [
		'websocket',
		'flashsocket',
		'xhr-polling',
		'jsonp-polling'
	]);
});

io.configure('development', function() {
	io.set('transports', ['websocket', 'flashsocket', 'xhr-polling']);
});

io.sockets.on('connection', function (connection) {

  connectedSocket = connection;
  isConnected = true;

  if (enableMultiConnect) {
    connection.send("config: multiClient");
  }

  console.log("connected: " + connection.id);

  connection.on('message', function (data) {
    var message;

    message = data;

    var msgData;
    if (message.indexOf(',')) {
      msgData = message.split(',');
    } else {
      msgData = message;
    }

    // Relay websocket data to serial port
    serial.write(msgData);

  });

  connection.on('disconnect', function() {
    var numRemaining = Object.keys(connection.manager.roomClients).length - 1;
  	console.log("disconnected " + connection.id);

    if (!enableMultiConnect || numRemaining < 1) {
      connectedSocket = null;
      isConnected = false;
      console.log("all clients disconnected");
    } 
  });
});
