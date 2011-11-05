/**
 * @author Jeff Hoefs
 */

ARDJS.namespace('ARDJS.Event');

ARDJS.Event = (function() {

	var Event;

	/** 
	 * Event 'base class' (but it can also be instantiated directly)
	 *
	 * @constructor
	 * @param {String} type event type
	 */
	Event = function(type) {
		this.type = type;
		this.target = null;
	}

	/** @constant */
	Event.CONNECTED = "connected";
	/** @constant */
	Event.CHANGE	= "change";
	/** @constant */
	Event.COMPLETE	= "complete";

	return Event;

}());