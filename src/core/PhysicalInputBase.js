/**
 * Based on PhysicalInput.as originally written in as3.
 * Copyright (c) the Funnel development team
 * http://www.funnel.cc
 *
 * Ported to JavaScript by Jeff Hoefs
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 *
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.PhysicalInputBase');

BO.PhysicalInputBase = (function() {

	var PhysicalInputBase;

	// Dependencies
	var EventDispatcher = JSUTILS.EventDispatcher;

	/**
	 * A base class for physical inputs. Treat this class as an abstract base
	 * class - do not instantiate it directly.
	 *
	 * @exports PhysicalInputBase as BO.PhysicalInputBase
	 * @class A base class for physical input objects. Extend this class to
	 * create new digital or analog input objects. Treat this class as
	 * an abstract base class. It should not be instantiated directly.
	 * @constructor
	 */
	PhysicalInputBase = function() {

		this.name = "PhysicalInputBase";

		this._evtDispatcher = new EventDispatcher(this);
	};

	PhysicalInputBase.prototype = {
		// Implement EventDispatcher
		
		/**
		 * @param {String} type The event type
		 * @param {Function} listener The function to be called when the event is fired
		 */
		addEventListener: function(type, listener) {
			this._evtDispatcher.addEventListener(type, listener);
		},
		
		/**
		 * @param {String} type The event type
		 * @param {Function} listener The function to be called when the event is fired
		 */
		removeEventListener: function(type, listener) {
			this._evtDispatcher.removeEventListener(type, listener);
		},
		
		/**
		 * @param {String} type The event type
		 * return {boolean} True is listener exists for this type, false if not.
		 */
		hasEventListener: function(type) {
			return this._evtDispatcher.hasEventListener(type);
		},
		
		/**
		 * @param {Event} type The Event object
		 * @param {Object} optionalParams Optional parameters to assign to the event object.
		 * return {boolean} True if dispatch is successful, false if not.
		 */		
		dispatchEvent: function(event, optionalParams) {
			return this._evtDispatcher.dispatchEvent(event, optionalParams);
		}			
	};

	return PhysicalInputBase;

}());
