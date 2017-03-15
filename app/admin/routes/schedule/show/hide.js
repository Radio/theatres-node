"use strict";

const hideShow = require('admin/commands/schedule/show/hide');
const unhideShow = require('admin/commands/schedule/show/unhide');

module.exports = function(router) {

    router.post('/:scheduleId/show/hide/:showId', function(req, res, next) {
        if (!req.schedule || !req.show) return next();
        hideShow(req.schedule, req.show._id, function(err) {
            if (err) return next(err);
            req.flash('success', 'Спектакль скрыт из расписания на этот месяц.');
            res.end();
        });
    });

    router.post('/:scheduleId/show/unhide/:showId', function(req, res, next) {
        if (!req.schedule || !req.show) return next();
        unhideShow(req.schedule, req.show._id, function(err) {
            if (err) return next(err);
            req.flash('success', 'Спектакль больше не скрыт в расписании на этот месяц.');
            res.end();
        });
    });

};