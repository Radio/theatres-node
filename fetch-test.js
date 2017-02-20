"use strict";

require('dotenv').config();
require('app-module-path').addPath('./app');

let mongoose = require('mongoose');
let async = require('async');

/**
 * Fetch schedule for given theatre and output plain results.
 *
 * @param {String} fetcherName
 * @param {Function} finish
 * 
 * @return void
 */
let testFetch = function(fetcherName, finish) {
    require(fetcherName).fetch(function(err, rawShowsData) {
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

testFetch('fetchers/' + process.argv[2], function(err) {
    if (err) {
        console.error(err);
    }
    mongoose.disconnect();
});

// const timezone = 'Europe/Kiev';
// new CronJob('0 * * * * *', fetch, null, true, timezone);


