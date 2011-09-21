var http = require("http"),
		websockets = require("websockets");

/* uncomment to serve page */

var	fs = require("fs"),
		path = require("path"),
		repl = require("repl");


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
			connectedSocket.send(String(data[0]));
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



/* WEBSOCKET SERVER */

// use this method to serve page
var server = websockets.createServer({server: httpServer});

// use this method if opening the page directly in Chrome
//var server = websockets.createServer();


// listen for a client connection
server.addListener("connect", function(connection) {
	connectedSocket = connection;
	console.log('[*] open');
		
	// use this method to receive messages from the client
	connection.addListener("message", function(data) {
      var message = String(data);
      var msgData;
      
      if (message.indexOf(',')) {
      	msgData = message.split(',');
      } else {
      	msgData[0] = message;
      }
      
      // write the message to the serial port
      serial.write(msgData);

	});

	// use this method to be notified when the client connection has been closed
	connection.addListener("close", function(){
		console.log('[*] close');
		// to do: quit node server on close
	})
	
});

server.addListener("error", function(){
  console.log(Array.prototype.join.call(arguments, ", "));
});

server.listen(8080);