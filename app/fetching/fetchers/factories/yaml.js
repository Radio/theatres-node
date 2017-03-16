"use strict";

const YAML = require('yamljs');
const priceHelper = require('helpers/price');
const fetchHelper = require('../../helper');

let yamlFetcher = function(path) {

    return function (callback) {

        YAML.load(path, function (content) {
            // if (!content) return callback(new Error('YAML content not found at path: ' + path));
            if (!content) return callback(null, []);
            callback(null, getSchedule(content));
        });

        function getSchedule(content) {
            const parsedShows = parseShows(content);
            const translatedShows = parsedShows.map(translateRawShow).filter(show => show !== null);
            return translatedShows.reduce(fetchHelper.splitShowByDates, []);
        }

        function parseShows(content) {
            return content.schedule;
        }

        function translateRawShow(rawShow) {
            let show = Object.assign({}, rawShow);
            if (show.date) {
                show.date = new Date(show.date);
            }
            if (show.dates) {
                show.dates = show.dates.map(date => new Date(date));
            }
            if (show.theatre) {
                show.theatre = unbox(show.theatre);
            }
            if (show.scene) {
                show.scene = unbox(show.scene);
            }
            if (show.play.theatre) {
                show.play.theatre = unbox(show.play.theatre);
            }
            if (show.play.scene) {
                show.play.scene = unbox(show.play.scene);
            }
            if (show.price) {
                show.price = priceHelper.normalize(show.price);
            }
            return show;
        }

        function unbox(key) {
            return typeof key === 'object' ? key : { key: key }
        }
    };
};

module.exports = yamlFetcher;