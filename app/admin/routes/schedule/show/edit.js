"use strict";

let moment = require('moment');
let Show = require('domain/models/show');

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
        editShow(req.schedule, req.show._id, buildShowEditRequest(req.body), function(err) {
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
        addShow(req.schedule, buildShowEditRequest(req.body), function(err) {
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

    function getFormData(show, req) {
        let dto = req.flash('body')[0];
        if (!dto) {
            dto = show.toObject({ depopulate: true });
            dto.playUrl = show.get('play.url');
            dto.playTheatre = show.get('play.theatre.id');
            delete dto._id;
            return dto;
        }
        if (dto.date) {
            dto.date = dateStringToObject(dto.date) || dto.date;
        }
        dto.playUrl = show.get('play.url');
        dto.playTheatre = show.get('play.theatre.id');
        dto.buyTicketUrl = dto['buy-ticket-url'];
        dto.labels = commaSeparatedLabelsToArray(dto.labels);
        return dto;
    }

    function buildShowEditRequest(requestBody) {
        const customHash = !requestBody['auto-hash'];
        const editRequest = {
            date: dateStringToObject(requestBody.date),
            theatre: requestBody.theatre || null,
            scene: requestBody.scene || null,
            play: requestBody.play,
            price: requestBody.price,
            url: requestBody.url,
            buyTicketUrl: requestBody['buy-ticket-url'],
            customHash: customHash,
            manual: !!requestBody.manual,
            labels: commaSeparatedLabelsToArray(requestBody.labels)
        };
        if (customHash) {
            editRequest.hash = requestBody.hash;
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