 /**
 * Based on SignalScope.as originally written in as3.
 * Copyright (c) the Funnel development team
 * http://www.funnel.cc
 *
 * Ported to JavaScript by Jeff Hoefs
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 *
 * Released under the MIT license. See LICENSE file for details.
 */

SignalScope = function(canvasId, width, height, rangeMin, rangeMax, color) {

	this.name = "SignalScope";

	this._canvas = document.getElementById(canvasId);
	this._ctx = this._canvas.getContext("2d");

	//this._x = this._canvas.style.left;
	//this._y = this._canvas.style.top;

	this._width = width;
	this._height = height;
	this._rangeMin = rangeMin;
	this._rangeMax = rangeMax;

	this._color = color || '#FF0000';
	this._markers = null;

	this._values = new Array(width);
	// inital all values to 0.0
	for (var i=0, len=this._values.length; i<len; i++) {
		this._values[i] = 0.0;
	}

	this._range = 1 / (rangeMax - rangeMin) * 100;

};

SignalScope.prototype.update = function(input) {
	var offset = 0.0,
		i = 0,
		j = 0;

	this._values.push(input);
	this._values.shift();

	this._ctx.clearRect(0, 0, this._width, this._height);
	this._ctx.strokeStyle = this._color;
	this._ctx.lineWidth = 1;
	this._ctx.beginPath();
	this._ctx.moveTo(0, this._height);

	for (i=0, len=this._values.length; i<len; i++) {
		offset = (this._rangeMax - this._values[i]) * this._range;
		this._ctx.lineTo(i,  offset);
	}
	this._ctx.stroke();

	// draw markers
	if (this._markers !== null) {
		for (j=0, num=this._markers.length; j<num; j++) {
			offset = (this._rangeMax - this._markers[j][0]) * this._range;
			this._ctx.strokeStyle = this._markers[j][1];
			this._ctx.lineWidth = 0.5;
			this._ctx.beginPath();
			this._ctx.moveTo(0, offset);
			this._ctx.lineTo(this._width, offset);
			this._ctx.stroke();
		}
	}

};

SignalScope.prototype.addMarker = function(level, color) {
	if (this._markers === null) this._markers = [];
	this._markers.push([level, color]);
};

SignalScope.prototype.removeAllMarkers = function() {
	this._markers = null;
};