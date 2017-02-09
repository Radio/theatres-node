"use strict";

let express = require('express');
let router = express.Router();
let async = require('async');
let moment = require('moment');
let s = require('underscore.string');
let Schedule = require('models/schedule');
let Scene = require('models/scene');
let dateHelper = require('helpers/date');

/* GET users listing. */
router.get('/', function(req, res, next) {
    let today = moment();
    let nextMonth = moment().add(1, 'months');
    let filter = collectFilter(req.query);
    loadOptionsData(filter.month, filter.year, function(err, options) {
        if (err) return next(err);
        Schedule.findOne(filter)
            .populate('shows.theatre shows.scene shows.play')
            .exec(function (err, schedule) {
                if (err) return next(err);

                let days = dateHelper.getMonthDays(filter.month, filter.year);
                days.forEach(function(day) {
                    day.shows = schedule.shows.filter(show => day.isSame(show.date, 'day'));
                });
                options.calendar = dateHelper.getCalendarDays(days);

                res.render('front/month', {
                    schedule: schedule,
                    filter: filter,
                    today: today,
                    nextMonth: nextMonth,
                    days: days,
                    options: options,
                    title: {
                        currentMonth: s.capitalize(today.format('MMMM')),
                        nextMonth: s.capitalize(nextMonth.format('MMMM') +
                            (nextMonth.month() === 0 ? ' ' + nextMonth.year() : '')),
                        theatre: ''
                    }
                });
            });
    });
});


function loadOptionsData(month, year, callback) {
    async.parallel({
        scenes: callback => Scene.find({}).sort({title: 1}).exec(callback),
    }, callback);
}

function collectFilter(filterQuery) {
    let today = moment();
    let filter = {
        actual: true,
        month: today.month(),
        year: today.year(),
    };
    return filter;
}

module.exports = router;
