"use strict";

module.exports = function(router) {

    router.post('/:scheduleId/show/hide/:showId', function(req, res, next) {
        if (!req.schedule || !req.show) return next();
        req.schedule.hideShow(req.show._id, function(err) {
            if (err) return next(err);
            req.flash('success', 'Спектакль скрыт из расписания на этот месяц.');
            res.end();
        });
    });

    router.post('/:scheduleId/show/unhide/:showId', function(req, res, next) {
        if (!req.schedule || !req.show) return next();
        req.schedule.unhideShow(req.show._id, function(err) {
            if (err) return next(err);
            req.flash('success', 'Спектакль больше не скрыт в расписании на этот месяц.');
            res.end();
        });
    });

};