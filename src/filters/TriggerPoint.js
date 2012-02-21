 /**
 * Based on SetPoint.as originally written in as3.
 * Copyright (c) the Funnel development team
 * http://www.funnel.cc
 *
 * Ported to JavaScript by Jeff Hoefs
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 *
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.filters.TriggerPoint');

BO.filters.TriggerPoint = (function() {
	"use strict";

	var TriggerPoint;

	// dependencies
	var FilterBase = BO.filters.FilterBase;

	/**
	 * Divides an input to 0 or 1 based on the threshold and hysteresis. You can also
	 * use multiple points by providing a nested array such as [[0.4, 0.1], [0.7, 0.05]].
	 *
	 * @exports TriggerPoint as BO.filters.TriggerPoint
	 * @class Divides an input to 0 or 1 based on the threshold and hysteresis. You can also
	 * use multiple points by providing a nested array such as [[0.4, 0.1], [0.7, 0.05]].
	 * See Breakout/examples/filters/triggerpoint.html for an example application.
	 * @constructor
	 * @augments BO.filters.FilterBase
	 * @param {Number[]} points An array of threshold and hysteresis values
	 * operations for input buffers.
	 */
	TriggerPoint = function(points) {

		this.name = "TriggerPoint";

		this._points = {};
		this._range = [];
		this._lastStatus;

		if (points === undefined) points = [[0.5, 0]];

		if (points[0] instanceof Array) {
			var len = points.length;
			for (var i=0; i<len; i++) {
				this._points[points[i][0]] = points[i][1];	
			}
		} else if (typeof points[0] === "number") {
			this._points[points[0]] = points[1];
		}

		this.updateRange();

		this._lastStatus = 0;
	};


	TriggerPoint.prototype = JSUTILS.inherit(FilterBase.prototype);
	TriggerPoint.prototype.constructor = TriggerPoint;

	/**
	 * Override FilterBase.processSample
	 *
	 * @inheritDoc
	 */
	TriggerPoint.prototype.processSample = function(val) {
		var status = this._lastStatus;
		var len = this._range.length;
		for (var i=0; i<len; i++) {
			var range = this._range[i];
			if (range[0] <= val && val <= range[1]) {
				status = i;
				break;
			}
		}

		this._lastStatus = status;
		return status;
	};

	TriggerPoint.prototype.addPoint = function(threshold, hysteresis) {
		this._points[threshold] = hysteresis;
		this.updateRange();
	};

	TriggerPoint.prototype.removePoint = function(threshold) {
		// to do: verify that this works in javascript
		delete this._points[threshold];
		this.updateRange();
	};

	TriggerPoint.prototype.removeAllPoints = function() {
		this._points = {};
		this.updateRange();
	};

	/**
	 * @private
	 */
	TriggerPoint.prototype.updateRange = function() {
				
		this._range = [];
		var keys = this.getKeys(this._points);

		var firstKey = keys[0];
		this._range.push([Number.NEGATIVE_INFINITY, firstKey - this._points[firstKey]]);

		var len = keys.length - 1;
		for (var i=0; i<len; i++) {
			var t0 = keys[i];
			var t1 = keys[i+1];
			var p0 = (t0 * 1) + this._points[t0]; // multiply by 1 to force type to number
			var p1 = t1 - this._points[t1];
			if (p0 >= p1) throw new Error("The specified range overlaps...");
			this._range.push([p0, p1]);
		}

		var lastKey = keys[keys.length - 1];
		var positiveThresh = (lastKey * 1) + this._points[lastKey];
		this._range.push([positiveThresh, Number.POSITIVE_INFINITY]);

	};

	/**
	 * @private
	 */
	TriggerPoint.prototype.getKeys = function(obj) {
		var keys = [];
		for (var key in obj) {
			keys.push(key);
		}
		return keys.sort();
	};
		
	return TriggerPoint;

}());