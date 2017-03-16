"use strict";

const edit = require('admin/commands/show/edit');

/**
 * Edit single show and save schedule.
 *
 * @param {Object} schedule
 * @param {String} showId
 * @param {Object} editRequest
 * @param {Function} callback
 */
module.exports = (schedule, showId, editRequest, callback) => {
    let show = schedule.shows.find(show => String(show._id) === String(showId));
    if (!show) {
        return callback(new Error('There is no show with ID=' + showId + ' in this schedule.'));
    }
    edit(show, editRequest, function(err) {
        if (err) return callback(err);
        schedule.updateShow(show, callback);
    });
};