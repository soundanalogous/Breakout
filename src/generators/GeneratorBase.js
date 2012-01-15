 /**
 * Based on GeneratorEvent.as originally written in as3.
 * Copyright (c) the Funnel development team
 * http://www.funnel.cc
 *
 * Ported to JavaScript by Jeff Hoefs
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 *
 * Released under the MIT license. See LICENSE file for details.
 */

 JSUTILS.namespace('BREAKOUT.generators.GeneratorEvent');

 BREAKOUT.generators.GeneratorEvent = (function() {
 	"use strict";

 	var GeneratorEvent;

 	// dependencies
	var Event = JSUTILS.Event;

 	/**
 	 * @exports GeneratorEvent as BREAKOUT.generators.GeneratorEvent
 	 * @constructor
 	 * @augments JSUTILS.Event
 	 * @param {String} type The event type
 	 */
 	GeneratorEvent = function(type) {
 		
 		Event.call(this, type);

 		this.name = "GeneratorEvent";
 	};

 	GeneratorEvent.prototype = JSUTILS.inherit(Event.prototype);
 	GeneratorEvent.prototype.constructor = GeneratorEvent;

 	/** @constant */
 	GeneratorEvent.UPDATE = "update";

 	return GeneratorEvent;

 }());


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

 JSUTILS.namespace('BREAKOUT.generators.GeneratorBase');

 BREAKOUT.generators.GeneratorBase = (function() {
 	"use strict";

 	var GeneratorBase;

 	// dependencies
	var EventDispatcher = JSUTILS.EventDispatcher;

 	/**
 	 * A base object for generators.
 	 *
 	 * @exports GeneratorBase as BREAKOUT.generators.GeneratorBase
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