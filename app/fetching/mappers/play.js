"use strict";

let modelHelper = require('helpers/model');
let Play = require('models/play');

function mapPlay(title, theatreId, playData, callback) {
    if (!title) {
        callback(new Error('Play mapper was provided with an empty play key.'));
    }

    Play.findByTag(title)
        .where({theatre: theatreId})
        .exec(function(err, play) {
            if (err) return callback(err);
            if (!play) {
                createPlay(title, playData, function(err, play) {
                    if (err) return callback(err);
                    callback(null, play);
                });
                return;
            }
            callback(null, play);
        });
}


function createPlay(title, playData, callback) {
    let play = new Play({
        key: modelHelper.generateKey(title),
        title: title,
        theatre: playData.theatre,
        scene: playData.scene,
        url: playData.url,
        director: playData.director,
        author: playData.author,
        genre: playData.genre,
        duration: playData.duration,
        description: playData.description,
        image: playData.image,
        tags: [title]
    });
    play.save(function(err) {
        if (err) return callback(err);
        callback(null, play);
    });
}

module.exports = mapPlay;