"use strict";

let express = require('express');
let router = express.Router({mergeParams: true});

let Theatre = require('models/theatre');

router.param('theatreKey', function(req, res, next, key) {
    Theatre.findByKey(key, function(err, theatre) {
        if (err) return callback(err);
        req.theatre = theatre;
        next();
    });
});

router.get('/', function(req, res, next) {
    Theatre.find({}).sort({title: 1}).exec(function(err, theatres) {
        if (err) return callback(err);
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
        theatre: req.theatre
    });
});

router.post('/edit/:theatreKey', function(req, res, next) {
    if (!req.theatre) return next();
    req.theatre.update(req.body, function(err) {
        if (err) return callback(err);
        res.redirect('/admin/theatres/edit/' + req.theatre.key);
    });
});

router.get('/create', function(req, res, next) {
    let theatre = new Theatre();
    res.render('admin/theatres/edit', {
        title: 'Управление — Театры — Новый­',
        theatre: theatre
    });
});

router.post('/create', function(req, res, next) {
    let theatre = new Theatre();
    theatre.update(req.body, function(err) {
        if (err) return callback(err);
        res.redirect('/admin/theatres/edit/' + theatre.key);
    });
});
module.exports = router;
