/**
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 * Released under the MIT license. See LICENSE file for details.
 */


/** 
 * @version 0.1.0.beta
 * @namespace
 *
 * <p>Namespace for Breakout objects.</p>
 *
 * <p>You can use the shorthand "BO" instead of "BREAKOUT".</p>
 */
var BO = BO || {};

// allow either namespace BO or BREAKOUT
var BREAKOUT = BREAKOUT || BO;

BREAKOUT.VERSION = '0.1.0.beta';

// global flags
/**
 * Set to true to enable debugging for all objects. Debug
 * messages will be printed to the console.
 * @property {Boolean} Set to true to enable debugging. Default is false.
 */
BREAKOUT.enableDebugging = false;