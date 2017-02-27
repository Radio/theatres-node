"use strict";

let Schedule = require('models/schedule');
let async = require('async');
let jsDiff = require('diff');

module.exports = function(router) {

    router.get('/diff', function (req, res, next) {
        if (!req.options) return next();
        if (!req.query.a || !req.query.b) {
            res.render('admin/schedule/diff/choose', {
                title: 'Расписание — Сравнить',
                aId: req.query.a,
                versions: req.options.versions
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
            res.render('admin/schedule/diff/view', {
                title: 'Расписание — Сравнение',
                a: schedules.a,
                b: schedules.b,
                diff: diff
            });
        });
    });

    function loadSchedule(id, callback) {
        Schedule.findOne({_id: id})
            .populate('shows.scene shows.play')
            .exec(callback);
    }

    function getDiffableObject(schedule) {
        return schedule.toObject().shows.map(function(show) {
            show.play__id = show.play._id;
            show.play__title = show.play.title;
            show.scene__id = show.scene ? show.scene._id : null;
            show.scene__title = show.scene ? show.scene.title : null;
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