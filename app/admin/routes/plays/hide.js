"use strict";

const hide = require('admin/commands/play/hide');
const unhide = require('admin/commands/play/unhide');

module.exports = function(router) {

    router.post('/hide/:playKey', function(req, res, next) {
        if (!req.play) return next();
        hide(req.play, function (err) {
            if (err) return next(err);
            req.flash('success', 'Спектакль «' + req.play.title + '» скрыт из всех расписаний.');
            res.end();
        });
    });

    router.post('/unhide/:playKey', function(req, res, next) {
        if (!req.play) return next();
        unhide(req.play, function (err) {
            if (err) return next(err);
            req.flash('success', 'Спектакль «' + req.play.title + '» больше не скрыт.');
            res.end();
        });
    });

};