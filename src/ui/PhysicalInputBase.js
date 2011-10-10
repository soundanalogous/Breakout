/**
 * A base class for physical inputs. Treat this class as an abstract base
 * class - do not instantiate it directly.
 *
 * @constructor
 */
function PhysicalInputBase() {

	var _evtDispatcher = new EventDispatcher(this);
	
	
	/* implement EventDispatcher */
	
	/**
	 * @param {String} type The event type
	 * @param {Function} listener The function to be called when the event is fired
	 */
	this.addEventListener = function(type, listener) {
		_evtDispatcher.addEventListener(type, listener);
	}
	
	/**
	 * @param {String} type The event type
	 * @param {Function} listener The function to be called when the event is fired
	 */
	this.removeEventListener = function(type, listener) {
		_evtDispatcher.removeEventListener(type, listener);
	}
	
	/**
	 * @param {String} type The event type
	 * return {boolean} True is listener exists for this type, false if not.
	 */
	this.hasEventListener = function(type) {
		return _evtDispatcher.hasEventListener(type);
	}
	
	/**
	 * @param {Event} type The Event object
	 * return {boolean} True if dispatch is successful, false if not.
	 */		
	this.dispatchEvent = function(event) {
		return _evtDispatcher.dispatchEvent(event);
	}	

}