"use strict";

const moment = require('moment');

const editShow = require('admin/commands/schedule/show/edit');
const addShow = require('admin/commands/schedule/show/add');

const momentDateFormat = 'DD.MM.YYYY HH:mm';

module.exports = function(router) {

    router.get('/:scheduleId/show/edit/:showId', function(req, res, next) {
        if (!req.schedule || !req.show) return next();
        res.render('schedule/show/edit', {
            title: 'Расписание — ' + req.show.play.title,
            momentDateFormat: momentDateFormat,
            schedule: req.schedule,
            show: getFormData(req, req.show),
            theatres: req.options.theatres,
            scenes: req.options.scenes,
            labels: req.options.labels,
            plays: groupPlaysByTheatre(req.options.plays),
            backUrl: req.session.scheduleBackUrl
        });
    });

    router.post('/:scheduleId/show/edit/:showId', function(req, res, next) {
        if (!req.schedule || !req.show) return next();
        editShow(req.schedule, req.show._id, buildShowEditRequest(req), function(err) {
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
            show: getFormData(req),
            theatres: req.options.theatres,
            scenes: req.options.scenes,
            labels: req.options.labels,
            plays: groupPlaysByTheatre(req.options.plays),
            backUrl: req.session.scheduleBackUrl
        });
    });

    router.post('/:scheduleId/show/add', function(req, res, next) {
        if (!req.schedule) return next();
        addShow(req.schedule, buildShowEditRequest(req), function(err) {
            if (err) return next(err);
            req.flash('success', 'Спектакль добавлен в расписание.');
            res.redirect(req.session.scheduleBackUrl || '/admin/schedule/?month=' + req.schedule.monthKey);
        });
    });

    function groupPlaysByTheatre(plays) {
        return plays.reduce(function(groupped, play) {
            groupped[play.theatre.id] = groupped[play.theatre.id] || { title: play.theatre.title, plays: [] };
            groupped[play.theatre.id].plays.push(play);
            return groupped;
        }, {})
    }

    function getFormData(req, show) {
        let dto = req.flash('body')[0];
        if (!dto) {
            if (!show) {
                return { customHash: false, manual: true };
            }
            dto = show.toObject({depopulate: true});
            dto.playUrl = show.get('play.url');
            dto.playTheatre = show.get('play.theatre.id');
            return dto;
        }
        if (dto.date) {
            dto.date = dateStringToObject(dto.date) || dto.date;
        }
        dto.playUrl = show ? show.get('play.url') : null;
        dto.playTheatre = show ? show.get('play.theatre.id') : null;
        dto.buyTicketUrl = dto['buy-ticket-url'];
        dto.labels = commaSeparatedLabelsToArray(dto.labels);
        return dto;
    }

    function buildShowEditRequest(req) {
        const customHash = !req.body['auto-hash'];
        const editRequest = {
            date: dateStringToObject(req.body.date),
            theatre: req.body.theatre || null,
            scene: req.body.scene || null,
            play: req.body.play || null,
            price: req.body.price,
            url: req.body.url,
            buyTicketUrl: req.body['buy-ticket-url'],
            customHash: customHash,
            manual: !!req.body.manual,
            labels: commaSeparatedLabelsToArray(req.body.labels)
        };
        if (customHash) {
            editRequest.hash = req.body.hash;
        }
        return editRequest;
    }
    function dateStringToObject(dateString) {
        const dateMoment = moment(dateString, momentDateFormat);
        return dateMoment.isValid() ? dateMoment.toDate() : null;
    }
    function commaSeparatedLabelsToArray(commaSeparatedLabels) {
        return commaSeparatedLabels.split(',').map(label => label.trim());
    }
};