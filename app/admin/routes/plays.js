"use strict";

let async = require('async');
let express = require('express');
let router = express.Router({mergeParams: true});

let Play = require('domain/models/play');
let Theatre = require('domain/models/theatre');
let Scene = require('domain/models/scene');

router.param('playKey', function(req, res, next, key) {
    Play.findByKey(key)
        .populate('theatre scene')
        .exec(function(err, play) {
            if (err) return next(err);
            req.play = play;
            next();
        });
});

router.get(/\/.*/, function(req, res, next) {
    loadOptionsData(function (err, options) {
        if (err) return next(err);
        req.options = options;
        next();
    });
});

function loadOptionsData(callback) {
    async.parallel({
        theatres: callback => Theatre.find({}).sort({title: 1}).exec(callback),
        scenes: callback => Scene.find({}).sort({title: 1}).exec(callback),
        plays: callback => Play.find({}).populate('theatre').sort({title: 1}).exec(callback)
    }, callback);
}


require('./plays/list')(router);
require('./plays/edit')(router);
require('./plays/hide')(router);
require('./plays/remove')(router);
require('./plays/absorb')(router);
require('./plays/move')(router);

module.exports = router;
