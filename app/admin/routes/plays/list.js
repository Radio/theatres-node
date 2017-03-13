"use strict";

const list = require('admin/commands/plays/list');

module.exports = function(router) {

    router.get('/', function(req, res, next) {
        req.session.playsBackUrl = req.originalUrl;
        const filter = collectFilter(req.query);
        list(filter, function (err, plays) {
            if (err) return next(err);
            res.render('plays/list', {
                title: 'Спектакли',
                plays: plays,
                filter: req.query,
                theatres: req.options.theatres,
                scenes: req.options.scenes,
                backUrl: req.session.playsBackUrl
            });
        });
    });

    function collectFilter(filterQuery) {
        let filter = {};
        if (filterQuery.query) {
            filter.query = filterQuery.query;
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