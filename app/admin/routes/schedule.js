"use strict";

const async = require('async');
const moment = require('moment');
const s = require('underscore.string');
const express = require('express');
const router = express.Router({mergeParams: true});

const viewToEdit = require('admin/commands/schedule/view-to-edit');
const viewShow = require('admin/commands/schedule/show/view');
const listLabels = require('admin/commands/schedule/labels/list');
const listPlays = require('admin/commands/play/list');
const listTheatres = require('admin/commands/theatre/list');
const listScenes = require('admin/commands/scene/list');

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
    viewShow(req.schedule, id, (err, show) => {
        if (err) return next(err);
        req.show = show;
        next();
    });
});

require('./schedule/view')(router);
require('./schedule/show')(router);
require('./schedule/diff')(router);

function loadOptionsData(callback) {
    const passedMonths = 11;
    const followingMonths = 3;
    async.parallel({
        theatres: callback => listTheatres(callback),
        scenes: callback => listScenes(callback),
        plays: callback => listPlays({}, callback),
        labels: callback => listLabels(callback),
        months: callback => callback(null, Array.from(monthOptions(passedMonths, followingMonths)))
    }, callback);
}

function* monthOptions(passedMonths, followingMonths) {
    let currentMonthKey = moment().format('MM-YYYY');
    let date = moment();
    date.add(followingMonths, 'months');
    let totalMonths = passedMonths + followingMonths + 1;
    while (totalMonths--) {
        yield {
            key: date.format('MM-YYYY'),
            value: s.capitalize(date.format('MMMM YYYY')),
            actual: date.format('MM-YYYY') === currentMonthKey
        };
        date.subtract(1, 'months');
    }
}

module.exports = router;
