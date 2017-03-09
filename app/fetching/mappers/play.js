"use strict";

let modelHelper = require('helpers/model');
let Play = require('models/play');
let shortid = require('shortid');

function mapPlay(title, playData, theatre, scene, callback) {
    if (!title) {
        callback(new Error('Play mapper was provided with an empty play key.'));
    }

    let findPlayQuery = Play.findByTag(title.trim())
        .where({theatre: theatre.id})
        .populate('mapAs');
    findPlayQuery.exec(function(err, play) {
        if (err) return callback(err);
        if (!play) {
            createPlay(title, playData, theatre, scene, function(err, play) {
                if (err) return callback(err);
                callback(null, play);
            });
            return;
        }
        // todo: update play with some data
        if (play.mapAs) {
            return callback(null, play.mapAs);
        }
        callback(null, play);
    });
}


function createPlay(title, playData, theatre, scene, callback) {
    let play = new Play({
        key: modelHelper.generateKey(title),
        title: title,
        theatre: theatre,
        scene: scene,
        url: playData.playUrl,
        director: playData.director,
        author: playData.author,
        premiere: playData.premiere,
        musical: playData.musical,
        dancing: playData.dancing,
        forKids: playData.forKids,
        opera: playData.opera,
        ballet: playData.ballet,
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