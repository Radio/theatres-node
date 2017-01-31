"use strict";

let setup = require('../setup.js');
let assert = require('chai').assert;

let Theatre = require('models/theatre.js');

describe('Theatre', function() {

    let theatre;

    before(setup.connectToMongo);
    before(function(done) {
        theatre = new Theatre({
            key: 'shevchenko',
            title: 'Театр имени Шевченко',
            abbreviation: 'ТШ',
            url: 'http://dummy.com',
            hasFetcher: true,
            houseSlug: 'shev'
        });
        theatre.save(done);
    });
    after(function() {
        Theatre.remove({}).exec();
    });
    after(setup.disconnectFromMongo);

    describe('load theatre', function() {
        it('should load existing scene', function(done) {
            Theatre.findByKey('shevchenko', function(err, theatre) {
                if (err) done(err);
                assert.isNotNull(theatre);
                done();
            });
        });
        it('should not load non-existing scene', function(done) {
            Theatre.findByKey('blah-blah', function(err, theatre) {
                if (err) done(err);
                assert.isNull(theatre);
                done();
            });
        });
    });

    describe('show theatre info', function() {
        it('should include house info in full abbreviation', function() {
            assert.equal(theatre.abbreviation, 'ТШ');
            assert.equal(theatre.fullAbbreviation, 'ТШ (ДА)');
            // assert.equal(theatre.fullAbbreviation, 'Театр имени Шевченко (в Доме Актера)');
        });
        it('should include house info in full title', function() {
            assert.equal(theatre.title, 'Театр имени Шевченко');
            assert.equal(theatre.fullTitle, 'Театр имени Шевченко (в Доме Актера)');
        });
    });
});