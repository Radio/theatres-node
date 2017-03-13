"use strict";

let LocalStrategy = require('passport-local').Strategy;
let User = require('domain/models/user');

module.exports = new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    }, function(email, password, done) {
        User.findByEmail(email, function(err, person) {
            if (err) {
                return done(err);
            }
            if (!person) {
                return done(null, false, { message: 'Incorrect username or password.' });
            }
            person.verifyPassword(password, function(err, result) {
                if (err) return done(err);
                if (!result) {
                    return done(null, false, { message: 'Incorrect username or password.' });
                }
                done(null, person);
            });
        });
    }
);