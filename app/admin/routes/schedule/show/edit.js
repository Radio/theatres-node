"use strict";

let moment = require('moment');
let Show = require('domain/models/show');

const momentDateFormat = 'DD.MM.YYYY HH:mm';

module.exports = function(router) {

    router.get('/:scheduleId/show/edit/:showId', function(req, res, next) {
        if (!req.schedule || !req.show) return next();
        res.render('schedule/show/edit', {
            title: 'Расписание — ' + req.show.play.title,
            momentDateFormat: momentDateFormat,
            schedule: req.schedule,
            show: getFormData(req.show, req),
            theatres: req.options.theatres,
            scenes: req.options.scenes,
            labels: req.options.labels,
            plays: groupPlaysByTheatre(req.options.plays),
            backUrl: req.session.scheduleBackUrl
        });
    });

    router.post('/:scheduleId/show/edit/:showId', function(req, res, next) {
        if (!req.schedule || !req.show) return next();
        req.schedule.editShow(req.show._id, buildShowEditRequest(req.body), function(err) {
            if (err) return next(err);
            req.flash('success', 'Расписание обновлено.');
            res.redirect(req.session.scheduleBackUrl || '/admin/schedule/?month=' + req.schedule.monthKey);
        });
    });

    router.get('/:scheduleId/show/add', function(req, res, next) {
        if (!req.schedule) return next();
        res.render('schedule/show/edit', {
            title: 'Расписание — Добавить',
            momentDateFormat: momentDateFormat,
            schedule: req.schedule,
            show: getFormData(new Show({ customHash: false, manual: true }), req),
            theatres: req.options.theatres,
            scenes: req.options.scenes,
            labels: req.options.labels,
            plays: groupPlaysByTheatre(req.options.plays),
            backUrl: req.session.scheduleBackUrl
        });
    });

    router.post('/:scheduleId/show/add', function(req, res, next) {
        if (!req.schedule) return next();
        req.schedule.addShow(buildShowEditRequest(req.body), function(err) {
            if (err) return next(err);
            req.flash('success', 'Спектакль добавлен в расписание.');
            res.redirect(req.session.scheduleBackUrl || '/admin/schedule/?month=' + req.schedule.monthKey);
        });
    });

    function getFormData(show, req) {
        let formData = req.flash('body')[0] || show.toObject({ depopulate: true });
        formData.playUrl = show.get('play.url');
        formData.playTheatre = show.get('play.theatre.id');
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
            theatre: requestBody.theatre || null,
            scene: requestBody.scene || null,
            play: requestBody.play,
            price: requestBody.price,
            url: requestBody.url,
            buyTicketUrl: requestBody['buy-ticket-url'],
            customHash: customHash,
            manual: !!requestBody.manual,
            labels: requestBody.labels.split(',').map(label => label.trim())
        };
        if (customHash) {
            editRequest.hash = requestBody.hash;
        }
        return editRequest;
    }
};