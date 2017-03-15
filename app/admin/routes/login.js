"use strict";

const express = require('express');
const router = express.Router({mergeParams: true});
const passport = require('passport');

router.get('/', function(req, res, next) {
    res.render('login', {
        title: 'Вход',
        formData: req.flash('body')[0] || {}
    });
});

router.post('/',
    passport.authenticate('local', {
        successRedirect: '/admin/schedule',
        failureRedirect: '/admin/login',
        failureFlash: true
    })
);



module.exports = router;
