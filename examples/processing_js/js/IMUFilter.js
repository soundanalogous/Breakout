/**
 * Based on IMUFilter.cpp/IMUFilter.h by Aaron Berk, originally written in C++
 *
 * @section LICENSE
 *
 * Copyright (c) 2010 ARM Limited
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * @section DESCRIPTION
 *
 * IMU orientation filter developed by Sebastian Madgwick.
 *
 * Find more details about his paper here:
 *
 * http://code.google.com/p/imumargalgorithm30042010sohm/ 
 * 
 * 
 * Ported to JavaScript by Jeff Hoefs
 * Copyright (c) 2012 Jeff Hoefs <soundanalogous@gmail.com>
 */	

JSUTILS.namespace('BO.IMUFilter');

BO.IMUFilter = (function() {
	"use strict";

	var IMUFilter;

	/**
	 * IMU orientation filter
	 *
	 * @exports IMUFilter as BO.IMUFilter
	 * @constructor
	 * @param {Number} rate Sampling period.
	 * @param {Number} gyroMeasurementError Gyroscope measurement error (in degrees per second).
	 */
	IMUFilter = function(rate, gyroMeasurementError) {

		this.name = "IMUFilter";

		this._firstUpdate = 0;

		//Quaternion orientation of earth frame relative to auxiliary frame.
		this._AEq_1 = 1
		this._AEq_2 = 0;
		this._AEq_3 = 0;
		this._AEq_4 = 0;

		//Estimated orientation quaternion elements with initial conditions.
		this._SEq_1 = 1;
		this._SEq_2 = 0;
		this._SEq_3 = 0;
		this._SEq_4 = 0;

		//Sampling period
		this._deltat = rate;

		//Gyroscope measurement error (in degrees per second).
		this._gyroMeasError = gyroMeasurementError;

		//Compute beta (filter tuning constant...)
		this._beta = Math.sqrt(3.0 / 4.0) * (Math.PI * (this._gyroMeasError / 180.0));

		this._phi;
		this._theta;
		this._psi;

	};

	IMUFilter.prototype = {

		updateFilter: function(w_x, w_y, w_z, a_x, a_y, a_z) {	

			//Local system variables.
			
			//Vector norm.
			var norm;
			//Quaternion rate from gyroscope elements.
			var SEqDot_omega_1;
			var SEqDot_omega_2;
			var SEqDot_omega_3;
			var SEqDot_omega_4;
			//Objective function elements.
			var f_1;
			var f_2;
			var f_3;
			//Objective function Jacobian elements.
			var J_11or24;
			var J_12or23;
			var J_13or22;
			var J_14or21;
			var J_32;
			var J_33;
			//Objective function gradient elements.
			var nablaf_1;
			var nablaf_2;
			var nablaf_3;
			var nablaf_4;
			
			//Auxiliary variables to avoid reapeated calculations.
			var halfSEq_1 = 0.5 * this._SEq_1;
			var halfSEq_2 = 0.5 * this._SEq_2;
			var halfSEq_3 = 0.5 * this._SEq_3;
			var halfSEq_4 = 0.5 * this._SEq_4;
			var twoSEq_1 = 2.0 * this._SEq_1;
			var twoSEq_2 = 2.0 * this._SEq_2;
			var twoSEq_3 = 2.0 * this._SEq_3;
			
			//Compute the quaternion rate measured by gyroscopes.
			SEqDot_omega_1 = -halfSEq_2 * w_x - halfSEq_3 * w_y - halfSEq_4 * w_z;
			SEqDot_omega_2 = halfSEq_1 * w_x + halfSEq_3 * w_z - halfSEq_4 * w_y;
			SEqDot_omega_3 = halfSEq_1 * w_y - halfSEq_2 * w_z + halfSEq_4 * w_x;
			SEqDot_omega_4 = halfSEq_1 * w_z + halfSEq_2 * w_y - halfSEq_3 * w_x;
			
			//Normalise the accelerometer measurement.
			norm = Math.sqrt(a_x * a_x + a_y * a_y + a_z * a_z);
			a_x /= norm;
			a_y /= norm;
			a_z /= norm;
			
			//Compute the objective function and Jacobian.
			f_1 = twoSEq_2 * this._SEq_4 - twoSEq_1 * this._SEq_3 - a_x;
			f_2 = twoSEq_1 * this._SEq_2 + twoSEq_3 * this._SEq_4 - a_y;
			f_3 = 1.0 - twoSEq_2 * this._SEq_2 - twoSEq_3 * this._SEq_3 - a_z;
			//J_11 negated in matrix multiplication.
			J_11or24 = twoSEq_3;
			J_12or23 = 2 * this._SEq_4;
			//J_12 negated in matrix multiplication
			J_13or22 = twoSEq_1;
			J_14or21 = twoSEq_2;
			//Negated in matrix multiplication.
			J_32 = 2 * J_14or21;
			//Negated in matrix multiplication.
			J_33 = 2 * J_11or24;
			
			//Compute the gradient (matrix multiplication).
			nablaf_1 = J_14or21 * f_2 - J_11or24 * f_1;
			nablaf_2 = J_12or23 * f_1 + J_13or22 * f_2 - J_32 * f_3;
			nablaf_3 = J_12or23 * f_2 - J_33 * f_3 - J_13or22 * f_1;
			nablaf_4 = J_14or21 * f_1 + J_11or24 * f_2;
			
			//Normalise the gradient.
			norm = Math.sqrt(nablaf_1 * nablaf_1 + nablaf_2 * nablaf_2 + nablaf_3 * nablaf_3 + nablaf_4 * nablaf_4);
			nablaf_1 /= norm;
			nablaf_2 /= norm;
			nablaf_3 /= norm;
			nablaf_4 /= norm;
			
			//Compute then integrate the estimated quaternion rate.
			this._SEq_1 += (SEqDot_omega_1 - (this._beta * nablaf_1)) * this._deltat;
			this._SEq_2 += (SEqDot_omega_2 - (this._beta * nablaf_2)) * this._deltat;
			this._SEq_3 += (SEqDot_omega_3 - (this._beta * nablaf_3)) * this._deltat;
			this._SEq_4 += (SEqDot_omega_4 - (this._beta * nablaf_4)) * this._deltat;
			
			//Normalise quaternion
			norm = Math.sqrt(this._SEq_1 * this._SEq_1 + this._SEq_2 * this._SEq_2 + 
				this._SEq_3 * this._SEq_3 + this._SEq_4 * this._SEq_4);			

			this._SEq_1 /= norm;
			this._SEq_2 /= norm;
			this._SEq_3 /= norm;
			this._SEq_4 /= norm;
			
			if (this._firstUpdate == 0) {
				//Store orientation of auxiliary frame.
				this._AEq_1 = this._SEq_1;
				this._AEq_2 = this._SEq_2;
				this._AEq_3 = this._SEq_3;
				this._AEq_4 = this._SEq_4;
				this._firstUpdate = 1;
			}
			
		},

		computeEuler: function() {
			
			//Quaternion describing orientation of sensor relative to earth.
			var ESq_1;
			var ESq_2;
			var ESq_3;
			var ESq_4;
			//Quaternion describing orientation of sensor relative to auxiliary frame.
			var ASq_1;
			var ASq_2;
			var ASq_3;
			var ASq_4;    
			
			//Compute the quaternion conjugate.
			ESq_1 =  this._SEq_1;
			ESq_2 = -this._SEq_2;
			ESq_3 = -this._SEq_3;
			ESq_4 = -this._SEq_4;
			
			//Compute the quaternion product.
			ASq_1 = ESq_1 * this._AEq_1 - ESq_2 * this._AEq_2 - ESq_3 * this._AEq_3 - ESq_4 * this._AEq_4;
			ASq_2 = ESq_1 * this._AEq_2 + ESq_2 * this._AEq_1 + ESq_3 * this._AEq_4 - ESq_4 * this._AEq_3;
			ASq_3 = ESq_1 * this._AEq_3 - ESq_2 * this._AEq_4 + ESq_3 * this._AEq_1 + ESq_4 * this._AEq_2;
			ASq_4 = ESq_1 * this._AEq_4 + ESq_2 * this._AEq_3 - ESq_3 * this._AEq_2 + ESq_4 * this._AEq_1;
			
			//Compute the Euler angles from the quaternion.
			this._phi = Math.atan2(2 * ASq_3 * ASq_4 - 2 * ASq_1 * ASq_2, 2 * ASq_1 * ASq_1 + 2 * ASq_4 * ASq_4 - 1);
			this._theta = Math.asin(2 * ASq_2 * ASq_3 - 2 * ASq_1 * ASq_3);
			this._psi   = Math.atan2(2 * ASq_2 * ASq_3 - 2 * ASq_1 * ASq_4, 2 * ASq_1 * ASq_1 + 2 * ASq_2 * ASq_2 - 1);
			
		},

		reset: function() {
			this._firstUpdate = 0;
			
			//Quaternion orientation of earth frame relative to auxiliary frame.
			this._AEq_1 = 1;
			this._AEq_2 = 0;
			this._AEq_3 = 0;
			this._AEq_4 = 0;
			
			//Estimated orientation quaternion elements with initial conditions.
			this._SEq_1 = 1;
			this._SEq_2 = 0;
			this._SEq_3 = 0;
			this._SEq_4 = 0;
			
			//Compute beta.
			this._beta = Math.sqrt(3.0 / 4.0) * (Math.PI * (this._gyroMeasError / 180.0));
		},

		get roll() {
			return this._phi;
		},

		get pitch() {
			return this._theta;
		},

		get yaw() {
			return this._psi;
		},

		set setGyroError(gyroscopeMeasurementError) {
			this._gyroMeasError = gyroscopeMeasurementError;
			this.reset();
		},
		
		get getGyroError() {
			return this._gyroMeasError;
		}		
		

	};

	return IMUFilter;

}());