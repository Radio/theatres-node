"use strict";

const Play = require('domain/models/play');

module.exports = (schedule, showId, callback) => callback(null, schedule.findShow(showId));