"use strict";

let async = require('async');
let escapeStringRegexp = require('escape-string-regexp');
let express = require('express');
let router = express.Router({mergeParams: true});

let Play = require('models/play');
let Theatre = require('models/theatre');
let Scene = require('models/scene');

router.param('playKey', function(req, res, next, key) {
    Play.findByKey(key)
        .populate('theatre scene')
        .exec(function(err, play) {
            if (err) return next(err);
            req.play = play;
            next();
        });
});

router.get(/\/.*/, function(req, res, next) {
    loadOptionsData(function (err, options) {
        if (err) return next(err);
        req.options = options;
        next();
    });
});

router.get('/', function(req, res, next) {
    let filter = collectFilter(req.query);
    Play.find(filter)
        .populate('theatre scene')
        .sort({title: 1})
        .exec(function (err, plays) {
            if (err) return next(err);
            res.render('admin/plays/list', {
                title: 'Управление — Спектакли',
                subtitle: plays.length + ' штук.',
                plays: plays,
                filter: req.query,
                theatres: req.options.theatres,
                scenes: req.options.scenes,
            });
        });
});

router.get('/edit/:playKey', function(req, res, next) {
    if (!req.play) return next();
    res.render('admin/plays/edit', {
        title: 'Управление — Спектакли — ­' + req.play.title,
        play: getFormData(req.play, req),
        theatres: req.options.theatres,
        scenes: req.options.scenes,
    });
});

router.post('/edit/:playKey', function(req, res, next) {
    if (!req.play) return next();
    req.play.edit(buildEditRequest(req.body), function (err) {
        if (err) return next(err);
        req.flash('success', 'Спектакль сохранен.');
        res.redirect('/admin/plays/edit/' + req.play.key);
    });
});

router.post('/remove/:playKey', function(req, res, next) {
    if (!req.play) return next();
    if (req.play.id !== req.body.id) return next();
    req.play.remove(function (err) {
        if (err) return next(err);
        req.flash('success', 'Спектакль «' + req.play.title + '» удален.');
        res.end();
    });
});


router.get('/create', function(req, res) {
    res.render('admin/plays/edit', {
        title: 'Управление — Спектакли — Новый­',
        play: getFormData(new Play, req),
        theatres: req.options.theatres,
        scenes: req.options.scenes,
    });
});

router.post('/create', function(req, res, next) {
    let play = new Play();
    play.edit(buildEditRequest(req.body), function(err) {
        if (err) return next(err);
        req.flash('success', 'Спектакль сохранен.');
        res.redirect('/admin/plays/edit/' + play.key);
    });
});

function getFormData(play, req) {
    return req.flash('body')[0] || play.toObject({depopulate: true});
}

function loadOptionsData(callback) {
    async.parallel({
        theatres: callback => Theatre.find({}).sort({title: 1}).exec(callback),
        scenes: callback => Scene.find({}).sort({title: 1}).exec(callback)
    }, callback);
}

function collectFilter(filterQuery) {
    let filter = {};
    if (filterQuery.query) {
        const regexCondition = { '$regex': new RegExp(escapeStringRegexp(filterQuery.query), 'i') };
        filter['$or'] = [
            { title: regexCondition },
            { key: regexCondition }
        ];
    }
    if (filterQuery.theatre) {
        filter.theatre = filterQuery.theatre;
    }
    if (filterQuery.scene) {
        filter.scene = filterQuery.scene;
    }
    return filter;
}

function buildEditRequest(requestBody) {
    // todo: add tags support.
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
        image: requestBody.image
    };
}

module.exports = router;
