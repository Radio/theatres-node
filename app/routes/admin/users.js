"use strict";

let express = require('express');
let router = express.Router({mergeParams: true});

let User = require('models/user');

router.param('userId', function(req, res, next, id) {
    User.findOne({ _id: id }, function(err, user) {
        if (err) return next(err);
        req.userToEdit = user;
        next();
    });
});

router.get('/', function(req, res, next) {
    User.find({}).sort({ name: 1 }).exec(function(err, users) {
        if (err) return next(err);
        res.render('admin/users/list', {
            title: 'Пользователи',
            users: users
        });
    });
});

router.get('/edit/:userId', function(req, res, next) {
    if (!req.userToEdit) return next();
    res.render('admin/users/edit', {
        title: 'Пользователи — ­' + req.userToEdit.name,
        user: getFormData(req.userToEdit, req)
    });
});

router.post('/edit/:userId', function(req, res, next) {
    if (!req.userToEdit) return next();
    req.userToEdit.edit(buildEditRequest(req.body), function(err) {
        if (err) return next(err);
        req.flash('success', 'Пользователь сохранен.');
        res.redirect('/admin/users/edit/' + req.userToEdit.id);
    });
});

router.delete('/remove/:userId', function(req, res, next) {
    if (!req.userToEdit) return next();
    req.userToEdit.remove(function (err) {
        if (err) return next(err);
        req.flash('success', 'Пользователь удален.');
        res.end();
    });
});

router.get('/create', function(req, res, next) {
    let user = new User();
    res.render('admin/users/edit', {
        title: 'Пользователи — Новая­',
        user: getFormData(user, req)
    });
});

router.post('/create', function(req, res, next) {
    let user = new User();
    user.edit(buildEditRequest(req.body), function(err) {
        if (err) return next(err);
        req.flash('success', 'Пользователь сохранен.');
        res.redirect('/admin/users/edit/' + user.id);
    });
});

function getFormData(user, req) {
    return req.flash('body')[0] || user.toObject({depopulate: true});
}

function buildEditRequest(requestBody) {

    let request = {
        email: requestBody.email,
        name: requestBody.name,
    };
    if (requestBody['new-password']) {
        request.password = requestBody['new-password'];
    }
    return request;
}

module.exports = router;
