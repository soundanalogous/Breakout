 /**
 * Based on IFilter.as originally written in as3.
 * Copyright (c) the Funnel development team
 * http://www.funnel.cc
 *
 * Ported to JavaScript by Jeff Hoefs
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 *
 * Released under the MIT license. See LICENSE file for details.
 */

 JSUTILS.namespace('BO.filters.FilterBase');

 BO.filters.FilterBase = (function() {
 	"use strict";

 	var FilterBase;

 	/**
 	 * An Abstract Base object for filters
 	 *
 	 * @exports FilterBase as BO.filters.FilterBase
 	 * @class A base object to be extended by all Filter objects. This object
 	 * should not be instantiated directly.
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