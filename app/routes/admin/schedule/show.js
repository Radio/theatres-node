"use strict";

let moment = require('moment');
let Show = require('models/show');

const momentDateFormat = 'DD.MM.YYYY HH:mm';

module.exports = function(router) {

    router.get('/:scheduleId/show/edit/:showId', function(req, res, next) {
        if (!req.schedule || !req.show) return next();
        res.render('admin/schedule/edit-show', {
            title: 'Управление — Расписание — ­' + req.show.play.title,
            momentDateFormat: momentDateFormat,
            schedule: req.schedule,
            show: getFormData(req.show, req),
            theatres: req.options.theatres,
            scenes: req.options.scenes,
            plays: groupPlaysByTheatre(req.options.plays),
        });
    });

    router.post('/:scheduleId/show/edit/:showId', function(req, res, next) {
        if (!req.schedule || !req.show) return next();
        req.schedule.editShow(req.show._id, buildShowEditRequest(req.body), function(err) {
            if (err) return next(err);
            req.flash('success', 'Расписание обновлено.');
            res.redirect('/admin/schedule/?month=' + req.schedule.monthKey);
        });
    });

    router.get('/:scheduleId/show/add', function(req, res, next) {
        if (!req.schedule) return next();
        res.render('admin/schedule/edit-show', {
            title: 'Управление — Расписание — Добавить',
            momentDateFormat: momentDateFormat,
            schedule: req.schedule,
            show: getFormData(new Show(), req),
            theatres: req.options.theatres,
            scenes: req.options.scenes,
            plays: groupPlaysByTheatre(req.options.plays),
        });
    });

    router.post('/:scheduleId/show/add', function(req, res, next) {
        if (!req.schedule) return next();
        req.schedule.addShow(buildShowEditRequest(req.body), function(err) {
            if (err) return next(err);
            req.flash('success', 'Спектакль добавлен в расписание.');
            res.redirect('/admin/schedule/?month=' + req.schedule.monthKey);
        });
    });

    router.delete('/:scheduleId/show/remove/:showId', function(req, res, next) {
        if (!req.schedule || !req.show) return next();
        req.schedule.removeShow(req.show._id, function(err) {
            if (err) return next(err);
            req.flash('success', 'Спектакль удален из расписания.');
            res.end();
        });
    });

    router.post('/:scheduleId/show/mark-as-duplicate/:showId', function(req, res, next) {
        if (!req.schedule || !req.show || !req.body.original) return next();
        req.schedule.markShowAsDuplicate(req.show._id, req.body.original, function(err) {
            if (err) return next(err);
            req.flash('success', 'Спектакль помечен как дубликат.');
            res.end();
        });
    });

    function getFormData(show, req) {
        const playUrl = (typeof show.play === 'object' && show.play.url) ? show.play.url : null;
        let formData = req.flash('body')[0] || show.toObject({depopulate: true});
        formData.playUrl = playUrl;
        return formData;
    }

    function groupPlaysByTheatre(plays) {
        return plays.reduce(function(groupped, play) {
            groupped[play.theatre.id] = groupped[play.theatre.id] || { title: play.theatre.title, plays: [] };
            groupped[play.theatre.id].plays.push(play);
            return groupped;
        }, {})
    }

    function buildShowEditRequest(requestBody) {
        const customHash = !requestBody['auto-hash'];
        const editRequest = {
            date: moment(requestBody.date, momentDateFormat).toDate(),
            theatre: requestBody.theatre,
            scene: requestBody.scene || null,
            play: requestBody.play,
            price: requestBody.price,
            url: requestBody.url,
            buyTicketUrl: requestBody['buy-ticket-url'],
            customHash: customHash
        };
        if (customHash) {
            editRequest.hash = requestBody.hash;
        }
        return editRequest;
    }
};