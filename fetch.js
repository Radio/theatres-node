"use strict";

require('dotenv').config();
require('app-module-path').addPath('./app');

let fs = require('fs');
let fetch = require('fetching/fetch');
let mongoose = require('mongoose');

mongoose.Promise = global.Promise;

if (!process.env.MONGO_URL) {
    console.log('Mongo URL is not set in env variables.');
    process.exit(1);
}

const fetchers = JSON.parse(fs.readFileSync('fetchers.json', 'utf8'));

let fetchTask = function() {
    mongoose.connect(process.env.MONGO_URL);
    fetch(fetchers, function (err) {
        mongoose.disconnect();
        if (err) {
            console.error(err);
            return;
        }
        console.log(new Date().toISOString() + ' - Schedules were updated.');
    });
};

if (process.argv[2] === 'once') {
    fetchTask();
} else {
    const timezone = 'Europe/Kiev';
    let CronJob = require('cron').CronJob;
    new CronJob(process.env.FETCH_CRON_EXPRESSION || '0 0 * * * *', fetchTask, null, true, timezone);
}