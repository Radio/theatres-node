"use strict";

let User = require('models/user');

module.exports = {
    serializeUser: function(user, done) {
        done(null, user.id);
    },
    deserializeUser: function(id, done) {
        User.findOne({_id: id}, function(err, user) {
            done(err, user);
        });
    }
};