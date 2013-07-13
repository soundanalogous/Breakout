module.exports = function (grunt) {

    grunt.initConfig({
        jshint: {
            options: {
                eqeqeq: false
            },
            target: {
                src: ['src/**/*.js']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.registerTask('default', ['jshint']);
};