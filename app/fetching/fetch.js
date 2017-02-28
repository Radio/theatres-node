"use strict";

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
                delete rawShowData.scene;
                delete rawShowData.theatre;
                delete rawShowData.title;
                delete rawShowData.playUrl;
                delete rawShowData.director;
                delete rawShowData.author;
                delete rawShowData.premiere;
                delete rawShowData.musical;
                delete rawShowData.dancing;
                delete rawShowData.forKids;
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
            mapTheatre(rawShowData.theatre, rawShowData.theatreRawData, function (err, theatre) {
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
 * Group plain array with shows by month.
 *
 * @param mappedShowsData
 *
 * @return {Object}
 */
let groupByMonth = function(mappedShowsData) {
    return mappedShowsData.reduce(function(grouped, showData) {
        const monthKey = showData.date.getMonth() + '-' + showData.date.getFullYear();
        grouped[monthKey] = grouped[monthKey] || {
                month: showData.date.getMonth(),
                year: showData.date.getFullYear(),
                shows: []
            };
        grouped[monthKey].shows.push(showData);
        return grouped;
    }, {});
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
    let groupedShowsData = groupByMonth(mappedShowsData);
    async.each(groupedShowsData, function(monthlyScheduleData, callback) {
        Schedule.resolve(monthlyScheduleData.month, monthlyScheduleData.year, function(err, schedule) {
            if (err) return callback(err);
            schedule.replaceShowsAndSave(monthlyScheduleData.shows, callback);
        });
    }, callback);
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
            updateSchedule(mappedShowsDataUnique, finish);
        });
    });
};

module.exports = fetch;