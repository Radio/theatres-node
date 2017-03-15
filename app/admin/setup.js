"use strict";

const flash = require('connect-flash');
const passport = require('passport');
const passportStrategy = require('./authentication/authentication-strategy-local');
const serializationStrategy = require('./authentication/serialization-strategy');
const validationErrorHandler = require('./error-handlers/validation');
const mongoErrorHandler = require('./error-handlers/mongo');

const errorHandlersMap = {
    'ValidationError': validationErrorHandler,
    'MongoError': mongoErrorHandler,
};

module.exports = function(app) {
    passport.use(passportStrategy);
    passport.serializeUser(serializationStrategy.serializeUser);
    passport.deserializeUser(serializationStrategy.deserializeUser);
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(function(req, res, next) {
        res.locals.user = req.user;
        next();
    });

    app.use(flash());
    app.use(function(req, res, next){
        res.locals.flash = {
            success: req.flash('success'),
            error: req.flash('error'),
        };
        next();
    });


    app.use('/admin', require('admin/routes'));

    app.use(function(err, req, res, next) {
        if (err instanceof Error && err.name && errorHandlersMap[err.name]) {
            return errorHandlersMap[err.name](err, req, res);
        }
        next(err);
    });
};