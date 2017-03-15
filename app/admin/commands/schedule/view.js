"use strict";

let Schedule = require('domain/models/schedule');

module.exports = (month, year, filter, callback) => {
    return Schedule.findOne(buildConditions(month, year, filter))
        .populate('shows.scene shows.theatre')
        .populate({
            path: 'shows.play',
            populate: { path: 'theatre' }
        })
        .exec(callback);
};

function buildConditions(month, year, filter) {
    let conditions = {
        month: month,
        year: year
    };
    if (filter.version) {
        conditions.version = filter.version;
    } else {
        conditions.actual = true;
    }

    return conditions;
}