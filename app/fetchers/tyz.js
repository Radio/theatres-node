"use strict";

let s = require('underscore.string');
let url = require('url');
let cheerio = require('cheerio');
let fetchHelper = require('helpers/fetch');

const theatreKey = 'tyz';
const sourceUrl = 'http://tyz.kharkov.ua';

const defaultScene = 'main';

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
        return $('.affisha li').map(function (index, li) {
            let $li = $(li);
            let show = {};

            const $titleLink = $li.find('strong a');
            show.theatre = theatreKey;
            show.scene = defaultScene;
            show.date = $li.find('time').attr('datetime');
            show.title = $titleLink.text();
            show.playUrl = $titleLink.attr('href');
            show.premiere = $li.text().match(/ПРЕМ'ЄРА|премьера/i) !== null;

            return show;
        }).get();
    }

    function translateRawShow(rawShow) {
        let [dateString, timeString] = rawShow.date.split(' ');
        let [year, month, day, hour, minute] = [...dateString.split('-'), ... timeString.split(':')];
        const date = new Date(year, month - 1, day, hour, minute);
        return {
            theatre: rawShow.theatre,
            theatreRawData: {
                title: 'Театр юного зрителя',
                url: sourceUrl,
                hasFetcher: true,
            },
            title: s.humanize(rawShow.title.replace(/^[«"](.*)[»"]$/, '$1')),
            playUrl: url.resolve(sourceUrl, rawShow.playUrl),
            date: date,
            scene: rawShow.scene,
            premiere: rawShow.premiere,
        };
    }
};

module.exports.fetch = fetcher;