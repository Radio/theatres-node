"use strict";

let Play = require('models/play');
let Schedule = require('models/schedule');

module.exports = function(router) {

    router.get('/absorb/:playKey', function(req, res, next) {
        if (!req.play) return next();

        Play.find({ theatre: req.play.theatre.id}).sort({ title: 1 }).exec(function(err, plays) {
            if (err) return next(err);

            res.render('admin/plays/absorb', {
                title: 'Спектакли — ' + req.play.title + ' — Поглотить',
                play: req.play,
                candidates: plays
            });
        });


    });

    router.post('/absorb/:playKey', function(req, res, next) {
        if (!req.play) return next();
        Play.findOne({ _id: req.body.original })
            .exec(function(err, original) {
                if (err) return next(err);

                if (String(req.play.theatre.id) !== String(original.theatre)) {
                    if (err) return next(new Error('Можно поглотить только спектаклем из того-же театра.'));
                }

                original.absorbDuplicate(req.play, function(err) {
                    if (err) return next(err);
                    Schedule.replacePlay(req.play.id, original.id, function(err) {
                        if (err) return next(err);
                        req.flash('success', 'Спектакль поглощен.');
                        res.redirect('/admin/plays/edit/' + original.key);
                    });
                });
            });
    });
};