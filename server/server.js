/* serial to websocket bridge
 * fallback code from: https://gist.github.com/1219165
 *
 * Supports WebSocket drafts 75, 76 and 10 
 * Tested successfully with Chrome 14 and Safari 5.1
 * Should also work with Firefox 7 (but not yet tested)
 */

var http = require('http'),
		WebSocketRequest = require('websocket').request,
		fs = require('fs'),
		path = require('path'),
		ws = require('websocket-server');

var connectedSocket = null;

/* SERIAL */

var serialport = require("serialport");
var serialPort = serialport.SerialPort;
// to do: pass port as arg or read from text file?
var port = "/dev/tty.usbmodem12341";	// Teensy 2.0
// "/dev/tty.usbmodemfd121" Arduino UNO

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
  	var type,
  		filename;
  	
  	// absolute path
  	/*
  	if (request.url == "/") {
  		filename = path.normalize(path.join(__dirname,  "../index.html"));
  	} else {
  		filename = path.normalize(path.join(__dirname,  ".." + request.url));
  	}
  	*/
  	
  	// use relative path (seems to be working... on OSX at least)
  	if (request.url == "/") {
  		filename = path.normalize("../index.html");
  	} else {
  		filename = path.normalize(".." + request.url);
  	}

  	//console.log("debug: filename = " + filename);
  	
  	var extension = request.url.substring(request.url.lastIndexOf(".")+1);
  	//console.log("debug: ext = " + extension);
    if( extension == "ico" ){
      response.writeHead(200, {'Content-Type': 'image/x-icon', 'Connection': 'close'});
      response.end("");
    } else {
      if (extension == "js") {
      	type = "application/javascript; charset=UTF-8";
      }
      else {
      	type = "text/html; charset=UTF-8";
      }
      //console.log("debug: type = " + type);
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
    }
  } else {
    response.writeHead(404);
    response.end();
  }
});

httpServer.listen(8080, function() {
	console.log((new Date()) + " Server is listening on port 8080");
});

/* node-websocket-server fallback to drafts 75 and 76 */

var miksagoConnection = require('./node_modules/websocket-server/lib/ws/connection');

var miksagoServer = ws.createServer();
miksagoServer.server = httpServer;

miksagoServer.addListener('connection', function(connection) {
	// Add remoteAddress property
	connection.remoteAddress = connection._socket.remoteAddress;

	// use 'sendUTF' regardless of the server implementation
	connection.sendUTF = connection.send;
	handleConnection(connection);
});

/* WebSocket-Node config */
var wsServerConfig = {
	// all options *except* 'httpServer' are required when bypassing
	// WebSocketServer
	maxReceivedFrameSize: 0x10000,
	maxReceivedMessageSize: 0x100000,
	fragmentOutgoingMessages: true,
	fragmentationThreshold: 0x4000,
	keepalive: true,
	keepaliveInterval: 20000,
	assembleFragments: true,
	// autoAcceptConnections is not applicable when bypassing WebSocketServer
	// autoAcceptConnections: false,
	disableNagleAlgorithm: true,
	closeTimeout: 5000
};

// Handle the upgrade event ourselves instead of using WebSocketServer

httpServer.on('upgrade', function(req, socket, head) {

    if (typeof req.headers['sec-websocket-version'] !== 'undefined') {

        // WebSocket hybi-08/-09/-10 connection (WebSocket-Node)
        var wsRequest = new WebSocketRequest(socket, req, wsServerConfig);
        try {
            wsRequest.readHandshake();
            var wsConnection = wsRequest.accept(wsRequest.requestedProtocols[0], wsRequest.origin);
            handleConnection(wsConnection);
        }
        catch(e) {
            console.log("WebSocket Request unsupported by WebSocket-Node: " + e.toString());
            return;
        }

    } else {

        // WebSocket hixie-75/-76/hybi-00 connection (node-websocket-server)
        if (req.method === 'GET' &&
            (req.headers.upgrade && req.headers.connection) &&
            req.headers.upgrade.toLowerCase() === 'websocket' &&
            req.headers.connection.toLowerCase() === 'upgrade') {
            new miksagoConnection(miksagoServer.manager, miksagoServer.options, req, socket, head);
        }

    }

});

/* A common connection handler */

function handleConnection(connection) {
	connectedSocket = connection;

    console.log((new Date()) + " Connection accepted.");
    
    connection.addListener('message', function(wsMessage) {
        var message = wsMessage;

        // WebSocket-Node adds a "type", node-websocket-server does not
        if (typeof wsMessage.type !== 'undefined') {
            if (wsMessage.type !== 'utf8') {
                return;
            }
            message = wsMessage.utf8Data;
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
    
    connection.addListener('close', function() {
        console.log((new Date()) + " Peer " + connection.remoteAddress + " disconnected.");
        connectedSocket = null;
    });
}
