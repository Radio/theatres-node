"use strict";

let s = require('underscore.string');
let url = require('url');
let cheerio = require('cheerio');
let fetchHelper = require('helpers/fetch');
let priceHelper = require('helpers/price');
let dateHelper = require('helpers/date');

const theatreKey = 'postscriptum';
const defaultScene = 'main';
const sourceUrl = 'http://ps-teatr.com.ua/';

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
        const TEXT_NODE_TYPE = 3;
        let $ = cheerio.load(content);
        return $('.postContent blockquote').map(function (index, quote) {
            let $quote = $(quote);

            let show = {};

            show.theatre = theatreKey;
            show.scene = defaultScene;

            let $lines = $quote.find('p').filter(function(index, paragraph) {
                return $(paragraph).text().trim() !== '';
            });
            show.date = $($lines.get(0)).text();
            show.title = $($lines.get(1)).text();
            show.playUrl = $($lines.get(1)).find('a').attr('href');
            show.price = $($lines.last()).text();

            return show;

        }).get();
    }

    function translateRawShow(rawShow) {
        const show = {
            theatre: rawShow.theatre,
            scene: rawShow.scene,
            theatreRawData: {
                title: 'Post Scriptum',
                url: sourceUrl,
                hasFetcher: true
            },
            title: s.humanize(rawShow.title.replace(/“|”/g, '')),
            playUrl: url.resolve(sourceUrl, rawShow.playUrl),
            dates: []
        };
        if (rawShow.price.match(/\d/)) {
            show.price = priceHelper.normalize(rawShow.price.replace(/.*?(\d.*)/, '$1').trim())
        }

        show.dates = parseDates(rawShow.date.trim());
        if (!show.dates) {
            return null;
        }

        return show;
    }

    function parseDates(datetimeLine) {
        const dateLine = s.strLeft(datetimeLine, '(');
        const timeLine = s.strRight(datetimeLine, '(');
        const days = dateLine.match(/\d+/g);
        const monthMatch = dateLine.match(new RegExp(dateHelper.getMonthsNames('ua').join('|')));
        const times = timeLine.match(/\d+[.:]\d+/g);
        if (!monthMatch || !days || !times) {
            return [];
        }
        const mappedMonth = dateHelper.mapMonth(monthMatch[0].toLowerCase(), 'ua');
        if (mappedMonth < 0) {
            console.warn('PS: Unable to map month: ' + rawShow.date[2].toLowerCase());
            return null;
        }
        const mappedYear = mappedMonth > month ? year : year + 1;
        let dates = [];
        if (days.length === 1 || times.length > 1) {
            times.forEach(function (time) {
                dates.push(new Date(mappedYear, mappedMonth, days[0], ...time.split(/[.:]/)))
            });
        } else if (days.length > 1 || times.length === 1) {
            days.forEach(function(day) {
                dates.push(new Date(mappedYear, mappedMonth, day, ...times[0].split(/[.:]/)))
            });
        } else {
            for (let i = 0; i < days.length; i++) {
                let time = typeof times[i] !== 'undefined' ? times[i] : times[0];
                dates.push(new Date(mappedYear, mappedMonth, days[i], ...time.split(/[.:]/)))
            }
        }
        return dates;
    }
};

module.exports.fetch = fetcher;