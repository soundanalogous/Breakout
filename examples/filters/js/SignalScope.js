SignalScope = function(canvasId, width, height, rangeMin, rangeMax, color) {

	this.name = "SignalScope";

	this._canvas = document.getElementById(canvasId);
	this._ctx = this._canvas.getContext("2d");

	this._x = this._canvas.style.left;
	this._y = this._canvas.style.top;

	this._width = width;
	this._height = height;
	this._rangeMin = rangeMin;
	this._rangeMax = rangeMax;

	this._color = color || '#FF0000';

	this._values = new Array(width);
	// inital all values to 0.0
	for (var i=0, len=this._values.length; i<len; i++) {
		this._values[i] = 0.0;
	}

	this._range = 1 / (rangeMax - rangeMin) * 100;

};

SignalScope.prototype.update = function(input) {
	var offset = 0,
		i = 0;

	this._values.push(input);
	this._values.shift();

	this._ctx.clearRect(this._x, this._y, this._width, this._height);
	this._ctx.strokeStyle = this._color;
	this._ctx.lineWidth = 1;
	this._ctx.beginPath();
	this._ctx.moveTo(this._x, this._y + this._height);

	for (i=0, len=this._values.length; i<len; i++) {
		offset = (this._rangeMax - this._values[i]) * this._range;
		this._ctx.lineTo(this._x + i, this._y + offset);
	}
	this._ctx.stroke();

};