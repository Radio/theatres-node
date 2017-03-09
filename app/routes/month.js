"use strict";

let express = require('express');
let router = express.Router();
let async = require('async');
let moment = require('moment');
let Theatre = require('models/theatre');
let Schedule = require('models/schedule');
let dateHelper = require('helpers/date');

router.get('/', monthMiddleware);
router.get('/year/:year/month/:month', monthMiddleware);
router.get('/theatre/:theatre', monthMiddleware);
router.get('/theatre/:theatre/year/:year/month/:month', monthMiddleware);

function monthMiddleware(req, res, next) {
    let today = moment();
    let nextMonth = moment().startOf('month').add(1, 'months');
    let filter = collectFilter(req);
    async.parallel({
        days: callback => callback(null, dateHelper.getMonthDays(filter.month, filter.year)),
        theatre: callback => filter.theatre ? Theatre.findByKey(filter.theatre, callback) : callback(),
        schedule: callback => Schedule.findByMonthAndYear(filter.month, filter.year)
            .populate('shows.scene shows.theatre')
            .populate({
                path: 'shows.play',
                populate: [{ path:'scene' }, { path:'theatre' }]
            })
            .exec(callback)
    }, function (err, result) {
        if (err) return next(err);
        if (!result.schedule) return next();

        const scheduleMonth = moment().startOf('month')
            .month(result.schedule.month).year(result.schedule.year);

        let days = populateDaysWithShows(result.days, filterShows(result.schedule.shows, filter));

        res.render('front/month', {
            days: days,
            schedule: result.schedule,
            theatre: result.theatre,
            filter: filter,
            today: today,
            nextMonth: nextMonth,
            scheduleMonth: scheduleMonth,
            calendar: dateHelper.getCalendarDays(result.days),
            showFilterClasses: showFilterClasses
        });
    });

    function filterShows(shows, filter) {
        if (!filter.theatre) {
            return shows;
        }
        return shows.filter(show => show.get('play.theatre.key') === filter.theatre);
    }

    function populateDaysWithShows(days, shows) {
        return days.map(function(day) {
            day.shows = shows.filter(show => show.isPubliclyVisible() && day.isSame(show.date, 'day'));
            return day;
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
