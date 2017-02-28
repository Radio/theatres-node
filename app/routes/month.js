"use strict";

let express = require('express');
let router = express.Router();
let async = require('async');
let moment = require('moment');
let Schedule = require('models/schedule');
let dateHelper = require('helpers/date');

router.get('/', monthMiddleware);
router.get('/year/:year/month/:month', monthMiddleware);
router.get('/year/:year/month/:month/theatre/:theatre', monthMiddleware);

function monthMiddleware(req, res, next) {
    let today = moment();
    let nextMonth = moment().startOf('month').add(1, 'months');
    let filter = collectFilter(req);
    async.parallel({
        days: callback => callback(null, dateHelper.getMonthDays(filter.month, filter.year)),
        schedule: callback => Schedule.findByMonthAndYear(filter.month, filter.year)
            .populate('shows.scene')
            .populate({
                path: 'shows.play',
                populate: [{ path:'scene' }, { path:'theatre' }]
            })
            .exec(callback)
    }, function (err, result) {
        if (err) return next(err);
        if (!result.schedule) return next();

        const schedule = result.schedule;
        const scheduleMonth = moment().startOf('month').month(schedule.month).year(schedule.year);

        populateDaysWithShows(result.days, schedule.shows);

        res.render('front/month', {
            schedule: schedule,
            filter: filter,
            today: today,
            nextMonth: nextMonth,
            scheduleMonth: scheduleMonth,
            days: result.days,
            calendar: dateHelper.getCalendarDays(result.days),
            showFilterClasses: showFilterClasses
        });
    });

    function populateDaysWithShows(days, shows) {
        days.forEach(function(day) {
            day.shows = shows.filter(show => show.isPubliclyVisible() && day.isSame(show.date, 'day'));
        });
    }

    function showFilterClasses(show) {
        let classes = [];

        (show.play.musical || show.play.dancing || show.play.ballet) && classes.push('musical');
        (show.play.dancing || show.play.ballet) && classes.push('dancing');
        show.play.ballet && classes.push('ballet');
        show.play.opera && classes.push('opera');
        classes.length === 0 && classes.push('other');

        show.play.premiere && classes.push('premiere');
        show.play.forKids ? classes.push('for-kids') : classes.push('for-adults');

        classes.push('theatre-' + show.play.theatre.key);

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

    function collectFilter(req) {
        let today = moment();
        let filter = {
            month: today.month(),
            year: today.year(),
        };
        if (req.params.month) {
            filter.month = req.params.month - 1;
        }
        if (req.params.year) {
            filter.year = req.params.year;
        }
        if (req.params.theatre) {
            filter.theatre = req.params.theatre;
        }
        return filter;
    }
}

module.exports = router;
