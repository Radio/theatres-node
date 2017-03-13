"use strict";

let Schedule = require('domain/models/schedule');
let async = require('async');
let jsDiff = require('diff');

module.exports = function(router) {

    router.get('/diff', function (req, res, next) {
        if (!req.options) return next();
        if (req.query.month) {
            const [month, year] = req.query.month.split('-');
            Schedule
                .find({ month: month - 1, year: year }, { version: 1, actual: 1 })
                .sort({ version: -1 }).exec(function(err, versions) {
                    if (err) return next(err);
                    if (!versions) return next();
                    res.render('schedule/diff/choose', {
                        title: 'Расписание — Сравнить',
                        aId: req.query.a,
                        versions: versions
                    });
            });
            return;
        }
        async.parallel({
            a: callback => loadSchedule(req.query.a, callback),
            b: callback => loadSchedule(req.query.b, callback)
        }, function(err, schedules) {
            if (err) return next(err);
            if (!schedules.a || !schedules.b) {
                return next();
            }
            let diff = getDiff(getDiffableObject(schedules.b), getDiffableObject(schedules.a));
            res.render('schedule/diff/view', {
                title: 'Расписание — Сравнение',
                a: schedules.a,
                b: schedules.b,
                diff: diff
            });
        });
    });

    function loadSchedule(id, callback) {
        Schedule.findOne({_id: id})
            .populate('shows.scene')
            .populate({
                path: 'shows.play',
                populate: { path: 'theatre' }
            })
            .exec(callback);
    }

    function getDiffableObject(schedule) {
        return schedule.toObject().shows.map(function(show) {
            show.play__id = show.play._id;
            show.play__title = show.play.title;
            show.scene__id = show.scene ? show.scene._id : null;
            show.scene__title = show.scene ? show.scene.title : null;
            show.theatre__title = show.play.theatre.title;
            delete show._id;
            delete show.play;
            delete show.scene;
            delete show.theatre;
            return show;
        });
    }

    function getDiff(a, b) {
        return jsDiff.diffJson(a, b);
    }
};