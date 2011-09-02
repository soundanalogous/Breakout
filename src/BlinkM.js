/**
 * Creates and BlinkM object
 *
 * @constructor
 * @param {Arduino} board The Arduino instance
 * @param {Number} address The i2c address of the BlinkM module
 */
function BlinkM(board, address) {

	address = address || 0x09;	// default i2c address for BlinkM
	
	var self = this;

	// call super class
	I2CBase.call(self, board, address);
	
	this.goToRGBColorNow = function(color) {
		self.sendI2C(I2CBase.I2C_REQUEST, [I2CBase.WRITE, address, 0x6E, color[0], color[1], color[2]]);
	}

	this.fadeToRGBColor = function(color, speed) {
		speed = speed || -1;
		if (speed >= 0) {
			self.sendI2C(I2CBase.I2C_REQUEST, [I2CBase.WRITE, address, 0x66, speed]);
		}
		self.sendI2C(I2CBase.I2C_REQUEST, [I2CBase.WRITE, address, 0x63, color[0], color[1], color[2]]);
	}

	this.fadeToRandomRGBColor = function (color, speed) {
		speed = speed || -1;
		if (speed >= 0) {
			self.sendI2C(I2CBase.I2C_REQUEST, [I2CBase.WRITE, address, 0x66, speed]);
		}
		self.sendI2C(I2CBase.I2C_REQUEST, [I2CBase.WRITE, address, 0x43, color[0], color[1], color[2]]);
	}

	this.fadeToHSBColor = function(color, speed) {
		speed = speed || -1;
		if (speed >= 0) {
			self.sendI2C(I2CBase.I2C_REQUEST, [I2CBase.WRITE, address, 0x66, speed]);
		}
		self.sendI2C(I2CBase.I2C_REQUEST, [I2CBase.WRITE, address, 0x68, color[0], color[1], color[2]]);
	}

	this.fadeToRandomHSBColor = function(color, speed) {
		speed = speed || -1;
		if (speed >= 0) {
			self.sendI2C(I2CBase.I2C_REQUEST, [I2CBase.WRITE, address, 0x66, speed]);
		}
		self.sendI2C(I2CBase.I2C_REQUEST, [I2CBase.WRITE, address, 0x48, color[0], color[1], color[2]]);
	}

	this.setFadeSpeed = function(speed) {
		self.sendI2C(I2CBase.I2C_REQUEST, [I2CBase.WRITE, address, 0x66, speed]);
	}

	this.playLightScript = function(scriptId, theNumberOfRepeats, lineNumber) {
		theNumberOfRepeats = theNumberOfRepeats || 1;
		self.sendI2C(I2CBase.I2C_REQUEST, [I2CBase.WRITE, address, 0x70, scriptId, theNumberOfRepeats, lineNumber]);
	}

	this.stopScript = function() {
		//self.sendI2C(I2CBase.I2C_REQUEST, [I2CBase.WRITE, address, 'o'.charCodeAt(0)]);
		self.sendI2C(I2CBase.I2C_REQUEST, [I2CBase.WRITE, address, 0x6F]);
	}

	// make sure this works
	//public override function handleSysex(command:uint, data:Array):void {
	this.handleI2C = function(command, data) {
		// TODO: implement if needed
		console.log("BlinkM: " + data);
	}
}

BlinkM.prototype = new I2CBase;
BlinkM.prototype.constructor = BlinkM;