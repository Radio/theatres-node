"use strict";

require('dotenv').config();
require('app-module-path').addPath('./app');

let async = require('async');
let CronJob = require('cron').CronJob;

const timezone = 'Europe/Kiev';

let fetchersNames = [
    // 'fetchers/shevchenko',
    // 'fetchers/pushkin',
    'fetchers/beautiful-flowers',
];

let fetch = function(month, year) {
    let fetchers = fetchersNames.map(fetcherName => callback => require(fetcherName).fetch(month, year, callback));
    async.parallel(fetchers, function(err, schedules) {
        if (err) {
            console.error(err);
        }
        // todo: import received schedules.
        console.log("All fetchers completed. Results are shown below.");
        console.log(schedules);
    });
};

fetch(2, 2016);
// new CronJob('0 * * * * *', fetch, null, true, timezone);


