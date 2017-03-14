"use strict";

const listDiffVersions = require('admin/commands/schedule/diff/versions/list');
const viewDiff = require('admin/commands/schedule/diff/view');

module.exports = function(router) {

    router.get('/diff', function (req, res, next) {
        if (!req.options) return next();

        if (req.query.month) {
            const [month, year] = req.query.month.split('-');
            listDiffVersions(month - 1, year, function(err, versions) {
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

        viewDiff(req.query.a, req.query.b, function(err, schedules) {
            if (err) return next(err);
            if (!schedules) return next();
            res.render('schedule/diff/view', {
                title: 'Расписание — Сравнение',
                a: schedules.a,
                b: schedules.b,
                diff: schedules.diff
            });
        });
    });
};