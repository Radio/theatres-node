"use strict";

const User = require('domain/models/user');

module.exports = (key, callback) => User.findByKey(key, callback);