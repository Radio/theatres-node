"use strict";

let Play = require('domain/models/play');

module.exports = function(router) {

    router.get('/edit/:playKey', function(req, res, next) {
        if (!req.play) return next();
        res.render('plays/edit', {
            title: 'Спектакли — ' + req.play.title,
            play: getFormData(req.play, req),
            theatres: req.options.theatres,
            scenes: req.options.scenes,
            plays: req.options.plays,
            backUrl: req.session.playsBackUrl
        });
    });

    router.post('/edit/:playKey', function(req, res, next) {
        if (!req.play) return next();
        req.play.edit(buildEditRequest(req.body), function (err) {
            if (err) return next(err);
            req.flash('success', 'Спектакль сохранен.');
            res.redirect(req.session.playsBackUrl || '/admin/plays');
        });
    });

    router.get('/create', function(req, res) {
        res.render('plays/edit', {
            title: 'Спектакли — Новый',
            play: getFormData(new Play, req),
            theatres: req.options.theatres,
            scenes: req.options.scenes,
            plays: req.options.plays,
            backUrl: req.session.playsBackUrl
        });
    });

    router.post('/create', function(req, res, next) {
        let play = new Play();
        play.edit(buildEditRequest(req.body), function(err) {
            if (err) return next(err);
            req.flash('success', 'Спектакль сохранен.');
            res.redirect(req.session.playsBackUrl || '/admin/plays');
        });
    });

    function getFormData(play, req) {
        return req.flash('body')[0] || play.toObject({depopulate: true});
    }
    function buildEditRequest(requestBody) {
        return {
            key: requestBody.key,
            title: requestBody.title,
            theatre: requestBody.theatre,
            scene: requestBody.scene,
            url: requestBody.url,
            director: requestBody.director,
            author: requestBody.author,
            genre: requestBody.genre,
            duration: requestBody.duration,
            description: requestBody.description,
            image: requestBody.image,
            premiere: !!requestBody.premiere,
            musical: !!requestBody.musical,
            dancing: !!requestBody.dancing,
            forKids: !!requestBody['for-kids'],
            opera: !!requestBody.opera,
            ballet: !!requestBody.ballet,
            tags: requestBody.tags.replace(/\r\n/g, "\n").split("\n"),
            mapAs: requestBody['map-as'] || null
        };
    }
};