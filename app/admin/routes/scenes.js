"use strict";

const express = require('express');
const router = express.Router({ mergeParams: true });

const list = require('admin/commands/scene/list');
const view = require('admin/commands/scene/view');
const edit = require('admin/commands/scene/edit');
const create = require('admin/commands/scene/create');
const remove = require('admin/commands/scene/remove');

router.param('sceneKey', function(req, res, next, key) {
    view(key, function(err, scene) {
        if (err) return next(err);
        req.scene = scene;
        next();
    });
});

router.get('/', function(req, res, next) {
    list(function(err, scenes) {
        if (err) return next(err);
        res.render('scenes/list', {
            title: 'Сцены',
            scenes: scenes
        });
    });
});

router.get('/edit/:sceneKey', function(req, res, next) {
    if (!req.scene) return next();
    res.render('scenes/edit', {
        title: 'Сцены — ' + req.scene.title,
        scene: getFormData(req, req.scene)
    });
});

router.post('/edit/:sceneKey', function(req, res, next) {
    if (!req.scene) return next();
    edit(req.scene, buildEditRequest(req), function(err) {
        if (err) return next(err);
        req.flash('success', 'Сцена сохранена.');
        res.redirect('/admin/scenes');
    });
});

router.delete('/remove/:sceneKey', function(req, res, next) {
    if (!req.scene) return next();
    if (req.scene.id !== req.body.id) return next();
    remove(req.scene, function (err) {
        if (err) return next(err);
        req.flash('success', 'Сцена удалена.');
        res.end();
    });
});

router.get('/create', function(req, res, next) {
    res.render('scenes/edit', {
        title: 'Сцены — Новая',
        scene: getFormData(req)
    });
});

router.post('/create', function(req, res, next) {
    create(buildEditRequest(req), function(err) {
        if (err) return next(err);
        req.flash('success', 'Сцена сохранена.');
        res.redirect('/admin/scenes');
    });
});

function getFormData(req, scene) {
    return req.flash('body')[0] || (scene ? scene.toObject({ depopulate: true }) : {});
}

function buildEditRequest(req) {
    return {
        key: req.body.key,
        title: req.body.title,
    };
}

module.exports = router;
