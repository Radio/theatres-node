"use strict";

const Schedule = require('domain/models/schedule');

/**
 * Retrieve labels from all shows in actual schedules.
 *
 * @param {Function} callback
 *
 * @return {Aggregate|Promise}
 */
module.exports = function(callback) {
    return Schedule.aggregate([
        { $match: { actual: true } },
        { $unwind: "$shows" },
        { $unwind: "$shows.labels" },
        { $project: { "label": "$shows.labels" } },
        { $group: { _id: 'all', labels: { $addToSet: '$label' } } }
    ], function(err, result) {
        if (err) return callback(err);
        if (!result || result.length === 0) {
            return callback(null, []);
        }
        callback(null, result[0].labels);
    });
};