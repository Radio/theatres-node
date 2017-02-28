"use strict";

let async = require('async');
let moment = require('moment');
let s = require('underscore.string');
let express = require('express');
let router = express.Router({mergeParams: true});

let Schedule = require('models/schedule');
let Theatre = require('models/theatre');
let Scene = require('models/scene');
let Play = require('models/play');

router.get(/\/.*/, function(req, res, next) {
    const filter = collectFilter(req.query);
    req.filter = filter;
    loadOptionsData(filter.month, filter.year, function (err, options) {
        if (err) return next(err);
        req.options = options;
        next();
    });
});

router.param('scheduleId', function(req, res, next, id) {
    Schedule.findOne({_id: id, actual: true})
        .populate('shows.scene')
        .populate({
            path: 'shows.play',
            populate: { path: 'theatre' }
        })
        .exec(function(err, schedule) {
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

function collectFilter(filterQuery) {
    const today = new Date();
    let filter = {
        actual: true,
        month: today.getMonth(),
        year: today.getFullYear(),
    };
    if (filterQuery.version) {
        delete filter.actual;
        filter.version = filterQuery.version;
    }
    if (filterQuery.month) {
        [filter.month, filter.year] = filterQuery.month.split('-');
        filter.month--;
    }
    return filter;
}

function loadOptionsData(month, year, callback) {
    const passedMonths = 11;
    const followingMonths = 3;
    async.parallel({
        theatres: callback => Theatre.find({}).sort({title: 1}).exec(callback),
        scenes: callback => Scene.find({}).sort({title: 1}).exec(callback),
        plays: callback => Play.find({}).populate('theatre scene').sort({title: 1}).exec(callback),
        versions: callback => Schedule.find({ month: month, year: year }, { version: 1, actual: 1 })
            .sort({ version: -1 }).exec(callback),
        months: callback => callback(null, Array.from(monthOptions(passedMonths, followingMonths))),
        labels: callback => Schedule.getActualLabels(callback)
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

require('./schedule/view')(router);
require('./schedule/show')(router);
require('./schedule/diff')(router);

module.exports = router;
