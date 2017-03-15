"use strict";

const Schedule = require('domain/models/schedule');

/**
 * Resolve schedule by given month and year.
 * If schedule doesn't exist it will be created.
 *
 * @param {Number} month
 * @param {Number} year
 * @param {Function} callback
 */
module.exports = (month, year, callback) => {
    Schedule.findByMonthAndYear(month, year, function(err, schedule) {
        if (err) return callback(err);
        if (!schedule) {
            schedule = Schedule.createForMonthAndYear(month, year, callback);
            schedule.save(function(err) {
                if (err) return callback(err);
                callback(null, schedule);
            });
            return;
        }
        callback(null, schedule);
    });
};