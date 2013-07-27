module.exports = function (grunt) {

    var bannerContent = '/*!\n' +
                        ' * <%= pkg.name %> v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n\n' +
                        ' * Copyright (c) 2011-<%= grunt.template.today("yyyy") %> <%= pkg.author %> \n' +
                        ' * Released under the MIT license. See LICENSE file for details.\n' +
                        ' * http://breakoutjs.com\n' +
                        ' */\n';

    var nameAndVersion = '<%= pkg.name %>_v<%= pkg.version %>';
    var name = '<%= pkg.name %>';

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
        'src/io/BiColorLED.js',
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
                jshintrc: '.jshintrc'
            },
            target: {
                src: ['src/**/*.js']
            }
        },

        /* 
         * Creates the distribution package that is available from
         * breakoutjs.com/downloads.
         */
        shell: {
            makePackage: {
                command: [
                    'rm dist/*.zip',
                    'mkdir -p tmp/Breakout',
                    'cp -r custom_examples tmp/Breakout',
                    'cp -r docs tmp/Breakout',
                    'cp -r examples tmp/Breakout',
                    'cp -r firmware tmp/Breakout',
                    'cp -r node_server tmp/Breakout',
                    'cp -r server tmp/Breakout',
                    'cp -r src tmp/Breakout',
                    'cp -r dist tmp/Breakout',
                    'cp ChangeLog tmp/Breakout',
                    'cp LICENSE tmp/Breakout',
                    'cp README.md tmp/Breakout',
                    'cd tmp/Breakout',
                    'find . -name "*.DS_Store" -type f -delete',
                    'cd server',
                    'zip -r breakout_server-mac.zip ./breakout_server-mac/',
                    'zip -r breakout_server-win32.zip ./breakout_server-win32/',
                    'zip -r breakout_server-win64.zip ./breakout_server-win64/',
                    'zip -r breakout_server-linux.zip ./breakout_server-linux/',
                    'rm -r ./breakout_server-mac/',
                    'rm -r ./breakout_server-win32/',
                    'rm -r ./breakout_server-win64/',
                    'rm -r ./breakout_server-linux/',
                    'cd ..',
                    'rm -rf node_server/node_modules/',
                    'rm node_server/.gitignore',
                    'cd ..',
                    'zip -r ./Breakout.zip ./Breakout',
                    'cd ..',
                    'mv ./tmp/Breakout.zip dist/' + nameAndVersion + '.zip',
                    'rm -r ./tmp/'
                ].join(';'),
                options: {
                    stdout: true
                }
            }
        }

    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-mocha-phantomjs');
    grunt.loadNpmTasks('grunt-contrib-yuidoc');
    grunt.loadNpmTasks('grunt-shell');

    grunt.registerTask('default', ['jshint', 'concat', 'uglify', 'mocha_phantomjs', 'yuidoc']);
    grunt.registerTask('compile', ['concat', 'uglify']);
    grunt.registerTask('test', ['jshint', 'mocha_phantomjs']);
    grunt.registerTask('docs', ['yuidoc']);
    grunt.registerTask('package', ['default', 'shell']);
};
