"use strict";

require('dotenv').config();
require('app-module-path').addPath('./app');

const fs = require('fs');
const path = require('path');
const fetch = require('fetching/fetch');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

if (!process.env.MONGO_URL) {
    console.log('Mongo URL is not set in env variables.');
    process.exit(1);
}

const fetchers = JSON.parse(fs.readFileSync('fetchers.json', 'utf8'));
const fetchTask = function() {
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

const testTask = function(fetcherName) {
    if (fetcherName.match(/[\\/]/)) {
        console.log('Please, specify just a fetcher name, not a path.');
        process.exit(1);
    }
    mongoose.connect(process.env.MONGO_URL);
    require(path.join('fetching', 'fetchers', fetcherName)).fetch(function(err, rawShowsData) {
        mongoose.disconnect();
        if (err) {
            console.error(err);
            return;
        }
        console.log(
            "\n==================================================================================================" +
            "\n=================================================================================================="
        );
        rawShowsData.forEach(function(rawShowData) {
            console.log(JSON.stringify(rawShowData, null, 2));
        });
    });
};

const mode = process.argv[2] || 'cron';
switch (mode) {
    case 'test':
        testTask(process.argv[3]);
        break;
    case 'once':
        fetchTask();
        break;
    case 'cron':
        const timezone = 'Europe/Kiev';
        let CronJob = require('cron').CronJob;
        new CronJob(process.env.FETCH_CRON_EXPRESSION || '0 0 * * * *', fetchTask, null, true, timezone);
        break;
    default:
        console.log('Valid modes are: once, cron, test.');
}