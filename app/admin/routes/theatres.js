"use strict";

const express = require('express');
const router = express.Router({ mergeParams: true });

const list = require('admin/commands/theatre/list');
const view = require('admin/commands/theatre/view');
const edit = require('admin/commands/theatre/edit');
const create = require('admin/commands/theatre/create');
const remove = require('admin/commands/theatre/remove');

router.param('theatreKey', function(req, res, next, key) {
    view(key, function(err, theatre) {
        if (err) return next(err);
        req.theatre = theatre;
        next();
    });
});

router.get('/', function(req, res, next) {
    list(function(err, theatres) {
        if (err) return next(err);
        res.render('theatres/list', {
            title: 'Театры',
            theatres: theatres
        });
    });
});

router.get('/edit/:theatreKey', function(req, res, next) {
    if (!req.theatre) return next();
    res.render('theatres/edit', {
        title: 'Театры — ' + req.theatre.title,
        theatre: getFormData(req, req.theatre)
    });
});

router.post('/edit/:theatreKey', function(req, res, next) {
    if (!req.theatre) return next();
    edit(req.theatre, buildEditRequest(req), function(err) {
        if (err) return next(err);
        req.flash('success', 'Театр сохранен.');
        res.redirect('/admin/theatres');
    });
});

router.delete('/remove/:theatreKey', function(req, res, next) {
    if (!req.theatre) return next();
    if (req.theatre.id !== req.body.id) return next();
    remove(req.theatre, function (err) {
        if (err) return next(err);
        req.flash('success', 'Театр удален.');
        res.end();
    });
});

router.get('/create', function(req, res) {
    res.render('theatres/edit', {
        title: 'Театры — Новый',
        theatre: getFormData(req)
    });
});

router.post('/create', function(req, res, next) {
    create(buildEditRequest(req), function(err) {
        if (err) return next(err);
        req.flash('success', 'Театр сохранен.');
        res.redirect('/admin/theatres');
    });
});

function getFormData(req, theatre) {
    let dto = req.flash('body')[0];
    if (!dto) {
        return theatre ? theatre.toObject({ depopulate: true }) : {};
    }
    dto.houseSlug = dto['house-slug'];
    dto.karabasHallId = dto['karabas-hall-id'];
    dto.hasFetcher = dto['has-fetcher'];
    return dto;
}

function buildEditRequest(req) {
    return {
        key: req.body.key,
        title: req.body.title,
        url: req.body.url,
        houseSlug: req.body['house-slug'],
        karabasHallId: req.body['karabas-hall-id'],
        hasFetcher: req.body['has-fetcher'],
    };
}

module.exports = router;
