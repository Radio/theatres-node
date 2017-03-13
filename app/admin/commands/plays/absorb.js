"use strict";

const Schedule = require('domain/models/schedule');
const modelHelper = require('helpers/model');

/**
 * Absorb duplicate by original play.
 * Replace duplicate play mentions in all schedule with original play.
 *
 * @param {Play} play
 * @param {ObjectId} duplicate
 * @param {Function} callback
 */
module.exports = function(play, duplicate, callback) {
    if (modelHelper.sameIds(duplicate.theatre, play.theatre)) {
        return callback(new Error('Можно поглотить только спектаклем из того-же театра.'));
    }
    play.absorbDuplicate(duplicate, function(err) {
        if (err) return callback(err);
        Schedule.replacePlay(duplicate.id, play.id, callback);
    });
};