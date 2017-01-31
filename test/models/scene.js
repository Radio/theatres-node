"use strict";

let setup = require('../setup.js');
let assert = require('chai').assert;

let Scene = require('models/scene.js');

describe('Scene', function() {

    let scene;

    before(setup.connectToMongo);
    before(function(done) {
        scene = new Scene({
            key: 'small',
            title: 'Small'
        });
        scene.save(done);
    });
    after(function() {
        Scene.remove({}).exec();
    });
    after(setup.disconnectFromMongo);

    describe('load scene', function() {
        it('should load existing scene', function(done) {
            Scene.findByKey('small', function(err, scene) {
                if (err) done(err);
                assert.isNotNull(scene);
                done();
            });
        });
        it('should not load non-existing scene', function(done) {
            Scene.findByKey('blah-blah', function(err, scene) {
                if (err) done(err);
                assert.isNull(scene);
                done();
            });
        });
    });

});