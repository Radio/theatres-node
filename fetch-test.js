"use strict";

require('dotenv').config();
require('app-module-path').addPath('./app');

let mongoose = require('mongoose');
let async = require('async');

/**
 * Fetch raw data using given fetchers.
 *
 * @param fetchersNames
 * @param callback
 *
 * @return void
 */
let fetchRawShowsData = function(fetchersNames, callback) {
    let fetchers = fetchersNames.map(fetcherName => callback => require(fetcherName).fetch(callback));
    async.parallel(fetchers, function(err, schedules) {
        if (err) return callback(err);
        callback(null, Array.prototype.concat.apply([], schedules));
    });
};

/**
 * Fetch schedule for all theatres from the sources and put to database.
 *
 * @param {Array} fetchersNames
 * @param {Function} finish
 * 
 * @return void
 */
let fetch = function(fetchersNames, finish) {
    fetchRawShowsData(fetchersNames, function(err, rawShowsData) {
        if (err) return finish(err);
        console.log(
            "\n==================================================================================================" +
            "\n=================================================================================================="
        );
        rawShowsData.forEach(function(rawShowData) {
            console.log(JSON.stringify(rawShowData, null, 2));
        });
        finish();
    });
};

if (!process.env.MONGO_URL) {
    console.log('Mongo URL is not set in env variables.');
    process.exit(1);
}

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGO_URL);

fetch([
    'fetchers/' + process.argv[2]
], function(err) {
    if (err) {
        console.error(err);
    }
    mongoose.disconnect();
});

// const timezone = 'Europe/Kiev';
// new CronJob('0 * * * * *', fetch, null, true, timezone);


