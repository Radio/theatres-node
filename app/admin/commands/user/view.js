"use strict";

const User = require('domain/models/user');

module.exports = (id, callback) => User.findById(id, callback);