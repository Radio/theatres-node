"use strict";

const move = require('admin/commands/play/move');

module.exports = function(router) {

    router.get('/move/:playKey', function(req, res, next) {
        if (!req.play) return next();
        res.render('plays/move', {
            title: 'Спектакли — ' + req.play.title + ' — В другой театр',
            play: req.play,
            theatres: req.options.theatres,
            backUrl: req.session.playsBackUrl
        });
    });

    router.post('/move/:playKey', function(req, res, next) {
        if (!req.play) return next();
        move(req.play, req.body['new-theatre'], function(err) {
            if (err) return next(err);
            req.flash('success', 'Спектакль перемещен.');
            res.redirect('/admin/plays/edit/' + req.play.key);
        });
    });

};