"use strict";

const modelHelper = require('helpers/model');
const listVersions = require('admin/commands/schedule/versions/list');
const view = require('admin/commands/schedule/view');

module.exports = function(router) {
    router.get('/', function (req, res, next) {
        req.session.scheduleBackUrl = req.originalUrl;
        const filter = collectFilter(req.query);
        view(filter.month, filter.year, filter, function (err, schedule) {
            if (err) return next(err);
            listVersions(filter.month, filter.year, function(err, versions) {
                if (err) return next(err);
                filter.monthKey = filter.monthKey || schedule.monthKey;
                res.render('schedule/view', {
                    title: 'Расписание',
                    schedule: schedule,
                    filteredShows: schedule ? filterScheduleShows(schedule, filter) : [],
                    filter: filter,
                    theatres: req.options.theatres,
                    scenes: req.options.scenes,
                    months: req.options.months,
                    versions: versions,
                    backUrl: req.session.scheduleBackUrl
                });
            });
        });
    });

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

    function collectFilter(filterQuery) {
        const today = new Date();
        let filter = {
            month: today.getMonth(),
            year: today.getFullYear(),
            theatre: filterQuery.theatre,
            scene: filterQuery.scene,
            version: filterQuery.version,
        };
        if (filterQuery['month-key']) {
            filter.monthKey = filterQuery['month-key'];
            [filter.month, filter.year] = filterQuery['month-key'].split('-');
            filter.month--;
        }
        return filter;
    }
};