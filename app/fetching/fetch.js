"use strict";

let async = require('async');
let mapRawShowsData = require('fetching/map');
let updateSchedule = require('fetching/update');

/**
 * Fetch schedule for all theatres from the sources and put to database.
 *
 * @param {Array} fetchersNames
 * @param {Function} finish
 *
 * @return void
 */
module.exports = function(fetchersNames, finish) {
    fetchRawShowsData(fetchersNames, function(err, rawShowsData) {
        if (err) return finish(err);
        mapRawShowsData(rawShowsData, function(err, mappedShowsData) {
            if (err) return finish(err);
            updateSchedule(mappedShowsData, finish);
        });
    });
};

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
        if (err) {
            // return callback(err);
            callback(null, []);
        }
        callback(null, Array.prototype.concat.apply([], schedules));
    });
};
