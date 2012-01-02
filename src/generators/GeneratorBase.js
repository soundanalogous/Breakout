/**
 * @author Jeff Hoefs
 * Based on GeneratorEvent.as in Funnel AS3 library (funnel.cc)
 */

 BREAKOUT.namespace('BREAKOUT.generators.GeneratorEvent');

 BREAKOUT.generators.GeneratorEvent = (function() {
 	"use strict";

 	var GeneratorEvent;

 	// dependencies
	var Event = BREAKOUT.Event;

 	/**
 	 * @exports GeneratorEvent as BREAKOUT.generators.GeneratorEvent
 	 * @constructor
 	 * @augments BREAKOUT.Event
 	 * @param {String} type The event type
 	 */
 	GeneratorEvent = function(type) {
 		
 		Event.call(this, type);

 		this.name = "GeneratorEvent";
 	};

 	GeneratorEvent.prototype = BREAKOUT.inherit(Event.prototype);
 	GeneratorEvent.prototype.constructor = GeneratorEvent;

 	/** @constant */
 	GeneratorEvent.UPDATE = "update";

 	return GeneratorEvent;

 }());


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
 		/** @protected */
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