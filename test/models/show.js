"use strict";

let setup = require('../setup.js');
let assert = require('chai').assert;

let Play = require('models/play.js');
let Scene = require('models/scene.js');
let Theatre = require('models/theatre.js');
let Show = require('models/show.js');

describe('Show', function() {

    let show, play, theatre, scene;

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
    before(function() {
        play = new Play({
            title: 'О чем говорят мужчины?',
            theatre: theatre,
            scene: scene,
            tags: ['мужчины']
        });
        // play.save(done);
    });
    before(function(done) {
        show = new Show({
            play: play,
            theatre: theatre,
            scene: scene,
            date: new Date(),
            price: '500$'
        });
        show.save(done);
    });
    after(function() {
        Show.remove({}).exec();
        // Play.remove({}).exec();
        // Scene.remove({}).exec();
        // Theatre.remove({}).exec();
    });
    after(setup.disconnectFromMongo);

    describe('generate hash', function() {
        it('should generate the same hash for the same data', function() {
            let oldDate = show.date;
            assert.equal(show.generateHash(), show.hash);
            show.date = new Date('2012-05-05');
            assert.notEqual(show.generateHash(), show.hash);
            show.date = oldDate;
            assert.equal(show.generateHash(), show.hash);
        });
    });

    describe('load show', function() {
        it('should load existing show by hash', function(done) {
            assert.isDefined(show.hash);
            assert.isNotNull(show.hash);
            Show.findByHash(show.hash, function(err, show) {
                if (err) return done(err);
                assert.isNotNull(show);
                done();
            });
        });
        it('should not load non-existing show', function(done) {
            Show.findByHash('blah-blah', function(err, show) {
                if (err) return done(err);
                assert.isNull(show);
                done();
            });
        });
    });

    describe('replace play', function() {
        it('should replace play id in db', function(done) {
            let newPlay = new Play({
                title: 'New Play',
                theatre: theatre,
                scene: scene
            });
            Show.replacePlay(play, newPlay, function(err, raw) {
                if (err) return done(err);
                Show.find({play: play.id}, function(err, missingShows) {
                    if (err) return done(err);
                    assert.equal(missingShows.length, 0);
                    Show.find({play: newPlay.id}, function(err, updatedShows) {
                        if (err) return done(err);
                        assert.isAbove(updatedShows.length, 0);
                        done();
                    });
                });
            });
        });
    });
});