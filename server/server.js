var http = require("http"),
		ws = require("websocket-server");

/* uncomment to serve page */
/*
var	fs = require("fs"),
		path = require("path"),
		repl = require("repl");
*/

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
			//console.log(data[0]);
			
			/* either of the following methods can be used to send data to the client */
			connectedSocket.write(String(data[0]));
			//server.broadcast(String(data));
		}
	}

});


serial.on( "error", function( msg ) {
		console.log("serial error: " + msg );
});

/* example to serve page */
/*
var httpServer = http.createServer(function(req, res) {
  if(req.method == "GET"){
    if( req.url.indexOf("favicon") > -1 ){
      res.writeHead(200, {'Content-Type': 'image/x-icon', 'Connection': 'close'});
      res.end("");
    } else {
      res.writeHead(200, {'Content-Type': 'text/html', 'Connection': 'close'});
      fs.createReadStream( path.normalize(path.join(__dirname, "client.html")), {
        'flags': 'r',
        'encoding': 'binary',
        'mode': 0666,
        'bufferSize': 4 * 1024
      }).addListener("data", function(chunk){
        res.write(chunk, 'binary');
      }).addListener("end",function() {
        res.end();
      });
    }
  } else {
    res.writeHead(404);
    res.end();
  }
});
*/


/* WEBSOCKET SERVER */

// use this method to serve page
//var server = ws.createServer({server: httpServer});

// use this method if opening the page directly in Chrome
var server = ws.createServer();

server.addListener("listening", function(){
  console.log("Listening for connections.");
});

// listen for a client connection
server.addListener("connection", function(connection) {
	connectedSocket = connection;
	console.log('[*] open');
	
	/* can use either of the following methods to send data: */
	// send message only to the client requesing this connection
	//connection.send("Connection: " + connection.id);
	// broadcast to all connected clients
	//server.broadcast("** "+connection.id+" connected");
	
	// use this method to receive messages from the client
	connection.addListener("message", function(message) {
      //console.log('[+] ', (new Buffer(message)).inspect());
      //console.log("message received: " + message);
      var msgData;
      if (message.indexOf(',')) {
      	msgData = message.split(',');
      } else {
      	msgData = message;
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

server.addListener("disconnect", function(conn){
  server.broadcast("<"+conn.id+"> disconnected");
});

server.listen(8080);

/* use repl to interactively run JavaScript and see the results */
//repl.start( "=>" );
