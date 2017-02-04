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