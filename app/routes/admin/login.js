"use strict";

let express = require('express');
let router = express.Router({mergeParams: true});
let passport = require('passport');

router.get('/', function(req, res, next) {
    res.render('admin/login', {
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
