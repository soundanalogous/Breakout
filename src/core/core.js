/**
 * Copyright (c) 2011-2014 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */


/**
 * @version 0.3.1
 *
 * <p>Namespace for Breakout objects.</p>
 *
 * <p>You can use the shorthand "BO" instead of "BREAKOUT".</p>
 *
 * @namespace BO
 */
var BO = BO || {};

// allow either namespace BO or BREAKOUT
var BREAKOUT = BREAKOUT || BO;

BREAKOUT.VERSION = '0.3.1';

/**
 * The BO.enableDebugging flag can be set to true in an application
 * to print debug messages from various Breakout objects to the
 * console. By default it is false and only needs to be included
 * in an application if you intend to set it to true
 * @name BO#enableDebugging
 * @type {Boolean}
 */
BO.enableDebugging = false;