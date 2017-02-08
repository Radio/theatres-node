"use strict";

let express = require('express');
let router = express.Router();
let Schedule = require('models/schedule');
let dateHelper = require('helpers/date');

/* GET users listing. */
router.get('/', function(req, res, next) {
    let filter = collectFilter(req.query);
    Schedule.findOne(filter)
        .populate('shows.theatre shows.scene shows.play')
        .exec(function (err, schedule) {
            if (err) return next(err);

            let days = dateHelper.getMonthDays(filter.month + 1, filter.year);
            days.forEach(function(day) {
                day.shows = getShowsOnDay(day, schedule.shows);
            });

            res.render('front/month', {
                schedule: schedule,
                filter: filter,
                days: days,
                isToday: function(date) {
                    return dateHelper.datesAreEqual(date, dateHelper.getCurrentDate());
                },
                isCurrentMonth: function() {
                    return dateHelper.getCurrentMonth() - 1 === filter.month;
                },
                dateHelper: dateHelper,
                title: {
                    first: 'Все спектакли Харькова на одной странице',
                    currentMonth: dateHelper.getMonthTitle(dateHelper.getCurrentMonth()),
                    nextMonth: (function () {
                        const nextMonth = dateHelper.getNextMonth();
                        const month = dateHelper.getMonthTitle(nextMonth);

                        return month + (nextMonth > 1 ? '' : ' ' + dateHelper.getCurrentYear() + 1);
                    })(),
                    theatre: ''
                }
            });
        });

});

function getShowsOnDay(date, shows) {
    let showsOnDay = [];
    for (let i = 0; i < shows.length; i++) {
        if (dateHelper.datesAreEqual(shows[i].date, date)) {
            showsOnDay.push(shows[i]);
        }
    }
    return showsOnDay;
}

function collectFilter(filterQuery) {
    let filter = {
        actual: true,
        month: dateHelper.getCurrentMonth() - 1,
        year: dateHelper.getCurrentYear(),
    };
    return filter;
}

module.exports = router;
