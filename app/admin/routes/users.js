"use strict";

const express = require('express');
const router = express.Router({mergeParams: true});

const list = require('admin/commands/user/list');
const view = require('admin/commands/user/view');
const edit = require('admin/commands/user/edit');
const create = require('admin/commands/user/create');
const remove = require('admin/commands/user/remove');

router.param('userId', function(req, res, next, id) {
    view(id, function(err, user) {
        if (err) return next(err);
        req.userToEdit = user;
        next();
    });
});

router.get('/', function(req, res, next) {
    list(function(err, users) {
        if (err) return next(err);
        res.render('users/list', {
            title: 'Пользователи',
            users: users
        });
    });
});

router.get('/edit/:userId', function(req, res, next) {
    if (!req.userToEdit) return next();
    res.render('users/edit', {
        title: 'Пользователи — ' + req.userToEdit.name,
        user: getFormData(req, req.userToEdit)
    });
});

router.post('/edit/:userId', function(req, res, next) {
    if (!req.userToEdit) return next();
    edit(req.userToEdit, buildEditRequest(req), function(err) {
        if (err) return next(err);
        req.flash('success', 'Пользователь сохранен.');
        res.redirect('/admin/users');
    });
});

router.delete('/remove/:userId', function(req, res, next) {
    if (!req.userToEdit) return next();
    remove(req.userToEdit, function (err) {
        if (err) return next(err);
        req.flash('success', 'Пользователь удален.');
        res.end();
    });
});

router.get('/create', function(req, res, next) {
    res.render('users/edit', {
        title: 'Пользователи — Новая',
        user: getFormData(req)
    });
});

router.post('/create', function(req, res, next) {
    create(buildEditRequest(req), function(err) {
        if (err) return next(err);
        req.flash('success', 'Пользователь сохранен.');
        res.redirect('/admin/users');
    });
});

function getFormData(req, user) {
    return req.flash('body')[0] || (user ? user.toObject({ depopulate: true }) : {});
}

function buildEditRequest(req) {
    let request = {
        email: req.body.email,
        name: req.body.name,
    };
    if (req.body['new-password']) {
        request.password = req.body['new-password'];
    }
    return request;
}

module.exports = router;
