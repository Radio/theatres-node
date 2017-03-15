"use strict";

const async = require('async');
const express = require('express');
const router = express.Router({mergeParams: true});

const view = require('admin/commands/play/view');
const listPlays = require('admin/commands/play/list');
const listTheatres = require('admin/commands/theatre/list');
const listScenes = require('admin/commands/scene/list');

router.param('playKey', function(req, res, next, key) {
    view(key, function(err, play) {
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
        theatres: callback => listTheatres(callback),
        scenes: callback => listScenes(callback),
        plays: callback => listPlays({}, callback)
    }, callback);
}


require('./plays/list')(router);
require('./plays/edit')(router);
require('./plays/hide')(router);
require('./plays/remove')(router);
require('./plays/absorb')(router);
require('./plays/move')(router);

module.exports = router;
