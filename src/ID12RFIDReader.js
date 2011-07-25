// ID12RFIDReader
// jeff hoefs 7/20/11
//

function ID12RFIDReader(board) {
	"use strict";
	
	this.className = "ID12RFIDReader"; 	// for testing

	// call the super class
	// 2nd parameter is passed to EventDispatcher constructor
	EventDispatcher.call(this, this);

	var 	ID12_READER		= 13,
			READ_EVENT		= 1,
			REMOVE_EVENT	= 2;
			
	var self = this;

	board.addEventListener(ArduinoEvent.SYSEX_MESSAGE, onSysExMessage);
	
	// private methods:
	
	function onSysExMessage(event) {
		var message = event.data.message;

		if (message[0] != ID12_READER) {
			return;
		} else {
			processRFIDData(message);
		}
	}

	// this is nice! found it here:
	// http://stackoverflow.com/questions/57803/how-to-convert-decimal-to-hex-in-javascript
	// I modified to pad by 1 zero rather than 3 zeros
	function dec2hex(i) {
   		return (i+0x100).toString(16).substr(-2).toUpperCase();
	}
	
	function processRFIDData(data) {
		var tagEvent = board.getValueFromTwo7bitBytes(data[1], data[2]);
		var tagEventType = "";
		var tag = "";
				
		for (var i=3, len=data.length; i<len; i+=2) {
			tag += dec2hex(board.getValueFromTwo7bitBytes(data[i], data[i+1]));
		}
		
		// change this to dispatch a single event and handle add or remove in object parameter?
		if (tagEvent == READ_EVENT) {
			dispatch(new RFIDEvent(RFIDEvent.ADD_TAG, tag));
		} else if (tagEvent == REMOVE_EVENT) {
			dispatch(new RFIDEvent(RFIDEvent.REMOVE_TAG, tag));
		} else {
			// got something else
			return;
		}
		
	}
	
	function dispatch(event) {
		self.dispatchEvent(event);
	}
}

// extends EventDispatcher
ID12RFIDReader.prototype = new EventDispatcher;
ID12RFIDReader.prototype.constructor = ID12RFIDReader;


function RFIDEvent(type, tag) {
	this.tag = tag;
	// call the super class
	// 2nd parameter is passed to EventDispatcher constructor
	Event.call(this, type);
}

RFIDEvent.ADD_TAG = "addTag";
RFIDEvent.REMOVE_TAG = "removeTag";