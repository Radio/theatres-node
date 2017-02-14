"use strict";

let request = require('request');
let s = require('underscore.string');
let cheerio = require('cheerio');
let priceHelper = require('helpers/price');
let url = require('url');

const theatreKey = 'postscriptum';
const defaultScene = 'main';
const sourceUrl = 'http://ps-teatr.com.ua/';

const monthsMap = {
    'січня': 0,
    'лютого': 1,
    'березня': 2,
    'квітня': 3,
    'травня': 4,
    'червня': 5,
    'липня': 6,
    'серпня': 7,
    'вересня': 8,
    'жовтня': 9,
    'листопада': 10,
    'грудня': 11,
};
let monthsNames = [];
for (let monthName in monthsMap) monthsNames.push(monthName);

let fetcher = function(callback) {

    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();

    getContent(sourceUrl, function(err, content) {
        if (err) return callback(err);
        callback(null, getSchedule(content));
    });

    function getSchedule(content) {
        const parsedShows = parseShows(content);
        const translatedShows = parsedShows.map(translateRawShow);
        return translatedShows.reduce(splitShowsByDate, []);
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
            show.url = $($lines.get(1)).find('a').attr('href');
            show.price = $($lines.last()).text();

            return show;

        }).get();
    }

    function translateRawShow(rawShow) {
        const theatreKey = s(rawShow.theatre.url).strRightBack('/').value();
        const show = {
            theatre: rawShow.theatre,
            scene: rawShow.scene,
            theatreRawData: {
                title: 'Post Scriptum',
                url: sourceUrl,
                hasFetcher: true
            },
            title: s.humanize(rawShow.title.replace(/“|”/g, '')),
            url: url.resolve(sourceUrl, rawShow.url),
            dates: []
        };
        if (rawShow.price.match(/\d/)) {
            show.price = priceHelper.normalize(rawShow.price.replace(/.*?(\d.*)/, '$1').trim())
        }

        show.dates = parseDates(rawShow.date.trim());

        return show;
    }

    function parseDates(datetimeLine) {
        const dateLine = s.strLeft(datetimeLine, '(');
        const timeLine = s.strRight(datetimeLine, '(');
        const days = dateLine.match(/\d+/g);
        const monthMatch = dateLine.match(new RegExp(monthsNames.join('|')));
        const times = timeLine.match(/\d+[.:]\d+/g);
        if (!monthMatch || !days || !times) {
            return [];
        }
        const mappedMonth = mapMonth(monthMatch[0].toLowerCase());
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

    function splitShowsByDate(splitShows, show) {
        show.dates.forEach(function(date) {
            let clonedShow = Object.assign({}, show);
            delete clonedShow.dates;
            clonedShow.date = date;
            splitShows.push(clonedShow);
        });

        return splitShows;
    }

    function mapMonth(textualMonth) {
        if (typeof monthsMap[textualMonth] === 'undefined') {
            return null;
        }
        return monthsMap[textualMonth];
    }

    function getContent(url, callback) {
        request(url, function (err, response, body) {
            if (err) return callback(err);
            if (response.statusCode !== 200) {
                return callback(new Error('Failed to get the page contents. ' +
                    'Server responded with ' + response.statusCode));
            }
            callback(null, body);
        });
    }
};

module.exports.fetch = fetcher;