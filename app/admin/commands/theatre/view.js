"use strict";

const Theatre = require('domain/models/theatre');

module.exports = (key, callback) => Theatre.findByKey(key, callback);