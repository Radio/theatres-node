"use strict";

const Show = require('domain/models/show');

/**
 * Add single show and save schedule.
 *
 * @param {Object} schedule
 * @param {Object} addRequest
 * @param {Function} callback
 */
module.exports = (schedule, addRequest, callback) => {
    let show = new Show();
    show.edit(addRequest, function(err) {
        if (err) return callback(err);
        schedule.addShow(show, callback);
    });
};