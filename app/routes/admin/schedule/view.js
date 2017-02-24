"use strict";

let Schedule = require('models/schedule');

module.exports = function(router) {
    router.get('/', function (req, res, next) {
        req.session.scheduleBackUrl = req.originalUrl;
        if (!req.filter) return next();
        let filter = req.filter;
        Schedule.findOne(filter)
            .populate('shows.theatre shows.scene shows.play')
            .exec(function (err, schedule) {
                if (err) return next(err);
                if (schedule) {
                    schedule.shows = filterScheduleShows(schedule, req);
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
                });
            });
    });

    function filterScheduleShows(schedule, req) {
        return schedule.shows.filter(function (show) {
            const scene = show.scene || show.play.scene;
            return (!req.query.theatre || req.query.theatre === String(show.theatre.id)) &&
                (!req.query.scene || req.query.scene === String(scene.id))
        });
    }
};