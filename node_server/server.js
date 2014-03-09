#!/usr/bin/env node
/**
 * Copyright (c) 2011-2014 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    path = require('path'),
    fileSystem = require('fs'),
    connectedSocket = null,
    isConnected = false,
    enableMultiConnect = false;  // Set to true to enable multiple clients to connect

/**************** ON EXIT CALLBACK *************/
process.on('exit', function () {
    console.log('About to exit.');
});

/**************** COMMAND LINE OPTIONS *************/
var program = require('commander');
program
    .version('0.2.3')
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

server.listen(parseInt(serverPort, 10));
console.log("Server is running at: http://localhost:" + serverPort + " -> CTRL + C to shutdown");

app.configure(function () {
    var dir = path.resolve(program.dir);
    fileSystem.realpath(dir, function (err, resolvedPath) {
        if (err) {
            console.log(dir + " does not exist");
            process.exit(1);
        }
        else {
            app.use(express.static(dir));
        }
    });
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
var serial = new serialPort(port, serialDefaults);

serial.on("data", function (data) {
    if (isConnected) {
        connectedSocket.send(data.toJSON());

        if (enableMultiConnect) {
            connectedSocket.broadcast.send(data.toJSON());
        }        
    }
});

serial.on("error", function (msg) {
    console.log("serial error: " + msg);
    process.exit(1);
});


/************************* SOCKET.IO ***********************/
// configure socket.io
io.configure(function () {
    // Suppress socket.io debug output
    io.set('log level', 1);
    io.set('transports', ['websocket', 'flashsocket', 'xhr-polling']);
});
  
io.configure('production', function () {
    io.enable('browser client etag');
    io.set('log level', 1);
    
    io.set('transports', [
        'websocket',
        'flashsocket',
        'xhr-polling',
        'jsonp-polling'
    ]);
});

io.configure('development', function () {
    io.set('transports', ['websocket', 'flashsocket', 'xhr-polling']);
});

io.sockets.on('connection', function (connection) {

    connectedSocket = connection;
    isConnected = true;

    if (enableMultiConnect) {
        // TO DO: once Breakout Server has been updated to send JSON strings
        // update the following line to send a JSON string.
        connection.send("config: multiClient");
        console.log("multi client enabled");
    }

    console.log("connected: " + connection.id);

    connection.on('message', function (data) {
        var msgData = {};
        msgData = data.split(',');

        // Relay websocket data to serial port
        serial.write(msgData);

    });

    connection.on('disconnect', function () {
        var numRemaining = Object.keys(connection.manager.roomClients).length - 1;
        console.log("disconnected " + connection.id);

        if (!enableMultiConnect || numRemaining < 1) {
            connectedSocket = null;
            isConnected = false;
            console.log("all clients disconnected");
        } 
    });
});
