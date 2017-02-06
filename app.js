"use strict";

require('dotenv').config();
require('app-module-path').addPath('./app');

let express = require('express');
let path = require('path');
let favicon = require('serve-favicon');
let logger = require('morgan');
let cookieParser = require('cookie-parser');
let session = require('express-session');
let flash = require('connect-flash');
let bodyParser = require('body-parser');
let mongoose = require('mongoose');

let app = express();

/**
 * 1. Setup app.
 */

// view engine setup
app.set('environment', process.env.ENVIRONMENT);
app.set('views', path.join(__dirname, 'app/views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    cookie: { maxAge: 60000 },
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET
}));
app.use(flash());
app.use(function(req, res, next){
    res.locals.flash = {
        success: req.flash('success'),
        error: req.flash('error'),
    };
    next();
});

/**
 * 2. Setup mongo connection.
 */

if (!process.env.MONGO_URL) {
    console.log('Mongo URL is not set in env variables.');
    process.exit(1);
}

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGO_URL);

/**
 * 3. Setup app routes
 */

let month = require('routes/month');
let admin = require('routes/admin');
app.use('/', month);
app.use('/admin', admin);

/**
 * 4. Setup error handlers
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
