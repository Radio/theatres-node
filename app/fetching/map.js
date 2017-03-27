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
        labels: rawShowData.labels || [],
    }};
}

function mapPlaysAsync(showsData, callback) {
    async.mapSeries(showsData, function (showData, callback) {
        async.parallel({
            showTheatre: callback => showData.raw.theatre ? mapTheatre(showData.raw.theatre, callback) : callback(),
            showScene: callback => showData.raw.scene ? mapScene(showData.raw.scene, callback) : callback(),
            playTheatre: callback => mapTheatre(showData.raw.play.theatre, callback),
            playScene: callback => mapScene(showData.raw.play.scene, callback),
        }, function(err, mapped) {
            if (err) return callback(err);
            mapPlay(showData.raw.play, mapped.playTheatre, mapped.playScene, function (err, play) {
                if (err) return callback(err);
                showData.mapped.play = play;
                if (mapped.showTheatre) {
                    showData.mapped.theatre = mapped.showTheatre;
                }
                if (mapped.showScene) {
                    showData.mapped.scene = mapped.showScene;
                }
                callback(null, showData);
            });
        });
    }, callback);
}