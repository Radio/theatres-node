"use strict";

let Schedule = require('domain/models/schedule');
let modelHelper = require('helpers/model');

module.exports = function(router) {
    router.get('/', function (req, res, next) {
        if (!req.filter) return next();
        req.session.scheduleBackUrl = req.originalUrl;
        loadSchedule(req.filter).then(function (schedule) {
            if (schedule) {
                schedule.shows = filterScheduleShows(schedule, collectShowsFilter(req));
            }
            let viewFilter = req.query;
            viewFilter.month = viewFilter.month || schedule.monthKey;
            res.render('schedule/view', {
                title: 'Расписание',
                schedule: schedule,
                filter: viewFilter,
                theatres: req.options.theatres,
                scenes: req.options.scenes,
                months: req.options.months,
                versions: req.options.versions,
                backUrl: req.session.scheduleBackUrl
            });
        }, err => next(err));
    });

    function loadSchedule(filter, callback) {
        return Schedule.findOne(filter)
            .populate('shows.scene shows.theatre')
            .populate({
                path: 'shows.play',
                populate: { path: 'theatre' }
            })
            .exec(callback);
    }

    function filterScheduleShows(schedule, filter) {
        if (!filter.theatre && !filter.scene) {
            return schedule.shows;
        }
        return schedule.shows.filter(function (show) {
            const scene = show.scene || show.play.scene;
            return (!filter.theatre || modelHelper.sameIds(filter.theatre, show.play.theatre)) &&
                (!filter.scene || modelHelper.sameIds(filter.scene, scene))
        });
    }

    function collectShowsFilter(req) {
        return {
            theatre: req.query.theatre,
            scene: req.query.scene,
        };
    }
};