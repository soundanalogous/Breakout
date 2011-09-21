//var httpServer = require('http'),
var	app = require('http').createServer(handler),
  	io = require('socket.io').listen(app),
  	fs = require('fs'),
  	path = require('path');
  	

/* uncomment to serve page */
/*
var	fs = require('fs'),
		path = require('path'),
		mime = require('mime'),
		repl = require('repl');
		*/
		
io.configure('production', function() {
	io.enable('browser client etag');
	io.set('log level', 1);
	
	io.set('transports', [
		'websocket'
		, 'flashsocket'
		, 'htmlfile'
		, 'xhr-polling'
		, 'jsonp-polling'
	]);
});

io.configure('development', function() {
	io.set('transports', ['websocket']);
});

app.listen(8080);


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
//var serial = new serialPort("/dev/tty.usbmodemfd121" , defaults);
//var serial = new serialPort("/dev/tty.usbserial-A8008iu0" , defaults);
//var serial = new serialPort("/dev/tty.usbserial-A6007WTr" , defaults);
var serial = new serialPort("/dev/tty.usbmodem12341" , defaults);	// Teensy


serial.on( "data", function( data ) {

	if ( data[0] >= 0 ) {

		if(connectedSocket != null) {
			console.log(data[0]);
			console.log("sending");
			
			/* either of the following methods can be used to send data to the client */
			//connectedSocket.write(String(data[0]));
			//connectedSocket.sendUTF(String(data[0]));
			//connectedSocket.sendBytes(String(data[0]).binaryData);
			//server.broadcast(String(data));
		}
	}

});


serial.on( "error", function( msg ) {
		console.log("serial error: " + msg );
});

/* example to serve page */
/*
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
*/

/* WEBSOCKET SERVER */
/*
// use this method to serve page
//var server = ws.createServer({server: httpServer});

// use this method if opening the page directly in Chrome
var server = new WebSocketServer({
	httpServer: httpServer,
	autoAcceptConnections: true
});

server.on('connect', function(connection) {

	connectedSocket = connection;
	console.log((new Date()) + " Connection accepted.");
	
	connection.on('message', function(message) {

		//var msgData;
		//if (message.indexOf(',')) {
		//	msgData = message.split(',');
		//} else {
		//	msgData = message;
		//}
      
		if (message.type === 'utf8') {
			console.log("Received Message: " + message.utf8Data);
			connection.sendUTF(message.utf8Data);
			//connection.sendUTF(msgData.utf8Data);
		} else if (message.type === 'binary') {
			console.log("Received Binary Message of " + message.binaryData.length + " bytes");
			connection.sendBytes(message.binaryData);
			//connection.sendBytes(msgData.binaryData);
		}
	});
	connection.on('close', function(connection) {
		console.log((new Date()) + " Peer " + connection.remoteAddress + " disconnected.");
	});
});
*/

function handler (request, response) {
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
      	console.log("filename = " + jsfilename);
      }
      else {
      	type = "text/html; charset=UTF-8";
      	file = filename;
      	console.log("filename = " + filename);
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
}
/*
function handler (req, res) {
  fs.readFile(__dirname + '/../index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}
*/

io.sockets.on('connection', function (socket) {
  connectedSocket = connection;
  console.log("connected");
  //socket.send('hello world');
  socket.on('message', function (data) {
    console.log(data);
  });
  socket.on('disconnect', function() {
  	console.log("disconnected");
  });
});





  


