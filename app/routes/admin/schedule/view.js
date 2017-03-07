"use strict";

let Schedule = require('models/schedule');

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
            res.render('admin/schedule/view', {
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
            .populate('shows.scene')
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
            return (!filter.theatre || filter.theatre === String(show.play.theatre.id)) &&
                (!filter.scene || filter.scene === String(scene.id))
        });
    }

    function collectShowsFilter(req) {
        return {
            theatre: req.query.theatre,
            scene: req.query.scene,
        };
    }
};