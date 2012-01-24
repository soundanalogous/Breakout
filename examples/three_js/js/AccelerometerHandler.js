/***********************************************************************
 * Based on AccelerometerHandler originally written in C++ by Memo Akten
 * See copyright below.
 *
 * Ported to JavaScript by Jeff Hoefs
 * Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
 *
 * Copyright (c) 2008, 2009, Memo Akten, www.memo.tv
 * The Mega Super Awesome Visuals Company
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of MSA Visuals nor the names of its contributors 
 *       may be used to endorse or promote products derived from this software
 *       without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" 
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, 
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS 
 * OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE 
 * OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
 * OF THE POSSIBILITY OF SUCH DAMAGE. 
 *
 * ***********************************************************************/

/**
 * Provides helpful accelerometer methods. Note this Object requires Three.js
 *
 * @class
 * @requires Three.js
 */
AccelerometerHandler = function() {
	"use strict";
	
	this.name = "AccelerometerHandler";

	this.RAD_TO_DEG = 180 / Math.PI;

	this._forceSmoothing = 0.1; // amount to smoothing incoming data by
	this._orientationSmoothing = 0.9; // amount to smooth orientation by
	this._accelReal; // current acceleration
	this._accelForce; // smoothed for force
	this._accelOrientation; // smoothed for acceleration
	this._orientation; // current orientation
	this._transform; // transformation matrix

	this._orientDirty;
	this._transformDirty;

	this._accelForce = new THREE.Vector4();
	this._accelReal = new THREE.Vector4();
	this._accelOrientation = new THREE.Vector4();
	this._orientation = new THREE.Vector4();
	this._transform = new THREE.Matrix4();
};

AccelerometerHandler.prototype = {

	/**
	 * [read-only] Get current smoothed accelerometer data 
	 * (value in number of Gs (1g = gravity, 9.8/s^2))
	 * @name AccelerometerHandler#force
	 * @property
	 * @type Number
	 */ 
	get force() {
		return this._accelForce;
	},

	/**
	 * [read-only] Get current real accelerometer data 
	 * (value in number of Gs (1g = gravity, 9.8/s^2))
	 * @name AccelerometerHandler#rawAcceleration
	 * @property
	 * @type Number
	 */ 
	get rawAcceleration() {
		return this._accelReal;
	},	

	/**
	 * [read-only] Get current orientation in degrees
	 * (x: pitch, y: roll, z: not used)
	 * @name AccelerometerHandler#orientation
	 * @property
	 * @type Number
	 */ 
	get orientation() {
		this.updateOrientation();
		return this._orientation;
	},

	/**
	 * [read-only] Get a reference to the transform matrix 
	 * @name AccelerometerHandler#transform
	 * @property
	 * @type Number
	 */ 
	get transform() {
		this.updateMatrix();
		return this._transform;
	},

	/**
	 * Set amount of smoothing on data (0: no smoothing, 1: very smooth) 
	 * (value in number of Gs (1g = gravity, 9.8/s^2))
	 * @name AccelerometerHandler#forceSmoothing
	 * @property
	 * @type Number
	 */ 
	set forceSmoothing(val) {
		this._forceSmoothing = val;
	},

	/**
	 * Set amount of orientation smoothing on data (0: no smoothing, 1: very smooth) 
	 * (value in number of Gs (1g = gravity, 9.8/s^2))
	 * @name AccelerometerHandler#orientationSmoothing
	 * @property
	 * @type Number
	 */ 
	set orientationSmoothing(val) {
		this._orientationSmoothing = val;
	},	
	
	/**
	 * Call this each time the accelerometer is updated.
	 *
	 * @param {Number} x The value of the accelerometer x axis (in Gs)
	 * @param {Number} y The value of the accelerometer y axis (in Gs)
	 * @param {Number} z The value of the accelerometer z axis (in Gs)
	 */
	update: function(x, y, z) {
		this._orientDirty = this._transformDirty = true;

		this._accelReal.x = x;
		this._accelReal.y = y;
		this._accelReal.z = z;

		var lerpFactor;

		if (this._forceSmoothing) {
			lerpFactor = 1.0 - this._forceSmoothing;
			if (lerpFactor > 1.0) lerpFactor = 1.0;
			else if (lerpFactor < 0.01) lerpFactor = 0.01;

			// accelForce += (accelReal - accelForce) * lerpFactor
			this._accelForce.lerpSelf(this._accelReal, lerpFactor);
		} else {
			this._accelForce.x = x;
			this._accelForce.y = y;
			this._accelForce.z = z;
		}

		if (this._orientationSmoothing) {
			lerpFactor = 1.0 - this._orientationSmoothing;
			if (lerpFactor > 1.0) lerpFactor = 1.0;
			else if (lerpFactor < 0.01) lerpFactor = 0.01;

			// accelOrientation += (accelReal - accelOrientation) * lerpFactor;
			this._accelOrientation.lerpSelf(this._accelReal, lerpFactor);
		} else {
			this._accelOrientation.x = x;
			this._accelOrientation.y = y;
			this._accelOrientation.z = z;
		}

	},

	updateOrientation: function() {
		if (!this._orientDirty) return;
		this._orientDirty = false;

		this._orientation.x = Math.atan2(this._accelOrientation.y, -this._accelOrientation.z) * this.RAD_TO_DEG;
		this._orientation.y = Math.atan2(this._accelOrientation.x, -this._accelOrientation.z) * this.RAD_TO_DEG;
		this._orientation.z = 0;
	},

	updateMatrix: function() {
		if( !this._transformDirty) return;
		this._transformDirty = false;
		
		var length;
		
		// make sure we have a big enough acceleration vector
		length = Math.sqrt(this._accelOrientation.x * this._accelOrientation.x + this._accelOrientation.y * 
				this._accelOrientation.y + this._accelOrientation.z * this._accelOrientation.z);
		if( length < 0.1 ) return;
		
		//0  1  2  3
		//4  5  6  7
		//8  9  10 11
		//12 13 14 15
		
		var v = new Array(16);
		// clear matrix to be used to rotate from the current referential to one based on the gravity vector
		this._transform.identity();
		
		v[15] = 1.0;
		
		// setup first matrix column as gravity vector
		v[0] = this._accelOrientation.x / length;
		v[1] = this._accelOrientation.y / length;
		v[2] = this._accelOrientation.z / length;
		
		// setup second matrix column as an arbitrary vector in the plane perpendicular to the
		// gravity vector {Gx, Gy, Gz} defined by the equation "Gx * x + Gy * y + Gz * z = 0" 
		// in which we arbitrarily set x=0 and y=1			
		v[4] = 0.0;
		v[5] = 1.0;
		v[6] = -this._accelOrientation.y / this._accelOrientation.z;
		length = Math.sqrt(v[4] * v[4] + v[5] * v[5] + v[6] * v[6]);
		v[4] /= length;
		v[5] /= length;
		v[6] /= length;
		
		// setup third matrix column as the cross product of the first two	
		v[8] = v[1] * v[6] - v[2] * v[5];
		v[9] = v[4] * v[2] - v[6] * v[0];
		v[10] = v[0] * v[5] - v[1] * v[4];

		this._transform.set (
			v[0], v[1], v[2], v[3],
			v[4], v[5], v[6], v[7],
			v[8], v[9], v[10], v[11],
			v[12], v[13], v[14], v[15]
		);	
	
	}

};