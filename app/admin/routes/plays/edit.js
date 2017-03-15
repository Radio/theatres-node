"use strict";

let edit = require('admin/commands/play/edit');
let create = require('admin/commands/play/create');

module.exports = function(router) {

    router.get('/edit/:playKey', function(req, res, next) {
        if (!req.play) return next();
        res.render('plays/edit', {
            title: 'Спектакли — ' + req.play.title,
            play: getFormData(req, req.play),
            theatres: req.options.theatres,
            scenes: req.options.scenes,
            plays: req.options.plays,
            backUrl: req.session.playsBackUrl
        });
    });

    router.post('/edit/:playKey', function(req, res, next) {
        if (!req.play) return next();
        edit(req.play, buildEditRequest(req), function (err) {
            if (err) return next(err);
            req.flash('success', 'Спектакль изменен.');
            res.redirect(req.session.playsBackUrl || '/admin/plays');
        });
    });

    router.get('/create', function(req, res) {
        res.render('plays/edit', {
            title: 'Спектакли — Новый',
            play: getFormData(req),
            theatres: req.options.theatres,
            scenes: req.options.scenes,
            plays: req.options.plays,
            backUrl: req.session.playsBackUrl
        });
    });

    router.post('/create', function(req, res, next) {
        create(buildEditRequest(req), function(err, play) {
            if (err) return next(err);
            req.flash('success', 'Спектакль создан.');
            res.redirect(req.session.playsBackUrl || '/admin/plays');
        });
    });

    function getFormData(req, play) {
        let dto = req.flash('body')[0];
        if (!dto) {
            return play ? play.toObject({ depopulate: true }) : {};
        }
        dto.forKids = dto['for-kids'];
        dto.mapAs = dto['map-as'];
        dto.tags = multilineTagsToArray(dto.tags);
        return dto;
    }

    function buildEditRequest(req) {
        return {
            key: req.body.key,
            title: req.body.title,
            theatre: req.body.theatre || null,
            scene: req.body.scene || null,
            url: req.body.url,
            director: req.body.director,
            author: req.body.author,
            genre: req.body.genre,
            duration: req.body.duration,
            description: req.body.description,
            image: req.body.image,
            premiere: !!req.body.premiere,
            musical: !!req.body.musical,
            dancing: !!req.body.dancing,
            forKids: !!req.body['for-kids'],
            opera: !!req.body.opera,
            ballet: !!req.body.ballet,
            tags: multilineTagsToArray(req.body.tags),
            mapAs: req.body['map-as'] || null
        };
    }

    function multilineTagsToArray(multilineTags) {
        return multilineTags.replace(/\r\n/g, "\n").split("\n");
    }
};