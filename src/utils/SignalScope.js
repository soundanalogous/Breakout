 /**
 * Based on SignalScope.as originally written in as3.
 * Copyright (c) the Funnel development team
 * http://www.funnel.cc
 *
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 *
 * Released under the MIT license. See LICENSE file for details.
 */

 JSUTILS.namespace('JSUTILS.SignalScope');

 JSUTILS.SignalScope = (function() {

 	var SignalScope;

	/**
	 * @class A simple 2 channel scope to view analog input data
	 * @constructor
	 * @exports SignalScope as JSUTILS.SignalScope	 
	 * @param {String} canvasId The id of the canvas element to 
	 * use to draw the signal.
	 * @param {Number} width The width of the canvas element.
	 * @param {Number} height The height of the canvas element.
	 * @param {Number} rangeMin The minimum range of the scope.
	 * @param {Number} rangeMax The maximum range of the scope.
	 * @param {String} ch1Color [optional] The hex color value to use
	 * for the channel 1 signal (default = #FF0000).
	 * @param {String} ch2Color [optional] The hex colorvalue to use
	 * for the channel 2 signal (default = #0000FF).
	 */
	SignalScope = function(canvasId, width, height, rangeMin, rangeMax, ch1Color, ch2Color) {

		this.name = "SignalScope";

		this._canvas = document.getElementById(canvasId);
		this._ctx = this._canvas.getContext("2d");

		this._width = width;
		this._height = height;
		this._rangeMin = rangeMin;
		this._rangeMax = rangeMax;

		this._ch1Color = ch1Color || '#FF0000';
		this._ch2Color = ch2Color || '#0000FF';
		this._markers = null;

		this._ch1Values = new Array(width);
		this._ch2Values = new Array(width);
		
		// inital all values to 0.0
		for (var i=0; i<width; i++) {
			this._ch1Values[i] = 0.0;
			this._ch2Values[i] = 0.0;
		}

		this._range = 1 / (rangeMax - rangeMin) * 100;

	};

	/**
	 * Call this method at the desired frame rate in order
	 * to draw the input signal.
	 * @param {Number} input1 The channel 1 input signal
	 * @param {Number} input2 [optional] The channel 2 input signal
	 */
	SignalScope.prototype.update = function(input1, input2) {
		// clear the canvas
		this._ctx.clearRect(0, 0, this._width, this._height);

		this._ch1Values.push(input1);
		this._ch1Values.shift();
		this.drawChannel(this._ch1Values, this._ch1Color);

		if (input2 !== undefined) {
			this._ch2Values.push(input2);
			this._ch2Values.shift();
			this.drawChannel(this._ch2Values, this._ch2Color);

		}

		this.drawMarkers();
	};

	/**
	 * @private
	 */
	SignalScope.prototype.drawChannel = function(values, color) {
		var offset = 0.0;

		this._ctx.strokeStyle = color;
		this._ctx.lineWidth = 1;
		this._ctx.beginPath();
		this._ctx.moveTo(0, this._height);

		// draw channel 1
		for (var i=0, len=values.length; i<len; i++) {
			offset = (this._rangeMax - values[i]) * this._range;
			this._ctx.lineTo(i,  offset);
		}
		this._ctx.stroke();
	};

	/**
	 * @private
	 */
	SignalScope.prototype.drawMarkers = function() {
		var offset = 0.0;

		if (this._markers !== null) {
			for (var i=0, num=this._markers.length; i<num; i++) {
				offset = (this._rangeMax - this._markers[i][0]) * this._range;
				this._ctx.strokeStyle = this._markers[i][1];
				this._ctx.lineWidth = 0.5;
				this._ctx.beginPath();
				this._ctx.moveTo(0, offset);
				this._ctx.lineTo(this._width, offset);
				this._ctx.stroke();
			}
		}
	};

	/**
	 * Add a horizontal marker to the scope. 1 or more markers can be added.
	 * @param {Number} level The value of the marker within the input value range.
	 * @param {String} color The hex color value for the marker.
	 */
	SignalScope.prototype.addMarker = function(level, color) {
		if (this._markers === null) this._markers = [];
		this._markers.push([level, color]);
	};

	/**
	 * Remove all markers from the scope.
	 */
	SignalScope.prototype.removeAllMarkers = function() {
		this._markers = null;
	};

	return SignalScope;

}());
