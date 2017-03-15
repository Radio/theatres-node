"use strict";

const Schedule = require('domain/models/schedule');
const modelHelper = require('helpers/model');

/**
 * Absorb duplicate by original play.
 * Replace duplicate play mentions in all schedule with original play.
 *
 * @param {Play} original
 * @param {ObjectId} duplicate
 * @param {Function} callback
 */
module.exports = function(original, duplicate, callback) {
    if (!modelHelper.sameIds(duplicate.theatre, original.theatre)) {
        return callback(new Error('Можно поглотить только спектаклем из того-же театра.'));
    }
    absorbDuplicate(original, duplicate, function(err) {
        if (err) return callback(err);
        Schedule.replacePlay(duplicate.id, original.id, callback);
    });
};

function absorbDuplicate(original, duplicate, callback) {
    original.url = original.url || duplicate.url;
    original.director = original.director || duplicate.director;
    original.author = original.author || duplicate.author;
    original.genre = original.genre || duplicate.genre;
    original.duration = original.duration || duplicate.duration;
    original.description = original.description || duplicate.description;
    original.image = original.image || duplicate.image;
    original.addTags(duplicate.tags);
    original.save(function(err) {
        if (err) return callback(err);
        duplicate.remove(callback);
    });
}
