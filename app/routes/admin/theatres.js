"use strict";

let express = require('express');
let router = express.Router({mergeParams: true});

let Theatre = require('models/theatre');

router.get('/', function(req, res, next) {
    Theatre.find({}, function(err, theatres) {
        res.render('admin/theatres', {
            title: 'Управление — Театры',
            theatres: theatres
        });
    });
});

module.exports = router;
