/**
 * Based on IGenerator.as originally written in as3.
 * Copyright (c) the Funnel development team
 * http://www.funnel.cc
 *
 * Ported to JavaScript by Jeff Hoefs
 * Copyright (c) 2011-2012 Jeff Hoefs <jeff.hoefs@gmail.com>
 *
 * Released under the MIT license. See LICENSE file for details.
 */

JSUTILS.namespace('BO.generators.GeneratorBase');

/**
 * @namespace BO.generators
 */
BO.generators.GeneratorBase = (function () {
    "use strict";

    var GeneratorBase;

    // dependencies
    var EventDispatcher = JSUTILS.EventDispatcher;

    /**
     * A base object to be extended by all Generator objects. This object should
     * not be instantiated directly.
     *
     * @class GeneratorBase
     * @constructor
     * @extends JSUTILS.EventDispatcher
     */
    GeneratorBase = function () {
        
        EventDispatcher.call(this, this);

        this.name = "GeneratorBase";
        this._value = undefined;

    };

    GeneratorBase.prototype = JSUTILS.inherit(EventDispatcher.prototype);
    GeneratorBase.prototype.constructor = GeneratorBase;


    Object.defineProperty(GeneratorBase.prototype, "value", {
        /**
         * [read-only] Get a generated number.
         * @protected
         * @property value
         * @type Number
         */
        get: function () {
            return this._value;
        },
        /**
         * Use setValue() instead?
         * @protected
         */
        set: function (val) {
            this._value = val;
        }
    });

    return GeneratorBase;

}());