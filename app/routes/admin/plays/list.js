"use strict";

let escapeStringRegexp = require('escape-string-regexp');
let Play = require('models/play');

module.exports = function(router) {

    router.get('/', function(req, res, next) {
        let filter = collectFilter(req.query);
        Play.find(filter)
            .populate('theatre scene')
            .sort({title: 1})
            .exec(function (err, plays) {
                if (err) return next(err);
                res.render('admin/plays/list', {
                    title: 'Управление — Спектакли',
                    plays: plays,
                    filter: req.query,
                    theatres: req.options.theatres,
                    scenes: req.options.scenes,
                });
            });
    });

    function collectFilter(filterQuery) {
        let filter = {};
        if (filterQuery.query) {
            const regexCondition = { '$regex': new RegExp(escapeStringRegexp(filterQuery.query), 'i') };
            filter['$or'] = [
                { title: regexCondition },
                { key: regexCondition }
            ];
        }
        if (filterQuery.theatre) {
            filter.theatre = filterQuery.theatre;
        }
        if (filterQuery.scene) {
            filter.scene = filterQuery.scene;
        }
        return filter;
    }
};