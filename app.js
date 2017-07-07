"use strict";

const path = require('path');

require('dotenv').config();
require('app-module-path').addPath('./app');

/**
 * Setup mongo connection
 */
if (!process.env.MONGO_URL) {
    console.error('Mongo URL is not set in env variables.');
    process.exit(1);
}

const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGO_URL);

/**
 * Setup app
 */
const express = require('express');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const bodyParser = require('body-parser');

const app = express();

// view engine setup
app.set('environment', process.env.ENVIRONMENT);
app.set('views', [
    path.join(__dirname, 'app', 'views'),
    path.join(__dirname, 'app', 'front', 'views'),
    path.join(__dirname, 'app', 'admin', 'views'),
]);
app.set('view engine', 'pug');

app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.png')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public'), { dotfiles: 'allow' }));
app.use(session({
    cookie: { maxAge: 1209600000 },
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET,
    store: new MongoStore({ mongooseConnection: mongoose.connection })
}));

const s = require('underscore.string');
const moment = require('moment');
moment.locale('ru');
app.use(function(req, res, next) {
    res.locals.s = s;
    res.locals.moment = moment;
    next();
});


/**
 * Setup components
 */
require('front/setup')(app);
require('admin/setup')(app);
if (process.env.RUN_BOTS === 'yes') {
    require('bots/setup')(app);
}

/**
 * Setup error handlers
 */

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

/**
 * Done.
 */

module.exports = app;
