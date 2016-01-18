#!/usr/bin/env node

/**
 * Copyright (c) 2011-2016 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

var express = require('express'),
  app = express(),
  server = require('http').createServer(app),
  socketIO = require('socket.io')(server),
  path = require('path'),
  fileSystem = require('fs'),
  debug = require('debug')('server'),
  connectedSocket = null,
  connectedClients = 0,
  isConnected = false,
  enableMultiConnect = false; // Set to true to enable multiple clients to connect

/**************** ON EXIT CALLBACK *************/
process.on('exit', function() {
  debug('About to exit.');
});

/**************** COMMAND LINE OPTIONS *************/
var program = require('commander');
program
  .version('0.3.0')
  .option('-p, --port <device>', 'Specify the serial port [/dev/tty.usbmodemfd121]', '/dev/tty.usbmodemfd121')
  .option('-s, --server <port>', 'Specify the port [8887]', Number, 8887)
  .option('-m, --multi <connection>', 'Enable multiple connections [false]', "false")
  .option('-d, --dir <path>', 'Path to the root of your app [defaults to the current directory]', '.')
  .parse(process.argv);


/******************* FILE SERVER ********************/
var serverPort = program.server;

if (program.multi == "true") {
  enableMultiConnect = true;
}

server.listen(parseInt(serverPort, 10), function () {
  console.log("Server is running at: http://localhost:" + serverPort + " -> CTRL + C to shutdown");
});

var dir = path.resolve(program.dir);
app.use(express.static(dir));


/******************** SERIAL ************************/
var serialport = require("serialport");
var serialPort = serialport.SerialPort;
var port = program.port;

var serialDefaults = {
  baudrate: 57600,
  buffersize: 1
};

// Create new serialport pointer
var serial = new serialPort(port, serialDefaults);

serial.on("data", function(data) {
  if (isConnected) {
    connectedSocket.send(data.toJSON());

    if (enableMultiConnect) {
      connectedSocket.broadcast.send(data.toJSON());
    }
  }
});

serial.on("error", function(msg) {
  debug("serial error: " + msg);
  process.exit(1);
});


/************************* SOCKET.IO ***********************/

socketIO.sockets.on('connection', function(socket) {

  connectedSocket = socket;
  isConnected = true;
  connectedClients++;

  if (enableMultiConnect) {
    socket.send("config: multiClient");
    debug("multi client enabled");
  }

  debug("connected: " + socket.id);

  socket.on('message', function(data) {
    var msgData = {};
    msgData = data.split(',');

    // Relay websocket data to serial port
    serial.write(new Buffer(msgData), function(err, results) {
      if (err) {
        debug('serial write err ' + err);
      } else {
        debug('serial write results ' + results);
      }
    });

  });

  socket.on('disconnect', function() {

    debug("disconnected " + socket.id);
    connectedClients--;

    // TODO - figure out how to get this to work
    //var clientList = socketIO.sockets.adapter.rooms['/'];
    //var clientList = Object.keys(socketIO.sockets.adapter.rooms[room]).length = 0;
    //var numRemaining = clientList.length;

    if (!enableMultiConnect || connectedClients < 1) {
      connectedSocket = null;
      isConnected = false;
      connectedClients = 0;
      debug("all clients disconnected");
    }
  });
});
