#!/usr/bin/env python

# based on Three.js build script

import os
import tempfile
import sys

ALL_FILES = [
'core/core.js',
'utils/JSUTILS.js',
'utils/Event.js',
'utils/EventDispatcher.js',
'utils/TimerEvent.js',
'utils/Timer.js',
'utils/SignalScope.js',
'core/IOBoardEvent.js',
'core/WSocketEvent.js',
'core/WSocketWrapper.js',
'filters/FilterBase.js',
'filters/Scaler.js',
'filters/Convolution.js',
'filters/TriggerPoint.js',
'generators/GeneratorEvent.js',
'generators/GeneratorBase.js',
'generators/Oscillator.js',
'core/PinEvent.js',
'core/Pin.js',
'core/I2CBase.js',
'core/PhysicalInputBase.js',
'io/BlinkM.js',
'io/CompassEvent.js',
'io/CompassHMC6352.js',
'io/ButtonEvent.js',
'io/Button.js',
'io/PotEvent.js',
'io/Potentiometer.js',
'io/AccelerometerEvent.js',
'io/AnalogAccelerometer.js',
'io/AccelerometerADXL345.js',
'io/GyroEvent.js',
'io/GyroITG3200.js',
'io/MagnetometerEvent.js',
'io/MagnetometerHMC5883.js',
'io/Servo.js',
'io/DCMotor.js',
'io/LED.js',
'io/RGBLED.js',
'io/SoftPotEvent.js',
'io/SoftPot.js',
'core/IOBoard.js'
]

# everything except the io modules
# import only the io modules you need in you app
WITHOUT_IO = [
'core/core.js',
'utils/JSUTILS.js',
'utils/Event.js',
'utils/EventDispatcher.js',
'utils/TimerEvent.js',
'utils/Timer.js',
'utils/SignalScope.js',
'core/IOBoardEvent.js',
'core/WSocketEvent.js',
'core/WSocketWrapper.js',
'filters/FilterBase.js',
'filters/Scaler.js',
'filters/Convolution.js',
'filters/TriggerPoint.js',
'generators/GeneratorEvent.js',
'generators/GeneratorBase.js',
'generators/Oscillator.js',
'core/PinEvent.js',
'core/Pin.js',
'core/I2CBase.js',
'core/PhysicalInputBase.js',
'core/IOBoard.js'
]

# the absolute minimal build
CORE_FILES = [
'core/core.js',
'utils/JSUTILS.js',
'utils/Event.js',
'utils/EventDispatcher.js',
'utils/TimerEvent.js',
'utils/Timer.js',
'utils/SignalScope.js',
'core/IOBoardEvent.js',
'core/WSocketEvent.js',
'core/WSocketWrapper.js',
'generators/GeneratorEvent.js',
'generators/GeneratorBase.js',
'core/PinEvent.js',
'core/Pin.js',
'core/PhysicalInputBase.js',
'core/I2CBase.js',
'core/IOBoard.js'
]

def merge(files):

	buffer = []

	for filename in files:
		with open(os.path.join('..', 'src', filename), 'r') as f:
			buffer.append(f.read())

	return "".join(buffer)


def output(text, filename):

	with open(os.path.join('..', 'dist', filename), 'w') as f:
		f.write(text)


def compress(text):

	in_tuple = tempfile.mkstemp()
	with os.fdopen(in_tuple[0], 'w') as handle:
		handle.write(text)

	out_tuple = tempfile.mkstemp()

	os.system("java -jar compiler/compiler.jar --language_in=ECMASCRIPT5_STRICT --js %s --js_output_file %s" % (in_tuple[1], out_tuple[1]))

	with os.fdopen(out_tuple[0], 'r') as handle:
		compressed = handle.read()

	os.unlink(in_tuple[1])
	os.unlink(out_tuple[1])

	return compressed


def addHeader(text, version):

	header = """/***
	Breakout - %s

    Copyright (c) 2011-2012 Jeff Hoefs <soundanalogous@gmail.com>
    Released under the MIT license. See LICENSE file for details.
	http.//breakoutjs.com
	***/\n"""

	return (header % version) + text



def buildLib(files, filename, version):

	text = merge(files)

	filename = filename + '.js'

	print "=" * 40
	print "Compiling", filename
	print "=" * 40

	text = compress(text)

	output(addHeader(text, version), filename)



def main(argv=None):

	if len(sys.argv) > 1:
		version = sys.argv[1]
	else:
		version = "0.1.6"

	min_files = [
	['Breakout', ALL_FILES],
	['Breakout-base', WITHOUT_IO],
	['Breakout-core', CORE_FILES]
	]

	for fname_lib, files in min_files:
		buildLib(files, fname_lib, version)

if __name__ == "__main__":
	main()

