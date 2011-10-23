/* serial to websocket bridge
 *
 * Supports WebSocket draft 10 
 * Tested successfully with Chrome 14 and Firefox 7
 */

var http = require('http'),
	WebSocketServer = require('websocket').server,
	fs = require('fs'),
	path = require('path');

var connectedSocket = null;

var mimeTypes = {
	"html": "text/html",
	"ico": "image/x-icon",
	"jpeg": "image/jpeg",
	"jpg": "image/jpeg",
	"png": "image/png",
	"js": "application/javascript",
	"manifest" : "text/cache-manifest",
	"css": "text/css"};

/* SERIAL */

var serialport = require("serialport");
var serialPort = serialport.SerialPort;
// to do: pass port as arg or read from text file?
var port = "/dev/tty.usbmodemfd121";

var serialDefaults = {
	baudrate: 57600,
	buffersize: 1
};

// Create new serialport pointer
var serial = new serialPort(port , serialDefaults);


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

// to do: need to support additional mime types?
var httpServer = http.createServer(function(request, response) {

  if(request.method == "GET"){
  	//console.log("debug: url = " + request.url);
  	var	filename;
  	
  	// absolute path
  	//if (request.url == "/") {
  	//	filename = path.normalize(path.join(__dirname,  "../index.html"));
  	//} else {
  	//	filename = path.normalize(path.join(__dirname,  ".." + request.url));
  	//}
  	
  	// use relative path (seems to be working... on OSX at least)
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
});

httpServer.listen(8080, function() {
	console.log((new Date()) + " Server is listening on port 8080");
});

/* WEBSOCKET SERVER */

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
		connectedSocket = null;
	});
});