/**
 * @author Jeff Hoefs
 * Based on IGenerator.as in Funnel AS3 library (funnel.cc)
 */

 BREAKOUT.namespace('BREAKOUT.generators.GeneratorBase');

 BREAKOUT.generators.GeneratorBase = (function() {
 	"use strict";

 	var GeneratorBase;

 	// dependencies
	var EventDispatcher = BREAKOUT.EventDispatcher;

 	/**
 	 * A base object for generators.
 	 *
 	 * @exports GeneratorBase as BREAKOUT.generators.GeneratorBase
 	 * @constructor
 	 * @augments BREAKOUT.EventDispatcher
 	 */
 	GeneratorBase = function() {
 		
 		EventDispatcher.call(this, this);

 		this.name = "GeneratorBase";
 		this._value;

 	};

 	GeneratorBase.prototype = BREAKOUT.inherit(EventDispatcher.prototype);
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