"use strict";

module.exports = function(grunt) {

    require('load-grunt-tasks')(grunt);

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        clean: {
            node_modules: {
                src: ['public/node_modules']
            },
        },
        copy: {
            node_modules: {
                files: [{
                    src: [
                        'node_modules/jquery/dist/jquery.min.js',
                        'node_modules/jquery/dist/jquery.min.map',
                        'node_modules/tether/dist/js/*.min.js',
                        'node_modules/tether/dist/css/*.min.css',
                        'node_modules/bootstrap/dist/js/*.js',
                        'node_modules/bootstrap/dist/css/*.css',
                        'node_modules/bootstrap/dist/css/*.map',
                        'node_modules/bootstrap-datetime-picker/js/bootstrap-datetimepicker.js',
                        'node_modules/bootstrap-datetime-picker/js/locales/bootstrap-datetimepicker.ru.js',
                        'node_modules/bootstrap-datetime-picker/css/bootstrap-datetimepicker.min.css',
                        'node_modules/font-awesome/css/font-awesome.css',
                        'node_modules/font-awesome/css/font-awesome.min.css',
                        'node_modules/font-awesome/css/font-awesome.css.map',
                        'node_modules/font-awesome/fonts/*',
                        'node_modules/imagelightbox/dist/imagelightbox.min.js',
                        'node_modules/imagelightbox/dist/imagelightbox.min.css',
                        'node_modules/responsive-toolkit/dist/bootstrap-toolkit.min.js',
                    ],
                    dest: 'public/'
                }]
            },
        }
    });

    // Default task(s).
    grunt.registerTask('build', [
        'clean',
        'copy',
    ]);
    grunt.registerTask('default', ['build']);

};