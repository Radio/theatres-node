"use strict";

const Schedule = require('domain/models/schedule');

module.exports = (month, year, callback) => {
    return Schedule
        .find({ month: month, year: year }, { version: 1, actual: 1 })
        .sort({ version: -1 })
        .exec(callback)
};