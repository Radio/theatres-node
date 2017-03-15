"use strict";

const Theatre = require('domain/models/theatre');

module.exports = (callback) => Theatre.find({}).sort({title: 1}).exec(callback);