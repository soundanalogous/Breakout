/**
 * @author Jeff Hoefs
 * Based on IFilter.as in Funnel AS3 library (funnel.cc)
 */

 BREAKOUT.namespace('BREAKOUT.filters.FilterBase');

 BREAKOUT.filters.FilterBase = (function() {
 	"use strict";

 	var FilterBase;

 	/**
 	 * An Abstract Base object for filters
 	 *
 	 * @exports FilterBase as BREAKOUT.filters.FilterBase
 	 * @constructor
 	 */
 	FilterBase = function() {
 		throw new Error("Can't instantiate abstract classes");
 	};

 	/**
 	 * Process the value to be filtered and return the filtered result.
 	 *
 	 * @protected
 	 * @param {Number} val The input value to be filtered.
 	 * @return {Number} The resulting value after applying the filter.
 	 */
 	FilterBase.prototype.processSample = function(val) { 
	 	// to be implemented in sub class
	 	throw new Error("Filter objects must implement the method processSample");
	};

 	return FilterBase;


 }());