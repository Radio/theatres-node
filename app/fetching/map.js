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
    let withMappedStatic = rawShowsData.map(mapStatic);
    mapPlaysAsync(withMappedStatic, function(err, mapped) {
        if (err) return callback(err);
        callback(null, mapped.map(showData => showData.mapped));
    });
};

function mapStatic(rawShowData) {
    return {raw: rawShowData, mapped: {
        url: rawShowData.url,
        date: rawShowData.date,
        price: rawShowData.price,
        buyTicketUrl: rawShowData.buyTicketUrl,
    }};
}

function mapPlaysAsync(showsData, callback) {
    async.mapSeries(showsData, function (showData, callback) {
        async.parallel({
            theatre: callback => mapTheatre(showData.raw.theatre, showData.raw.theatreRawData, callback),
            scene: callback => mapScene(showData.raw.scene, callback),
        }, function(err, mapped) {
            mapPlay(showData.raw.title, showData.raw, mapped.theatre, mapped.scene, function (err, play) {
                if (err) return callback(err);
                showData.mapped.play = play;
                callback(null, showData);
            });
        });
    }, callback);
}