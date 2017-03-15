"use strict";

const async = require('async');
const Show = require('domain/models/show');
const resolve = require('fetching/commands/schedule/resolve');
const update = require('fetching/commands/schedule/update');

/**
 * Update the schedule records with the new shows.
 *
 * @param {Array} mappedShowsData
 * @param {Function} callback
 *
 * @return void
 */
module.exports = function(mappedShowsData, callback) {
    let groupedShowsData = groupByMonth(mappedShowsData);
    async.each(groupedShowsData, function(monthlyScheduleData, callback) {
        resolve(monthlyScheduleData.month, monthlyScheduleData.year, function(err, schedule) {
            if (err) return callback(err);
            update(schedule, monthlyScheduleData.shows, callback);
        });
    }, callback);
};

/**
 * Group plain array with shows by month.
 *
 * @param mappedShowsData
 *
 * @return {Object}
 */
let groupByMonth = function(mappedShowsData) {
    return mappedShowsData.reduce(function(grouped, showData) {
        const monthKey = showData.date.getMonth() + '-' + showData.date.getFullYear();
        grouped[monthKey] = grouped[monthKey] || {
                month: showData.date.getMonth(),
                year: showData.date.getFullYear(),
                shows: []
            };
        grouped[monthKey].shows.push(new Show(showData));
        return grouped;
    }, {});
};
