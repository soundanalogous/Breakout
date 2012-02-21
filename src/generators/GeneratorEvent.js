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

 JSUTILS.namespace('BO.generators.GeneratorEvent');

 BO.generators.GeneratorEvent = (function() {
 	"use strict";

 	var GeneratorEvent;

 	// dependencies
	var Event = JSUTILS.Event;

 	/**
 	 * @exports GeneratorEvent as BO.generators.GeneratorEvent
	 * @class An Event object to be dispatched (fired) by a Generator
	 * object when its value has updated.	 	 
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