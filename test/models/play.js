"use strict";

let setup = require('../setup.js');
let assert = require('chai').assert;

let Play = require('models/play.js');
let Scene = require('models/scene.js');
let Theatre = require('models/theatre.js');

describe('Play', function() {

    let scene, theatre, play, playDuplicate;

    before(setup.connectToMongo);
    before(function() {
        scene = new Scene({
            key: 'small',
            title: 'Small'
        });
        // scene.save(done);
    });
    before(function() {
        theatre = new Theatre({
            key: 'shevchenko',
            title: 'Театр имени Шевченко',
            abbreviation: 'ТШ',
            url: 'http://dummy.com',
            hasFetcher: true,
            houseSlug: 'shev'
        });
        // theatre.save(done);
    });
    before(function(done) {
        play = new Play({
            title: 'О чем говорят мужчины?',
            key: 'test-play-1',
            theatre: theatre,
            scene: scene,
            tags: ['мужчины']
        });
        play.save(function(err) {
            if (err) return done(err);
            playDuplicate = new Play({
                title: 'О чем говорят мужчины 2',
                key: 'test-play-2',
                theatre: theatre,
                scene: scene,
                tags: ['мужчины 2']
            });
            playDuplicate.save(done);
        });
    });
    after(function() {
        Play.remove({}).exec();
        // Scene.remove({}).exec();
        // Theatre.remove({}).exec();
    });
    after(setup.disconnectFromMongo);

    describe('load play by tag', function() {
        it('should load existing play', function(done) {
            Play.findByTag('мужчины', function(err, play) {
                if (err) return done(err);
                assert.isNotNull(play);
                done();
            });
        });
        it('should not load non-existing play', function(done) {
            Play.findByTag('blah-blah', function(err, play) {
                if (err) return done(err);
                assert.isNull(play);
                done();
            });
        });
    });

    describe('manage tags', function() {
        it('should add tags', function() {
            play.addTags(['new tag']);
            assert.include(play.tags, 'мужчины');
            assert.include(play.tags, 'new tag');
        });
    });

    describe('absorb duplicate', function() {
        it('should absorb tags and remove duplicate', function(done) {
            Play.findOne({_id: playDuplicate.id}, function(err, loadedDuplicate) {
                if (err) return done(err);
                assert.isNotNull(loadedDuplicate);
                play.absorbDuplicate(playDuplicate, function(err) {
                    if (err) return done(err);
                    assert.include(play.tags, playDuplicate.tags[0]);
                    Play.findOne({_id: playDuplicate.id}, function(err, missingPlay) {
                        if (err) return done(err);
                        assert.isNull(missingPlay);
                        done();
                    });
                })
            });
        });
    });
});