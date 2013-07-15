module.exports = function (grunt) {

    var bannerContent = '/*!\n' +
                        ' * <%= pkg.name %> v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n\n' +
                        ' * Copyright (c) 2011-<%= grunt.template.today("yyyy") %> <%= pkg.author %> \n' +
                        ' * Released under the MIT license. See LICENSE file for details.\n' +
                        ' * http://breakoutjs.com\n' +
                        ' */\n';

    var name = '<%= pkg.name %>-v<%= pkg.version %>';

    var allFiles = [
        'src/core/core.js',
        'src/utils/JSUTILS.js',
        'src/utils/Event.js',
        'src/utils/EventDispatcher.js',
        'src/utils/TimerEvent.js',
        'src/utils/Timer.js',
        'src/utils/SignalScope.js',
        'src/core/IOBoardEvent.js',
        'src/core/WSocketEvent.js',
        'src/core/WSocketWrapper.js',
        'src/filters/FilterBase.js',
        'src/filters/Scaler.js',
        'src/filters/Convolution.js',
        'src/filters/TriggerPoint.js',
        'src/generators/GeneratorEvent.js',
        'src/generators/GeneratorBase.js',
        'src/generators/Oscillator.js',
        'src/core/PinEvent.js',
        'src/core/Pin.js',
        'src/core/I2CBase.js',
        'src/core/PhysicalInputBase.js',
        'src/io/Stepper.js',
        'src/io/BlinkM.js',
        'src/io/CompassEvent.js',
        'src/io/CompassHMC6352.js',
        'src/io/ButtonEvent.js',
        'src/io/Button.js',
        'src/io/PotEvent.js',
        'src/io/Potentiometer.js',
        'src/io/AccelerometerEvent.js',
        'src/io/AnalogAccelerometer.js',
        'src/io/AccelerometerADXL345.js',
        'src/io/GyroEvent.js',
        'src/io/GyroITG3200.js',
        'src/io/MagnetometerEvent.js',
        'src/io/MagnetometerHMC5883.js',
        'src/io/Servo.js',
        'src/io/DCMotor.js',
        'src/io/LED.js',
        'src/io/RGBLED.js',
        'src/io/SoftPotEvent.js',
        'src/io/SoftPot.js',
        'src/core/IOBoard.js'
    ];

    // everything except the io modules
    // import only the io modules you need in you app
    var withoutIO = [
        'src/core/core.js',
        'src/utils/JSUTILS.js',
        'src/utils/Event.js',
        'src/utils/EventDispatcher.js',
        'src/utils/TimerEvent.js',
        'src/utils/Timer.js',
        'src/utils/SignalScope.js',
        'src/core/IOBoardEvent.js',
        'src/core/WSocketEvent.js',
        'src/core/WSocketWrapper.js',
        'src/filters/FilterBase.js',
        'src/filters/Scaler.js',
        'src/filters/Convolution.js',
        'src/filters/TriggerPoint.js',
        'src/generators/GeneratorEvent.js',
        'src/generators/GeneratorBase.js',
        'src/generators/Oscillator.js',
        'src/core/PinEvent.js',
        'src/core/Pin.js',
        'src/core/I2CBase.js',
        'src/core/PhysicalInputBase.js',
        'src/core/IOBoard.js'
    ];

    // the absolute minimal build
    var coreFiles = [
        'src/core/core.js',
        'src/utils/JSUTILS.js',
        'src/utils/Event.js',
        'src/utils/EventDispatcher.js',
        'src/utils/TimerEvent.js',
        'src/utils/Timer.js',
        'src/utils/SignalScope.js',
        'src/core/IOBoardEvent.js',
        'src/core/WSocketEvent.js',
        'src/core/WSocketWrapper.js',
        'src/generators/GeneratorEvent.js',
        'src/generators/GeneratorBase.js',
        'src/core/PinEvent.js',
        'src/core/Pin.js',
        'src/core/PhysicalInputBase.js',
        'src/core/I2CBase.js',
        'src/core/IOBoard.js'
    ];

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        yuidoc: {
            compile: {
                name: '<%= pkg.name %>',
                description: '<%= pkg.description %>',
                version: '<%= pkg.version %>',
                options: {
                    paths: 'src',
                    outdir: 'docs',
                    themedir: 'build/yuidoc_theme'
                }
            }
        },

        mocha_phantomjs: {
            all: ['test/core/runner.html']
        },

        uglify: {
            options: {
                banner: bannerContent,
                report: 'min'
            },
            all: {
                src: allFiles,
                dest: 'dist/' + name + '.min.js'
            },
            base: {
                src: withoutIO,
                dest: 'dist/' + name + '-base.min.js'
            }, 
            core: {
                src: coreFiles,
                dest: 'dist/' + name + '-core.min.js'
            }            
        },

        concat: {
            options: {
                banner: bannerContent,
                stripBanners: true
            },
            all: {
                src: allFiles,
                dest: 'dist/' + name + '.js'
            },
            base: {
                src: withoutIO,
                dest: 'dist/' + name + '-base.js'
            }, 
            core: {
                src: coreFiles,
                dest: 'dist/' + name + '-core.js'
            }
        },

        jshint: {
            options: {
                eqeqeq: false
                //jshintrc: '.jshintrc'
            },
            target: {
                src: ['src/**/*.js']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-mocha-phantomjs');
    grunt.loadNpmTasks('grunt-contrib-yuidoc');
    grunt.registerTask('default', ['jshint', 'concat', 'uglify', 'mocha_phantomjs', 'yuidoc']);
};
