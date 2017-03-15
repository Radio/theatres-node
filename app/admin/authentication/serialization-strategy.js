"use strict";

const User = require('domain/models/user');

module.exports = {
    serializeUser: (user, done) => done(null, user.id),
    deserializeUser: (id, done) => User.findById(id, done),
};