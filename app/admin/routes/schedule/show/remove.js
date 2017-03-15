"use strict";

const removeShow = require('admin/commands/schedule/show/remove');

module.exports = function(router) {

    router.delete('/:scheduleId/show/remove/:showId', function(req, res, next) {
        if (!req.schedule || !req.show) return next();
        removeShow(req.schedule, req.show._id, function(err) {
            if (err) return next(err);
            req.flash('success', 'Спектакль удален из расписания.');
            res.end();
        });
    });

};