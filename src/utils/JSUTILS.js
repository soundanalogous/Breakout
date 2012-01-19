/**
 * This creates a namespace for common javascript utility objects and also
 * contains a few utility functions.
 *
 * inherit() method copied from Flanagan, David. JavaScript: The Definitive Guide.
 */

/** @namespace Namespace and utility functions */
var JSUTILS = JSUTILS || {};


// Utility functions

/** 
 * Use this function to safely create a new namespace
 * if a namespace already exists, it won't be recreated.
 *
 * @function
 * @param {String} namespaceString The namespace as a string.
 */
JSUTILS.namespace = function (namespaceString) {
	var parts = namespaceString.split('.'),
		parent = window,
		i;
			
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
 * Use this method rather than Object.create() directly if
 * browser compatibility is unknown.
 *
 * @function
 * @param {Object} p The prototype of the object to inherit.
 */
JSUTILS.inherit = function(p) {
	if (p == null) throw TypeError(); // p must be a non-null object
	if (Object.create) { // If Object.create() is defined...
		return Object.create(p); // then just use it
	}
	var t = typeof p; // otherwise do some more type checking
	if (t !== "object" && t !== "function") throw TypeError();
	function f() {}; // define a dummy constructor function
	f.prototype = p; // Set its prototype property to p
	return new f(); // use f() to create an 'heir' of p.
};


// Copied from https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
if (!Function.prototype.bind) {  

	/** 
	 * add bind for browsers that don't support it (Safari)
	 * @function
	 * @private
	 */
  	Function.prototype.bind = function (oThis) {  
    if (typeof this !== "function") {  
      // closest thing possible to the ECMAScript 5 internal IsCallable function  
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");  
    }  
  
    var aArgs = Array.prototype.slice.call(arguments, 1),   
        fToBind = this, 
        /** 
         * @private
         */  
        fNOP = function () {},
        /** 
         * @private
         */  
        fBound = function () {  
          return fToBind.apply(this instanceof fNOP  
                                 ? this  
                                 : oThis || window,  
                               aArgs.concat(Array.prototype.slice.call(arguments)));  
        };  
  
    fNOP.prototype = this.prototype;  
    fBound.prototype = new fNOP();  
  
    return fBound;  
  };  
}
