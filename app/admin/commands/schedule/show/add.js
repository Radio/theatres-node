"use strict";

const Show = require('domain/models/show');
const edit = require('admin/commands/show/edit');

/**
 * Add single show and save schedule.
 *
 * @param {Object} schedule
 * @param {Object} addRequest
 * @param {Function} callback
 */
module.exports = (schedule, addRequest, callback) => {
    let show = new Show();
    edit(show, addRequest, function(err) {
        if (err) return callback(err);
        schedule.addShow(show, callback);
    });
};