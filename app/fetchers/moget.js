"use strict";

let s = require('underscore.string');
let url = require('url');
let cheerio = require('cheerio');
let fetchHelper = require('helpers/fetch');
let dateHelper = require('helpers/date');

const theatreKey = 'moget';
const baseUrl = 'http://moget.com.ua';
const sourceUrl = baseUrl + '/afisha';

const defaultScene = 'main';
const defaultTime = '19:00';

let fetcher = function(callback) {

    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();

    fetchHelper.getContent(sourceUrl, function(err, content) {
        if (err) return callback(err);
        callback(null, getSchedule(content));
    });

    function getSchedule(content) {
        const parsedShows = parseShows(content);
        const translatedShows = parsedShows.map(translateRawShow).filter(show => show !== null);
        return translatedShows.reduce(fetchHelper.splitShowByDates, []);
    }

    function parseShows(content) {
        let $ = cheerio.load(content);
        return $('.region.region-bottom .views-row').map(function (index, li) {
            let $li = $(li);
            let show = {};

            show.theatre = theatreKey;
            show.scene = defaultScene;
            show.dates = $li.find('.date-display-single').map((index, span) => $(span).attr('content')).get();
            const $link = $li.find('.views-field-title a');
            show.playUrl = $link.attr('href');
            show.title = $link.text();
            show.image = $li.find('img').attr('src');

            return show;
        }).get();
    }

    function translateRawShow(rawShow) {
        const show = {
            theatre: rawShow.theatre,
            theatreRawData: {
                title: 'Театр «Может быть»',
                url: baseUrl,
                hasFetcher: true,
            },
            title: rawShow.title.replace(/«|»/g, '').trim(),
            scene: rawShow.scene,
            dates: rawShow.dates.map(function(dateString) {
                let date = new Date(dateString);
                date.setHours(19, 0);
                return date;
            }),
            image: url.resolve(sourceUrl, rawShow.image),
            playUrl: url.resolve(sourceUrl, rawShow.playUrl),
        };
        return show;
    }
};

module.exports.fetch = fetcher;