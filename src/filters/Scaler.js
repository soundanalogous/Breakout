 /**
 * Based on Scaler.as originally written in as3.
 * Copyright (c) the Funnel development team
 * http://www.funnel.cc
 *
 * Ported to JavaScript by Jeff Hoefs
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 *
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BREAKOUT.filters.Scaler');

BREAKOUT.filters.Scaler = (function() {
	"use strict";

	var Scaler;

	// dependencies
	var FilterBase = BREAKOUT.filters.FilterBase;

	/**
	 * Scales up an input value from its min and max range to a specified minimum to maximum range. 
	 * A number of scaling functions are provided.	
	 *
	 * @exports Scaler as BREAKOUT.filters.Scaler
	 * @constructor
	 * @augments BREAKOUT.filters.FilterBase
	 * @param {Number} inMin minimum input value
	 * @param {Number} inMax maximum input value
	 * @param {Number} outMin minimum output value
	 * @param {Number} outMax maximum output value
	 * @param {Function} type The function used to map the input curve
	 * @param {Boolean} limiter Whether or not to restrict the input value if it
	 * exceeds the specified range.
	 */
	Scaler = function(inMin, inMax, outMin, outMax, type, limiter) {

		this.name = "Scaler";

		this._inMin = inMin || 0;
		this._inMax = inMax || 1;
		this._outMin = outMin || 0;
		this._outMax = outMax || 1;
		this._type = type || this.LINEAR;
		this._limiter = limiter || true;

	};


	Scaler.prototype = JSUTILS.inherit(FilterBase.prototype);
	Scaler.prototype.constructor = Scaler;

	/**
	 * Override FilterBase.processSample
	 *
	 * @inheritDoc
	 */
	Scaler.prototype.processSample = function(val) {
		var inRange = this._inMax - this._inMin;
		var outRange = this._outMax - this._outMin;
		var normalVal = (val - this._inMin) / inRange;
		if (this._limiter) {
			normalVal = Math.max(0, Math.min(1, normalVal));
		}

		return outRange * this._type(normalVal) + this._outMin;
	};

	/**
	 * y = x
	 */
	Scaler.prototype.LINEAR = function(val) {
		return val;
	};

	/**
	 * y = x * x
	 */
	Scaler.prototype.SQUARE = function(val) {
		return val;
	};

	/**
	 * y = sqrt(x)
	 */
	Scaler.prototype.SQUARE_ROOT = function(val) {
		return val;
	};
	
	/**
	 * y = x^4
	 */
	Scaler.prototype.CUBE = function(val) {
		return val;
	};
	
	/**
	 * y = pow(x, 1/4)
	 */
	Scaler.prototype.CUBE_ROOT = function(val) {
		return val;
	};			


	return Scaler;

}());