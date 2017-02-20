"use strict";

let modelHelper = require('helpers/model');
let Play = require('models/play');
let shortid = require('shortid');

function mapPlay(title, theatreId, playData, callback) {
    if (!title) {
        callback(new Error('Play mapper was provided with an empty play key.'));
    }

    let findPlayQuery = Play.findByTag(title).where({theatre: theatreId});
    findPlayQuery.exec(function(err, play) {
        if (err) return callback(err);
        if (!play) {
            createPlay(title, playData, function(err, play) {
                if (err) return callback(err);
                callback(null, play);
            });
            return;
        }
        // todo: update play with some data
        callback(null, play);
    });
}


function createPlay(title, playData, callback) {
    let play = new Play({
        key: modelHelper.generateKey(title),
        title: title,
        theatre: playData.theatre,
        scene: playData.scene,
        url: playData.playUrl,
        director: playData.director,
        author: playData.author,
        premiere: playData.premiere,
        musical: playData.musical,
        dancing: playData.dancing,
        forKids: playData.forKids,
        genre: playData.genre,
        duration: playData.duration,
        description: playData.description,
        image: playData.image,
        tags: [title]
    });
    saveNewPlay(play, 1, callback);
}
const maxAttempts = 2;
const mongoErrorName = 'MongoError';
const duplicateKeyErrorCode = 11000;
function saveNewPlay(play, attempt, callback) {
    play.save(function(err) {
        if (err) {
            if (attempt < maxAttempts && err.name === mongoErrorName && err.code === duplicateKeyErrorCode) {
                play.key += '-' + shortid.generate();
                return saveNewPlay(play, attempt + 1, callback);
            }
            return callback(err);
        }
        callback(null, play);
    });
}

module.exports = mapPlay;