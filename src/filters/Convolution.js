/**
 * Based on Convolution.as originally written in as3.
 * Copyright (c) the Funnel development team
 * http://www.funnel.cc
 *
 * Ported to JavaScript by Jeff Hoefs
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 *
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.filters.Convolution');

/**
 * @namespace BO.filters
 */
BO.filters.Convolution = (function () {
    "use strict";

    var Convolution;

    // dependencies
    var FilterBase = BO.filters.FilterBase;

    /**
     * The Convolution object performs low-pass, high-pass and moving average
     * filtering on an analog input.
     * See [Breakout/examples/filters/convolution.html](https://github.com/soundanalogous/Breakout/blob/master/examples/filters/convolution.html) for an example application.
     *
     * @class Convolution
     * @constructor
     * @extends BO.filters.FilterBase
     * @param {Number[]} kernel An array of coefficients to be used with product-sum
     * operations for input buffers.
     */
    Convolution = function (kernel) {

        this.name = "Convolution";

        this._buffer = [];

        // use the coef setter
        this.coef = kernel;
    };


    Convolution.prototype = JSUTILS.inherit(FilterBase.prototype);
    Convolution.prototype.constructor = Convolution;

    /**
     * An array of coefficients to be used with product-sum operations for input buffers. 
     * If assigned a new array, the input buffer will be cleared.
     * @property coef
     * @type Number[]
     */
    Object.defineProperty(Convolution.prototype, "coef", {
        get: function () {
            return this._coef;
        },
        set: function (kernel) {
            this._coef = kernel;
            this._buffer = new Array(this._coef.length);
            var len = this._buffer.length;
            for (var i = 0; i < len; i++) {
                this._buffer[i] = 0;
            }
        }
    });

    /**
     * Override FilterBase.processSample
     */
    Convolution.prototype.processSample = function (val) {
        this._buffer.unshift(val);
        this._buffer.pop();

        var result = 0;
        var len = this._buffer.length;

        for (var i = 0; i < len; i++) {
            result += this._coef[i] * this._buffer[i];
        }

        return result;
    };

    /**
     * Low-pass filter kernel. Use by passing this array to the constructor.
     * @property Convolution.LPF
     * @static
     */
    Convolution.LPF = [1 / 3, 1 / 3, 1 / 3];

    /**
     * High-pass filter kernel. Use by passing this array to the constructor.
     * @property Convolution.HPF
     * @static
     */
    Convolution.HPF = [1 / 3, -2.0 / 3, 1 / 3];
    
    /**
     * Moving average filter kernel. Use by passing this array to the constructor.
     * @property Convolution.MOVING_AVERAGE
     * @static
     */
    Convolution.MOVING_AVERAGE = [1 / 8, 1 / 8, 1 / 8, 1 / 8, 1 / 8, 1 / 8, 1 / 8, 1 / 8];
        
    return Convolution;

}());