"use strict";

let express = require('express');
let router = express.Router({mergeParams: true});

let Theatre = require('models/theatre');

router.param('theatreKey', function(req, res, next, key) {
    Theatre.findByKey(key, function(err, theatre) {
        if (err) return next(err);
        req.theatre = theatre;
        next();
    });
});

router.get('/', function(req, res, next) {
    Theatre.find({}).sort({title: 1}).exec(function(err, theatres) {
        if (err) return next(err);
        res.render('admin/theatres/list', {
            title: 'Управление — Театры',
            theatres: theatres
        });
    });
});

router.get('/edit/:theatreKey', function(req, res, next) {
    if (!req.theatre) return next();
    res.render('admin/theatres/edit', {
        title: 'Управление — Театры — ­' + req.theatre.title,
        theatre: getFormData(req.theatre, req)
    });
});

router.post('/edit/:theatreKey', function(req, res, next) {
    if (!req.theatre) return next();
    req.theatre.edit(buildEditRequest(req.body), function(err) {
        if (err) return next(err);
        req.flash('success', 'Театр сохранен.');
        res.redirect('/admin/theatres/edit/' + req.theatre.key);
    });
});

router.post('/remove/:theatreKey', function(req, res, next) {
    if (!req.theatre) return next();
    if (req.theatre.id !== req.body.id) return next();
    req.theatre.remove(function (err) {
        if (err) return next(err);
        req.flash('success', 'Театр удален.');
        res.end();
    });
});

router.get('/create', function(req, res, next) {
    let theatre = new Theatre();
    res.render('admin/theatres/edit', {
        title: 'Управление — Театры — Новый­',
        theatre: getFormData(theatre, req)
    });
});

router.post('/create', function(req, res, next) {
    let theatre = new Theatre();
    theatre.edit(buildEditRequest(req.body), function(err) {
        if (err) return next(err);
        req.flash('success', 'Театр сохранен.');
        res.redirect('/admin/theatres/edit/' + theatre.key);
    });
});

function getFormData(theatre, req) {
    return req.flash('body')[0] || theatre.toObject({depopulate: true});
}

function buildEditRequest(requestBody) {
    return {
        key: requestBody.key,
        title: requestBody.title,
        abbreviation: requestBody.abbreviation,
        url: requestBody.url,
        houseSlug: requestBody['house-slug'],
        hasFetcher: requestBody['has-fetcher'],
    };
}

module.exports = router;
