"use strict";

const Schedule = require('domain/models/schedule');
const botHelper = require('../helper');

class ScheduleBot {
    today(callback) {
        return this.onDate(new Date(), callback);
    }
    tomorrow(callback) {
        let tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return this.onDate(tomorrow, callback);
    }
    onDate(dateCandidate, callback) {
        let date = dateCandidate instanceof Date ? dateCandidate : botHelper.parsePosterDate(dateCandidate);
        date.setHours(0, 0, 0, 0);
        findSchedule(date, function(err, schedule) {
            if (err) callback(err);
            if (!schedule) {
                return callback(null, { date: date });
            }
            callback(null, {
                date: date,
                shows: schedule.shows.filter(show => {
                    return show.isPubliclyVisible() && date.getTime() === new Date(show.date).setHours(0, 0, 0, 0)
                })
            });
        });
    }
}

function findSchedule(date, callback) {
    return Schedule.findByMonthAndYear(date.getMonth(), date.getFullYear())
        .populate('shows.scene shows.theatre')
        .populate({
            path: 'shows.play',
            populate: [{ path:'scene' }, { path:'theatre' }]
        }).exec(callback)
}

module.exports = ScheduleBot;