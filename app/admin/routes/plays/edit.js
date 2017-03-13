"use strict";

let Play = require('domain/models/play');
let edit = require('admin/commands/plays/edit');
let create = require('admin/commands/plays/create');

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
        edit(req.play, buildEditRequest(req), function (err) {
            if (err) return next(err);
            req.flash('success', 'Спектакль изменен.');
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
        create(buildEditRequest(req), function(err, play) {
            if (err) return next(err);
            req.flash('success', 'Спектакль создан.');
            res.redirect(req.session.playsBackUrl || '/admin/plays');
        });
    });

    function getFormData(play, req) {
        let dto = req.flash('body')[0];
        if (!dto) {
            dto = play.toObject({ depopulate: true });
            delete dto._id;
            return dto;
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
            theatre: req.body.theatre,
            scene: req.body.scene,
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