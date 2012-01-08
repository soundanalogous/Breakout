/**
 * @author Jeff Hoefs
 */

BREAKOUT.namespace('BREAKOUT.PhysicalInputBase');

BREAKOUT.PhysicalInputBase = (function() {

	var PhysicalInputBase;

	// dependencies
	var EventDispatcher = BREAKOUT.EventDispatcher;

	/**
	 * A base class for physical inputs. Treat this class as an abstract base
	 * class - do not instantiate it directly.
	 *
	 * @exports PhysicalInputBase as BREAKOUT.PhysicalInputBase
	 * @constructor
	 */
	PhysicalInputBase = function() {

		this.name = "PhysicalInputBase"; // for testing

		this._evtDispatcher = new EventDispatcher(this);
	};

	PhysicalInputBase.prototype = {
		/* implement EventDispatcher */
		
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