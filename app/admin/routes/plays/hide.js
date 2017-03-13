"use strict";

module.exports = function(router) {

    router.post('/hide/:playKey', function(req, res, next) {
        if (!req.play) return next();
        req.play.hide(function (err) {
            if (err) return next(err);
            req.flash('success', 'Спектакль «' + req.play.title + '» скрыт из всех расписаний.');
            res.end();
        });
    });

    router.post('/unhide/:playKey', function(req, res, next) {
        if (!req.play) return next();
        req.play.unhide(function (err) {
            if (err) return next(err);
            req.flash('success', 'Спектакль «' + req.play.title + '» больше не скрыт.');
            res.end();
        });
    });

};