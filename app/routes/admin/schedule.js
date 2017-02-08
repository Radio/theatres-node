"use strict";

let async = require('async');
let moment = require('moment');
let s = require('underscore.string');
let express = require('express');
let router = express.Router({mergeParams: true});

let Schedule = require('models/schedule');
let Theatre = require('models/theatre');
let Scene = require('models/scene');
let Play = require('models/play');
let Show = require('models/show');

const momentDateFormat = 'DD.MM.YYYY HH:mm';

router.get(/\/.*/, function(req, res, next) {
    const filter = collectFilter(req.query);
    loadOptionsData(filter.month, filter.year, function (err, options) {
        if (err) return next(err);
        req.options = options;
        next();
    });
});

router.param('scheduleId', function(req, res, next, id) {
    Schedule.findOne({_id: id, actual: true})
        .populate('shows.theatre shows.scene shows.play')
        .exec(function(err, schedule) {
            if (err) return next(err);
            req.schedule = schedule;
            next();
        });
});
router.param('showId', function(req, res, next, id) {
    if (!req.schedule) return next();
    req.show = req.schedule.shows.find(show => String(show.id) === id);
    next();
});

router.get('/', function(req, res, next) {
    let filter = collectFilter(req.query);
    Schedule.findOne(filter)
        .populate('shows.theatre shows.scene shows.play')
        .exec(function (err, schedule) {
            if (err) return next(err);
            if (schedule) {
                schedule.shows = filterScheduleShows(schedule, req);
            }
            let viewFilter = req.query;
            viewFilter.month = viewFilter.month || schedule.monthKey;
            res.render('admin/schedule/view', {
                title: 'Управление — Расписание',
                schedule: schedule,
                filter: viewFilter,
                theatres: req.options.theatres,
                scenes: req.options.scenes,
                months: req.options.months,
                versions: req.options.versions,
            });
        });
});

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

router.delete('/:scheduleId/show/remove/:showId', function(req, res, next) {
    if (!req.schedule || !req.show) return next();
    req.schedule.removeShow(req.show._id, function(err) {
        if (err) return next(err);
        req.flash('success', 'Спектакль удален из расписания.');
        res.end();
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

function getFormData(show, req) {
    const playUrl = (typeof show.play === 'object' && show.play.url) ? show.play.url : null;
    let formData = req.flash('body')[0] || show.toObject({depopulate: true});
    formData.playUrl = playUrl;
    return formData;
}

function filterScheduleShows(schedule, req) {
    return schedule.shows.filter(function (show) {
        return (!req.query.theatre || req.query.theatre === String(show.theatre.id)) &&
            (!req.query.scene || req.query.scene === String(show.scene.id))
    });
}

function loadOptionsData(month, year, callback) {
    let months = (function*(passedMonths, followingMonths) {
        let actualKey = moment().format('MM-YYYY');
        let date = moment();
        date.add(followingMonths, 'months');
        let totalMonths = passedMonths + followingMonths + 1;
        while (totalMonths--) {
            yield {
                key: date.format('MM-YYYY'),
                value: s.capitalize(date.format('MMMM YYYY')),
                actual: date.format('MM-YYYY') === actualKey
            };
            date.subtract(1, 'months');
        }
    })(11, 3);
    async.parallel({
        theatres: callback => Theatre.find({}).sort({title: 1}).exec(callback),
        scenes: callback => Scene.find({}).sort({title: 1}).exec(callback),
        plays: callback => Play.find({}).populate('theatre scene').sort({title: 1}).exec(callback),
        versions: callback => Schedule.find({ month: month, year: year }, { version: 1, actual: 1, _id: 0 })
            .sort({ version: -1 }).exec(callback),
        months: callback => callback(null, Array.from(months))
    }, callback);
}

function groupPlaysByTheatre(plays) {
    return plays.reduce(function(groupped, play) {
        groupped[play.theatre.id] = groupped[play.theatre.id] || { title: play.theatre.title, plays: [] };
        groupped[play.theatre.id].plays.push(play);
        return groupped;
    }, {})
}

function collectFilter(filterQuery) {
    const today = new Date();
    let filter = {
        actual: true,
        month: today.getMonth(),
        year: today.getFullYear(),
    };
    if (filterQuery.version) {
        delete filter.actual;
        filter.version = filterQuery.version;
    }
    if (filterQuery.month) {
        [filter.month, filter.year] = filterQuery.month.split('-');
        filter.month--;
    }
    return filter;
}

function buildShowEditRequest(requestBody) {
    return {
        date: moment(requestBody.date, momentDateFormat).toDate(),
        theatre: requestBody.theatre,
        scene: requestBody.scene,
        play: requestBody.play,
        price: requestBody.price,
        buyTicketUrl: requestBody['buy-ticket-url']
    };
}

module.exports = router;
