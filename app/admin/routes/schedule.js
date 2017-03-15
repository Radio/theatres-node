"use strict";

const async = require('async');
const moment = require('moment');
const s = require('underscore.string');
const express = require('express');
const router = express.Router({mergeParams: true});

const Schedule = require('domain/models/schedule');
const Theatre = require('domain/models/theatre');
const Scene = require('domain/models/scene');
const Play = require('domain/models/play');

const viewToEdit = require('admin/commands/schedule/view-to-edit');
const listLabels = require('admin/commands/schedule/labels/list');

router.get(/\/.*/, function(req, res, next) {
    loadOptionsData(function (err, options) {
        if (err) return next(err);
        req.options = options;
        next();
    });
});

router.param('scheduleId', function(req, res, next, id) {
    viewToEdit(id, function(err, schedule) {
        if (err) return next(err);
        req.schedule = schedule;
        next();
    });
});

router.param('showId', function(req, res, next, id) {
    if (!req.schedule) return next();
    req.show = req.schedule.shows.find(show => String(show.id) === id);
    next();
});

require('./schedule/view')(router);
require('./schedule/show')(router);
require('./schedule/diff')(router);

function loadOptionsData(callback) {
    const passedMonths = 11;
    const followingMonths = 3;
    async.parallel({
        theatres: callback => Theatre.find({}).sort({title: 1}).exec(callback),
        scenes: callback => Scene.find({}).sort({title: 1}).exec(callback),
        plays: callback => Play.find({}).populate('theatre scene').sort({title: 1}).exec(callback),
        labels: callback => listLabels(callback),
        months: callback => callback(null, Array.from(monthOptions(passedMonths, followingMonths)))
    }, callback);
}

function* monthOptions(passedMonths, followingMonths) {
    let actualKey = moment().format('MM-YYYY');
    let date = moment();
    date.add(followingMonths, 'months');
    let totalMonths = passedMonths + followingMonths + 1;
    while (totalMonths--) {
        yield {
            key: date.format('MM-YYYY'),
            value: s.capitalize(date.format('MMMM YYYY')),
            actual: date.format('MM-YYYY') === actualKey
        };
        date.subtract(1, 'months');
    }
}

module.exports = router;
