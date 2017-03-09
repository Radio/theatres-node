"use strict";

let async = require('async');
let mapPlay = require('fetching/mappers/play');
let mapScene = require('fetching/mappers/scene');
let mapTheatre = require('fetching/mappers/theatre');

/**
 * Consume raw JSON shows data, find appropriate plays, theatres, scenes and map them.
 *
 * @param {Array} rawShowsData
 * @param {Function} callback
 *
 * @return {{theatre: Theatre, play: Play, scene: Scene, date: Date}}
 */
module.exports = function(rawShowsData, callback) {
    let mappingTuple = async.compose(mapStatic, mapPlaysAsync, mapScenesAsync, mapTheatresAsync);
    mappingTuple(rawShowsData.map(rawShowData => ({raw: rawShowData, mapped: {}})), function(err, results) {
        if (err) return callback(err);
        callback(null, results.map(showData => showData.mapped));
    });
};

function mapStatic(showsData, callback) {
    callback(null, showsData.map(showData => {
        ['url', 'date', 'price', 'buyTicketUrl'].forEach(property => {
            if (typeof showData.raw[property] !== 'undefined') {
                showData.mapped[property] = showData.raw[property];
            }
        });
        return showData
    }));
}

function mapPlaysAsync(showsData, callback) {
    async.mapSeries(showsData, function (showData, callback) {
        mapPlay(showData.raw.title, showData.raw, showData.mapped.theatre, showData.mapped.scene, function (err, play) {
            if (err) return callback(err);
            showData.mapped.play = play;
            callback(null, showData);
        });
    }, function (err, results) {
        if (err) return callback(err);
        callback(null, results);
    });
}

function mapScenesAsync(showsData, callback) {
    async.mapSeries(showsData, function (showData, callback) {
        if (!showData.raw.scene) {
            return callback(null, showData);
        }
        mapScene(showData.raw.scene, function (err, scene) {
            if (err) return callback(err);
            showData.mapped.scene = scene;
            callback(null, showData);
        });
    }, function (err, results) {
        if (err) return callback(err);
        callback(null, results);
    });
}

function mapTheatresAsync(showsData, callback) {
    async.mapSeries(showsData, function (showData, callback) {
        mapTheatre(showData.raw.theatre, showData.raw.theatreRawData, function (err, theatre) {
            if (err) return callback(err);
            showData.mapped.theatre = theatre;
            callback(null, showData);
        });
    }, function (err, results) {
        if (err) return callback(err);
        callback(null, results);
    });
}
