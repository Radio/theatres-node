"use strict";

const Play = require('domain/models/play');
const absorb = require('admin/commands/play/absorb');

module.exports = function(router) {

    router.get('/absorb/:playKey', function(req, res, next) {
        if (!req.play) return next();
        Play.findByTheatre(req.play.theatre.id).sort({ title: 1 }).exec(function(err, plays) {
            if (err) return next(err);
            res.render('plays/absorb', {
                title: 'Спектакли — ' + req.play.title + ' — Поглотить',
                play: req.play,
                candidates: plays,
                backUrl: req.session.playsBackUrl
            });
        });
    });

    router.post('/absorb/:playKey', function(req, res, next) {
        if (!req.play) return next();
        Play.findById(req.body.original, function(err, original) {
            if (err) return next(err);
            absorb(original, req.play, function(err) {
                if (err) return next(err);
                req.flash('success', 'Спектакль поглощен.');
                res.redirect('/admin/plays/edit/' + original.key);
            });
        });
    });
};