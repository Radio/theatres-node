"use strict";

const Play = require('domain/models/play');
const modelHelper = require('helpers/model');
let shortid = require('shortid');

/**
 * Change the theatre for given play.
 * Make a copy of the play in the original theatre and map it with the original play.
 *
 * @param {Play} play
 * @param {ObjectId} newTheatreId
 * @param {Function} callback
 */
module.exports = function(play, newTheatreId, callback) {
    const originalTheatreId = modelHelper.getId(play.theatre);
    play.theatre = newTheatreId;
    play.save(function(err) {
        if (err) return callback(err);
        let duplicate = new Play({
            title: play.title,
            theatre: originalTheatreId,
            scene: play.scene,
            key: play.key + '-' + shortid.generate() + '-duplicate',
            tags: play.tags,
            mapAs: play
        });
        duplicate.save(callback);
    });
};