 /**
 * Based on IGenerator.as originally written in as3.
 * Copyright (c) the Funnel development team
 * http://www.funnel.cc
 *
 * Ported to JavaScript by Jeff Hoefs
 * Copyright (c) 2011-2012 Jeff Hoefs <jeff.hoefs@gmail.com>
 *
 * Released under the MIT license. See LICENSE file for details.
 */

 JSUTILS.namespace('BO.generators.GeneratorBase');

 BO.generators.GeneratorBase = (function() {
 	"use strict";

 	var GeneratorBase;

 	// dependencies
	var EventDispatcher = JSUTILS.EventDispatcher;

 	/**
 	 * A base object for generators.
 	 *
 	 * @exports GeneratorBase as BO.generators.GeneratorBase
 	 * @class A base object to be extended by all Generator objects. This
 	 * object should not be instantiated directly.
 	 * @constructor
 	 * @augments JSUTILS.EventDispatcher
 	 */
 	GeneratorBase = function() {
 		
 		EventDispatcher.call(this, this);

 		this.name = "GeneratorBase";
 		/** @protected */
 		this._value;

 	};

 	GeneratorBase.prototype = JSUTILS.inherit(EventDispatcher.prototype);
 	GeneratorBase.prototype.constructor = GeneratorBase;

	/**
	 * [read-only] Get a generated number.
	 * @name GeneratorBase#value
	 * @protected
	 * @property
	 * @type Number
	 */ 	 	 
 	GeneratorBase.prototype.__defineGetter__("value", function() { 
	 	return this._value;
	});

	/**
	 * Use setValue() instead?
	 * @protected
	 */
	GeneratorBase.prototype.__defineSetter__("value", function(val) { 
	 	this._value = val;
	});	

 	return GeneratorBase;


 }());