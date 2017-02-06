"use strict";

require('dotenv').config();
require('app-module-path').addPath('./app');

let mongoose = require('mongoose');
let async = require('async');
let CronJob = require('cron').CronJob;

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
 * Consume raw JSON shows data, find appropriate plays, theatres, scenes and map them.
 *
 * @param {Array} rawShowsData
 * @param {Function} callback
 *
 * @return {{theatre: Theatre, play: Play, scene: Scene, date: Date}}
 */
let mapRawShowsData = function(rawShowsData, callback) {

    let mappingTuple = async.compose(mapPlaysAsync, mapScenesAsync, mapTheatresAsync);

    mappingTuple(rawShowsData, function(err, results) {
        if (err) return callback(err);
        callback(null, results);
    });

    function mapPlaysAsync(rawShowsData, callback) {
        let mapPlay = require('fetching/mappers/play');
        async.mapSeries(rawShowsData, function (rawShowData, callback) {
            mapPlay(rawShowData.title, rawShowData.theatre.id, rawShowData, function (err, play) {
                if (err) return callback(err);
                rawShowData.play = play;
                delete rawShowData.title;
                delete rawShowData.url;
                delete rawShowData.director;
                delete rawShowData.author;
                delete rawShowData.genre;
                delete rawShowData.duration;
                delete rawShowData.description;
                delete rawShowData.image;
                callback(null, rawShowData);
            });
        }, function (err, results) {
            if (err) return callback(err);
            callback(null, results);
        });
    }

    function mapScenesAsync(rawShowsData, callback) {
        let mapScene = require('fetching/mappers/scene');
        async.mapSeries(rawShowsData, function (rawShowData, callback) {
            if (!rawShowData.scene) {
                return callback(null, rawShowData);
            }
            mapScene(rawShowData.scene, function (err, scene) {
                if (err) return callback(err);
                rawShowData.scene = scene;
                callback(null, rawShowData);
            });
        }, function (err, results) {
            if (err) return callback(err);
            callback(null, results);
        });
    }

    function mapTheatresAsync(rawShowsData, callback) {
        let mapTheatre = require('fetching/mappers/theatre');
        async.mapSeries(rawShowsData, function (rawShowData, callback) {
            mapTheatre(rawShowData.theatre, function (err, theatre) {
                if (err) return callback(err);
                rawShowData.theatre = theatre;
                callback(null, rawShowData);
            });
        }, function (err, results) {
            if (err) return callback(err);
            callback(null, results);
        });
    }
};

/**
 * Remove duplicates fetched from different sources.
 *
 * @param {Array} mappedShowsData
 *
 * @return {Array}
 */
let reduceDuplicates = function(mappedShowsData) {
    // todo: implement me
    // no duplicates so far
    return mappedShowsData
};

/**
 * Update the schedule records with the new shows.
 *
 * @param {Array} mappedShowsData
 * @param {Function} callback
 * 
 * @return void
 */
let updateSchedule = function(mappedShowsData, callback) {
    let Schedule = require('models/schedule');

    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();
    // todo: group show by month and update each schedule seprately
    Schedule.resolve(month, year, function(err, schedule) {
        if (err) return callback(err);

        schedule.update(mappedShowsData, callback);
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
        mapRawShowsData(rawShowsData, function(err, mappedShowsData) {
            if (err) return finish(err);

            let mappedShowsDataUnique = reduceDuplicates(mappedShowsData);
            updateSchedule(mappedShowsDataUnique, function(err) {
                if (err) {
                    console.log(err);
                    return;
                }
                console.log("Schedules were updated.");

                finish();
            })
        });
    });
};

if (!process.env.MONGO_URL) {
    console.log('Mongo URL is not set in env variables.');
    process.exit(1);
}

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGO_URL);

fetch([
    'fetchers/shevchenko',
    'fetchers/pushkin',
    'fetchers/beautiful-flowers',
], function(err) {
    if (err) {
        console.error(err);
    }
    mongoose.disconnect();
});

// const timezone = 'Europe/Kiev';
// new CronJob('0 * * * * *', fetch, null, true, timezone);


