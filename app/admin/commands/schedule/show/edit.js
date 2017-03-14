"use strict";

const Show = require('domain/models/show');

/**
 * Edit single show and save schedule.
 *
 * @param {Object} schedule
 * @param {String} showId
 * @param {Object} editRequest
 * @param {Function} callback
 */
module.exports = (schedule, showId, editRequest, callback) => {
    let showInSchedule = schedule.shows.find(show => String(show._id) === String(showId));
    if (!showInSchedule) {
        return callback(new Error('There is no show with ID=' + showId + ' in this schedule.'));
    }
    // Create a clone of show in order to leave schedule unmodified when the show is modified (for correct diff).
    let show = new Show(showInSchedule.toObject({depopulate: true}));
    show.edit(editRequest, function(err) {
        if (err) return callback(err);
        schedule.updateShow(show, callback);
    });
};