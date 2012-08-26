/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */

var app = require('http').createServer(handler),
  io = require('socket.io').listen(app),
  fs = require('fs'),
  path = require('path'),
  connectedSocket = null,
  isConnected = false,
  enableMultiConnect = false;  // Set to true to enable multiple clients to connect

// Are any additional mime types needed?
var mimeTypes = {
  "html": "text/html",
  "ico": "image/x-icon",
  "jpeg": "image/jpeg",
  "jpg": "image/jpeg",
  "png": "image/png",
  "js": "application/javascript",
  "manifest" : "text/cache-manifest",
  "css": "text/css"};

/* Commandline options */
var program = require('commander');
program
  .version('0.1.6')
  .option('-p, --port <device>', 'Specify the serial port [/dev/tty.usbmodemfd121]', '/dev/tty.usbmodemfd121')
  .option('-s, --server <port>', 'Specify the port [8080]', Number, 8080)
  .parse(process.argv);

/* Serial */
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

var serverPort = program.server;
app.listen(parseInt(serverPort, 10));
console.log("Server is running at: http://localhost:" + serverPort + " -> CTRL + C to shutdown");

function handler (request, response) {
  if(request.method == "GET"){
    var filename;
    
    // Absolute path
    //if (request.url == "/") {
    //  filename = path.normalize(path.join(__dirname,  "../index.html"));
    //} else {
    //  filename = path.normalize(path.join(__dirname,  ".." + request.url));
    //}
    
    // Use relative path (seems to be working... on OSX at least)
    if (request.url == "/") {
      // default to index.html
      filename = path.normalize("../index.html");
    } else {
      filename = path.normalize(".." + request.url);
    }
    //console.log("debug: filename = " + filename);

    var extension = request.url.substring(request.url.lastIndexOf(".")+1);
    //console.log("debug: ext = " + extension);
    
    path.exists(filename, function(exists) {
      var type = mimeTypes[extension];
      if (exists) {
          response.writeHead(200, {'Content-Type': type, 'Connection': 'close'});
          fs.createReadStream( filename, {
            'flags': 'r',
            'encoding': 'binary',
            'mode': 0666,
            'bufferSize': 4 * 1024
          }).addListener("data", function(chunk){
            response.write(chunk, 'binary');
          }).addListener("end",function() {
            response.end();
          }); 
      } else {
          response.writeHead(200, {'Content-Type': type, 'Connection': 'close'});
          response.end("");     
      }
    });
    
  } else {
    response.writeHead(404);
    response.end();
  }
}

io.sockets.on('connection', function (connection) {

  connectedSocket = connection;
  isConnected = true;

  //console.log("num clients = " + Object.keys(connection.manager.roomClients).length);

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
    //console.log("num remaining = " + numRemaining);

    if (!enableMultiConnect || numRemaining < 1) {
      connectedSocket = null;
      isConnected = false;
      console.log("all clients disconnected");
    } 
  });
});
