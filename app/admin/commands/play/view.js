"use strict";

const Play = require('domain/models/play');

module.exports = (key, callback) => Play.findByKey(key).populate('theatre scene').exec(callback);