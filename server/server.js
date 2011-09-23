var http = require('http'),
		WebSocketServer = require('websocket').server;

/* uncomment to serve page */
var	fs = require('fs'),
		path = require('path'),
		mime = require('mime'),
		repl = require('repl');

var connectedSocket = null;

/* SERIAL */

var serialport = require("serialport");
var serialPort = serialport.SerialPort;

var defaults = {
	baudrate: 57600,
	buffersize: 1
};

// Create new serialport pointer
//var serial = new serialPort("/dev/tty.usbmodemfa131" , defaults);
var serial = new serialPort("/dev/tty.usbmodemfd121" , defaults);
//var serial = new serialPort("/dev/tty.usbserial-A8008iu0" , defaults);
//var serial = new serialPort("/dev/tty.usbserial-A6007WTr" , defaults);
//var serial = new serialPort("/dev/tty.usbmodem12341" , defaults);	// Teensy


serial.on( "data", function( data ) {
		
	if ( data[0] >= 0 ) {
		if(connectedSocket != null) {
			connectedSocket.sendUTF(String(data[0]));
		}
	}

});


serial.on( "error", function( msg ) {
		console.log("serial error: " + msg );
});

/* example to serve page */
var httpServer = http.createServer(function(request, response) {

  if(request.method == "GET"){
  	console.log("url = " + request.url);
  	var file;
  	var filepath = path.normalize(path.join(__dirname, "../"));
  	var filename = path.normalize(path.join(__dirname, "../index.html"));
  	var jsfilename = filepath + request.url;
  	var type;
	//console.log("filename = " + filename);
	//console.log("jsfilename = " + jsfilename);
  	var extension = request.url.substring(request.url.lastIndexOf(".")+1);
  	console.log("ext = " + extension);
    if( extension == "ico" ){
      response.writeHead(200, {'Content-Type': 'image/x-icon', 'Connection': 'close'});
      response.end("");
    } else {
      if (extension == "js") {
      	type = "application/javascript; charset=UTF-8";
      	file = jsfilename;
      }
      else {
      	type = "text/html; charset=UTF-8";
      	file = filename;
      }
      console.log("type = " + type);
      response.writeHead(200, {'Content-Type': type, 'Connection': 'close'});
      fs.createReadStream( file, {
        'flags': 'r',
        'encoding': 'binary',
        'mode': 0666,
        'bufferSize': 4 * 1024
      }).addListener("data", function(chunk){
        response.write(chunk, 'binary');
      }).addListener("end",function() {
        response.end();
      });
    }
  } else {
    response.writeHead(404);
    response.end();
  }
});

httpServer.listen(8080, function() {
	console.log((new Date()) + " Server is listening on port 8080");
});

/* WEBSOCKET SERVER */

// use this method if opening the page directly in Chrome
var server = new WebSocketServer({
	httpServer: httpServer,
	autoAcceptConnections: true
});

server.on('connect', function(connection) {

	connectedSocket = connection;
	console.log((new Date()) + " Connection accepted.");
	
	connection.on('message', function(data) {
	  var message;
	  
      if (data.type === 'utf8') {
      	message = data.utf8Data;
      } else if (data.type === 'binary') {
		// will this ever be the case?
      }
      
      var msgData;
      if (message.indexOf(',')) {
      	msgData = message.split(',');
      } else {
      	msgData = message;
      }
      
      // write the message to the serial port
      serial.write(msgData);
      
	});
	
	connection.on('close', function(connection) {
		console.log((new Date()) + " Peer " + connection.remoteAddress + " disconnected.");
	});
});