"use strict";

let express = require('express');
let router = express.Router({mergeParams: true});

let Scene = require('models/scene');

router.param('sceneKey', function(req, res, next, key) {
    Scene.findByKey(key, function(err, scene) {
        if (err) return callback(err);
        req.scene = scene;
        next();
    });
});

router.get('/', function(req, res, next) {
    Scene.find({}).sort({title: 1}).exec(function(err, scenes) {
        if (err) return callback(err);
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
        scene: req.scene
    });
});

router.post('/edit/:sceneKey', function(req, res, next) {
    if (!req.scene) return next();
    req.scene.update(req.body, function(err) {
        if (err) return callback(err);
        console.log(req.scene.title);
        console.log(req.scene.key);
        res.redirect('/admin/scenes/edit/' + req.scene.key);
    });
});

router.get('/create', function(req, res, next) {
    let scene = new Scene();
    res.render('admin/scenes/edit', {
        title: 'Управление — Сцены — Новая­',
        scene: scene
    });
});

router.post('/create', function(req, res, next) {
    let scene = new Scene();
    scene.update(req.body, function(err) {
        if (err) return callback(err);
        res.redirect('/admin/scenes/edit/' + scene.key);
    });
});
module.exports = router;
