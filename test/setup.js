"use strict";

require('app-module-path').addPath('./app');
require('dotenv').config({path: './.env.test'});

if (!process.env.MONGO_URL) {
    console.log('Mongo URL is not set in env variables.');
    process.exit(1);
}

let mongoose = require('mongoose');
mongoose.Promise = global.Promise;

module.exports.connectToMongo = function() {
    mongoose.connect(process.env.MONGO_URL);
};

module.exports.disconnectFromMongo = function() {
    mongoose.disconnect();
};