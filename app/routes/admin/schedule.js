"use strict";

let async = require('async');
let moment = require('moment');
let s = require('underscore.string');
let express = require('express');
let router = express.Router({mergeParams: true});

let Schedule = require('models/schedule');
let Theatre = require('models/theatre');
let Scene = require('models/scene');

router.get(/\/.*/, function(req, res, next) {
    loadOptionsData(function (err, options) {
        if (err) return next(err);
        req.options = options;
        next();
    });
});

router.get('/', function(req, res, next) {
    let filter = collectFilter(req.query);
    Schedule.findOne(filter)
        .populate('shows.theatre shows.scene shows.play')
        .exec(function (err, schedule) {
            if (err) return next(err);
            if (schedule) {
                schedule.shows = filterScheduleShows(schedule, req);
            }
            res.render('admin/schedule/view', {
                title: 'Управление — Расписание',
                schedule: schedule,
                filter: req.query,
                theatres: req.options.theatres,
                scenes: req.options.scenes,
                months: req.options.months,
            });
        });
});

function filterScheduleShows(schedule, req) {
    return schedule.shows.filter(function (show) {
        return (!req.query.theatre || req.query.theatre === String(show.theatre.id)) &&
            (!req.query.scene || req.query.scene === String(show.scene.id))
    });
}

function loadOptionsData(callback) {
    let date = moment();
    let months = {};
    let n = 12;
    while (n--) {
        months[date.format('MM-YYYY')] = s.capitalize(date.format('MMMM YYYY'));
        date.subtract(1, 'months');
    }
    async.parallel({
        theatres: callback => Theatre.find({}).sort({title: 1}).exec(callback),
        scenes: callback => Scene.find({}).sort({title: 1}).exec(callback),
        months: callback => callback(null, months)
    }, callback);
}

function collectFilter(filterQuery) {
    const today = new Date();
    let filter = {
        month: today.getMonth(),
        year: today.getFullYear(),
    };
    if (filterQuery.month) {
        [filter.month, filter.year] = filterQuery.month.split('-');
        filter.month--;
    }
    if (filterQuery.theatre) {
        // filter.theatre = filterQuery.theatre;
    }
    if (filterQuery.scene) {
        // filter.scene = filterQuery.scene;
    }
    return filter;
}


module.exports = router;
