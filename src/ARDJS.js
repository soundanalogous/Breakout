/**
 * @author Jeff Hoefs
 * 
 */

/** @namespace Namespace and utility functions for Arduino-JS */
var ARDJS = ARDJS || {};

/**
 * use this function to safely create a new namespace
 * if a namespace already exists, it won't be recreated
 *
 * @function
 */
ARDJS.namespace = function (ns_string) {
	var parts = ns_string.split('.'),
		parent = ARDJS,
		i;
		
	// strip redundant leading global
	if (parts[0] === "ARDJS") {
		parts = parts.slice(1);
	}
	
	for (i=0; i<parts.length; i +=1) {
		// create a property if it doesn't exist
		if (typeof parent[parts[i]] === "undefined") {
			parent[parts[i]] = {};
		}
		parent = parent[parts[i]];
	}
	return parent;
};

/**
 * copied from Flanagan, David. JavaScript: The Definitive Guide
 *
 * Use this method rather than Object.create() directly if
 * browser compatibility is unknow
 * @function
 */
ARDJS.inherit = function(p) {
	if (p == null) throw TypeError(); // p must be a non-null object
	if (Object.create) { // If Object.create() is defined...
		return Object.create(p); // then just use it
	}
	var t = typeof p; // otherwise do some more type checking
	if (t !== "object" && t !== "function") throw TypeError();
	function f() {}; // define a dummy constructor function
	f.prototype = p; // Set its prototype property to p
	return new f(); // use f() to create an 'heir' of p.
}