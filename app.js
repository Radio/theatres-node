"use strict";

require('dotenv').config();
require('app-module-path').addPath('./app');

let express = require('express');
let path = require('path');
let favicon = require('serve-favicon');
let logger = require('morgan');
let cookieParser = require('cookie-parser');
let session = require('express-session');
let MongoStore = require('connect-mongo')(session);
let flash = require('connect-flash');
let bodyParser = require('body-parser');
let mongoose = require('mongoose');
let passport = require('passport');
let passportStrategy = require('authentication/authentication-strategy-local');
let serializationStrategy = require('authentication/serialization-strategy');

/**
 * 1. Setup mongo connection.
 */

if (!process.env.MONGO_URL) {
    console.log('Mongo URL is not set in env variables.');
    process.exit(1);
}

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGO_URL);


/**
 * 2. Setup app.
 */

let app = express();

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
    cookie: { maxAge: 1209600000 },
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET,
    store: new MongoStore({ mongooseConnection: mongoose.connection })
}));
app.use(flash());
app.use(function(req, res, next){
    res.locals.flash = {
        success: req.flash('success'),
        error: req.flash('error'),
    };
    next();
});

let s = require('underscore.string');
let moment = require('moment');
moment.locale('ru');
app.use(function(req, res, next) {
    res.locals.s = s;
    res.locals.moment = moment;
    next();
});

/**
 * 3. Setup admin authentication.
 */

passport.use(passportStrategy);
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(serializationStrategy.serializeUser);
passport.deserializeUser(serializationStrategy.deserializeUser);
app.use(function(req, res, next) {
    res.locals.user = req.user;
    next();
});

/**
 * 4. Setup app routes
 */

let month = require('routes/month');
let admin = require('routes/admin');
app.use('/', month);
app.use('/admin', admin);
if (process.env.RUN_TELEGRAM_BOT === 'yes') {
    let bot = require('routes/bot');
    app.use('/bot', bot);
}

/**
 * 5. Setup error handlers
 */

app.use(function(err, req, res, next) {
    if (err instanceof Error) {
        if (err.name === 'ValidationError') {
            let errorMessage = err.message;
            for (let fieldName in err.errors) {
                if (err.errors.hasOwnProperty(fieldName)) {
                    errorMessage += '<br>' + String(err.errors[fieldName])
                }
            }
            req.flash('error', errorMessage);
            req.flash('body', req.body);
            res.redirect(req.originalUrl);
            return;
        }
    }
    next(err);
});

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
