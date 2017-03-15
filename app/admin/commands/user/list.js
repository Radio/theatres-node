"use strict";

const User = require('domain/models/user');

module.exports = (callback) => User.find({}).sort({title: 1}).exec(callback);