 /**
 * Based on Scaler.as originally written in as3.
 * Copyright (c) the Funnel development team
 * http://www.funnel.cc
 *
 * Ported to JavaScript by Jeff Hoefs
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 *
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.filters.Scaler');

BO.filters.Scaler = (function () {
    "use strict";

    var Scaler;

    // dependencies
    var FilterBase = BO.filters.FilterBase;

    /**
     * Scales up an input value from its min and max range to a specified 
     * minimum to maximum range. See [Breakout/examples/filters/scaler.html](https://github.com/soundanalogous/Breakout/blob/master/examples/filters/scaler.html) for
     * an example application.  
     *
     * @class Scaler
     * @constructor
     * @extends BO.filters.FilterBase
     * @param {Number} inMin minimum input value
     * @param {Number} inMax maximum input value
     * @param {Number} outMin minimum output value
     * @param {Number} outMax maximum output value
     * @param {Function} type The function used to map the input curve
     * @param {Boolean} limiter Whether or not to restrict the input value if it
     * exceeds the specified range.
     */
    Scaler = function (inMin, inMax, outMin, outMax, type, limiter) {

        this.name = "Scaler";

        this._inMin = inMin || 0;
        this._inMax = inMax || 1;
        this._outMin = outMin || 0;
        this._outMax = outMax || 1;
        this._type = type || Scaler.LINEAR;
        this._limiter = limiter || true;

    };


    Scaler.prototype = JSUTILS.inherit(FilterBase.prototype);
    Scaler.prototype.constructor = Scaler;

    /**
     * Override FilterBase.processSample
     */
    Scaler.prototype.processSample = function (val) {
        var inRange = this._inMax - this._inMin;
        var outRange = this._outMax - this._outMin;
        var normalVal = (val - this._inMin) / inRange;
        if (this._limiter) {
            normalVal = Math.max(0, Math.min(1, normalVal));
        }

        return outRange * this._type(normalVal) + this._outMin;
    };

    /**
     * y = x
     * @method Scaler.LINEAR
     * @static
     */
    Scaler.LINEAR = function (val) {
        return val;
    };

    /**
     * y = x * x
     * @method Scaler.SQUARE
     * @static
     */
    Scaler.SQUARE = function (val) {
        return val * val;
    };

    /**
     * y = sqrt(x)
     * @method Scaler.SQUARE_ROOT
     * @static
     */
    Scaler.SQUARE_ROOT = function (val) {
        return Math.pow(val, 0.5);
    };
    
    /**
     * y = x^4
     * @method Scaler.CUBE
     * @static
     */
    Scaler.CUBE = function (val) {
        return val * val * val * val;
    };
    
    /**
     * y = pow(x, 1/4)
     * @method Scaler.CUBE_ROOT
     * @static
     */
    Scaler.CUBE_ROOT = function (val) {
        return Math.pow(val, 0.25);
    };


    return Scaler;

}());