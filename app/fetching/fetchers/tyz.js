"use strict";

let s = require('underscore.string');
let url = require('url');
let cheerio = require('cheerio');
let fetchHelper = require('../helper');

const theatreKey = 'tyz';
const sourceUrl = 'http://tyz.kharkov.ua';

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

            show.theatre = theatreKey;
            show.scene = /МАЛІЙ СЦЕНІ/i.test($li.text()) ? 'small' : 'main';
            show.date = $li.find('time').attr('datetime');
            show.title = $li.find('>strong').text();
            show.playUrl = $li.find('strong a').attr('href');
            show.premiere = $li.text().match(/ПРЕМ'ЄРА|премьера/i) !== null;

            return show;
        }).get();
    }

    function translateRawShow(rawShow) {
        let [dateString, timeString] = rawShow.date.split(' ');
        let [year, month, day, hour, minute] = [...dateString.split('-'), ... timeString.split(':')];
        const date = new Date(year, month - 1, day, hour, minute);
        let show = {
            date: date,
            play: {
                theatre: {
                    key: rawShow.theatre,
                    title: 'Театр юного зрителя',
                    url: sourceUrl,
                    hasFetcher: true,
                },
                scene: { key: rawShow.scene },
                title: s.humanize(rawShow.title.replace(/^[«"](.*)[»"]$/, '$1')),
                premiere: rawShow.premiere,
            }
        };
        if (rawShow.playUrl) {
            show.play.url = url.resolve(sourceUrl, rawShow.playUrl);
        }
        return show;
    }
};

module.exports.fetch = fetcher;