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
router.get('/', monthMiddleware);
router.get('/year/:year/month/:month', monthMiddleware);
router.get('/year/:year/month/:month/theatre/:theatre', monthMiddleware);

function monthMiddleware(req, res, next) {
    let today = moment();
    let nextMonth = moment().startOf('month').add(1, 'months');
    let filter = collectFilter(req);
    async.parallel({
        days: callback => callback(null, dateHelper.getMonthDays(filter.month, filter.year)),
        scenes: callback => Scene.find({}).sort({title: 1}).exec(callback),
        schedule: callback => Schedule.findOne(filter)
            .populate('shows.theatre shows.scene')
            .populate({
                path: 'shows.play',
                populate: { path:'scene' }
            })
            .exec(callback)
    }, function (err, result) {
        if (err) return next(err);
        let schedule = result.schedule;
        if (!schedule) return next();

        result.days.forEach(function(day) {
            day.shows = schedule.shows.filter(show => show.isPubliclyVisible() && day.isSame(show.date, 'day'));
        });
        if (req.params.theatre) {
            filter.theatre = req.params.theatre;
        }

        let scheduleMonth = moment().startOf('month').month(schedule.month).year(schedule.year);

        res.render('front/month', {
            schedule: schedule,
            filter: filter,
            today: today,
            nextMonth: nextMonth,
            scheduleMonth: scheduleMonth,
            days: result.days,
            options: {
                scenes: result.scenes,
                calendar: dateHelper.getCalendarDays(result.days)
            },
            title: {
                currentMonth: s.capitalize(today.format('MMMM')),
                nextMonth: s.capitalize(nextMonth.format('MMMM') +
                    (nextMonth.year() !== today.year() ? ' ' + nextMonth.year() : '')),
                scheduleMonth: s.capitalize(scheduleMonth.format('MMMM') +
                    (scheduleMonth.year() !== today.year() ? ' ' + scheduleMonth.year() : '')),
                theatre: ''
            },
            showFilterClasses: function(show) {
                let classes = [];

                (show.play.musical || show.play.dancing || show.play.ballet) && classes.push('musical');
                (show.play.dancing || show.play.ballet) && classes.push('dancing');
                show.play.ballet && classes.push('ballet');
                show.play.opera && classes.push('opera');
                classes.length === 0 && classes.push('other');

                show.play.premiere && classes.push('premiere');
                show.play.forKids ? classes.push('for-kids') : classes.push('for-adults');

                classes.push('theatre-' + show.theatre.key);

                let scene = show.scene || show.play.scene;
                if (['big', 'small', 'exp'].indexOf(scene.key) >=0) {
                    classes.push('scene-' + scene.key);
                } else if (scene.key === 'main') {
                    classes.push('scene-big');
                } else {
                    classes.push('scene-other');
                }

                return classes.join(' ');
            }
        });
    });
}

function collectFilter(req) {
    let today = moment();
    let filter = {
        actual: true,
        month: today.month(),
        year: today.year(),
    };
    if (req.params.month) {
        filter.month = req.params.month - 1;
    }
    if (req.params.year) {
        filter.year = req.params.year;
    }
    return filter;
}

module.exports = router;
