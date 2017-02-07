"use strict";

let express = require('express');
let router = express.Router({mergeParams: true});

let Scene = require('models/scene');

router.param('sceneKey', function(req, res, next, key) {
    Scene.findByKey(key, function(err, scene) {
        if (err) return next(err);
        req.scene = scene;
        next();
    });
});

router.get('/', function(req, res, next) {
    Scene.find({}).sort({title: 1}).exec(function(err, scenes) {
        if (err) return next(err);
        res.render('admin/scenes/list', {
            title: 'Управление — Сцены',
            scenes: scenes
        });
    });
});

router.get('/edit/:sceneKey', function(req, res, next) {
    if (!req.scene) return next();
    res.render('admin/scenes/edit', {
        title: 'Управление — Сцены — ­' + req.scene.title,
        scene: getFormData(req.scene, req)
    });
});

router.post('/edit/:sceneKey', function(req, res, next) {
    if (!req.scene) return next();
    req.scene.edit(buildEditRequest(req.body), function(err) {
        if (err) return next(err);
        req.flash('success', 'Сцена сохранена.');
        res.redirect('/admin/scenes/edit/' + req.scene.key);
    });
});

router.delete('/remove/:sceneKey', function(req, res, next) {
    if (!req.scene) return next();
    if (req.scene.id !== req.body.id) return next();
    req.scene.remove(function (err) {
        if (err) return next(err);
        req.flash('success', 'Сцена удалена.');
        res.end();
    });
});

router.get('/create', function(req, res, next) {
    let scene = new Scene();
    res.render('admin/scenes/edit', {
        title: 'Управление — Сцены — Новая­',
        scene: getFormData(scene, req)
    });
});

router.post('/create', function(req, res, next) {
    let scene = new Scene();
    scene.edit(buildEditRequest(req.body), function(err) {
        if (err) return next(err);
        req.flash('success', 'Сцена сохранена.');
        res.redirect('/admin/scenes/edit/' + scene.key);
    });
});

function getFormData(scene, req) {
    return req.flash('body')[0] || scene.toObject({depopulate: true});
}

function buildEditRequest(requestBody) {
    return {
        key: requestBody.key,
        title: requestBody.title,
    };
}

module.exports = router;
