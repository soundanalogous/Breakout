/**
 * This creates a namespace for common javascript utility objects and also
 * contains a few utility functions.
 *
 * inherit() method copied from Flanagan, David. JavaScript: The Definitive Guide.
 */

/**
 * Namespace and utility functions
 * @namespace JSUTILS
 */
var JSUTILS = JSUTILS || {};


// Utility functions

/** 
 * Use this function to safely create a new namespace
 * if a namespace already exists, it won't be recreated.
 *
 * @param {String} namespaceString The namespace as a string.
 */
JSUTILS.namespace = function (namespaceString) {
    var parts = namespaceString.split('.'),
        parent = window,
        i;
            
    for (i = 0; i < parts.length; i += 1) {
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
 * @param {Object} p The prototype of the object to inherit.
 */
JSUTILS.inherit = function (p) {
    if (p === null) {
        throw new TypeError(); // p must be a non-null object
    }
    if (Object.create) { // If Object.create() is defined...
        return Object.create(p); // then just use it
    }
    var t = typeof p; // otherwise do some more type checking
    if (t !== "object" && t !== "function") {
        throw new TypeError();
    }
    function F() {} // define a dummy constructor function
    F.prototype = p; // Set its prototype property to p
    return new F(); // use f() to create an 'heir' of p.
};


// Copied from https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
if (!Function.prototype.bind) {

    /** 
     * add bind for browsers that don't support it (Safari)
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
            FNOP = function () {},
            /** 
             * @private
             */
            fBound = function () {
                return fToBind.apply(this instanceof FNOP ? this : oThis || window,
                                aArgs.concat(Array.prototype.slice.call(arguments)));
            };
  
        FNOP.prototype = this.prototype;
        fBound.prototype = new FNOP();
      
        return fBound;
    };
}
