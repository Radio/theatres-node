"use strict";

let s = require('underscore.string');
let url = require('url');
let cheerio = require('cheerio');
let fetchHelper = require('helpers/fetch');

const theatreKey = 'puppet';
const baseUrl = 'http://puppet.kharkov.ua';
const sourceUrl = baseUrl + '/afisha.html';

const defaultScene = 'main';

const monthsMap = {
    'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3,
    'мая': 4, 'июня': 5, 'июля': 6, 'августа': 7,
    'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11,
};
let monthsNames = [];
for (let monthName in monthsMap) monthsNames.push(monthName);

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
        const translatedShows = parsedShows.map(translateRawShow);
        return translatedShows.reduce(splitShowsByDate, []);
    }

    function parseShows(content) {
        const TEXT_NODE_TYPE = 3;
        let $ = cheerio.load(content);
        return $('.afisha').map(function (index, li) {
            let $li = $(li);
            let show = {};

            show.theatre = theatreKey;
            show.date = $li.find('.date-afisha strong').text();
            const timeNode = $li.find('.name-perform b');
            show.time = timeNode.html(timeNode.html().replace(/<br ?\/?>/g, "\n")).text();
            show.image = $li.find('.date-afisha img').attr('src');
            show.title = $li.find('.name-perform a').first().text();
            show.playUrl = $li.find('.name-perform a').first().attr('href');
            show.scene = defaultScene;
            show.forKids = $li.find('.name-perform').text().indexOf('для взрослых') < 0;
            show.premiere = $li.find('.name-perform').text().indexOf('премьера') >= 0;
            show.duration = $li.find('.name-perform')
                .contents()
                .filter(function() { return s.startsWith(this.nodeValue, 'Продолжительность'); })
                .text();
            show.genre = $li.find('.name-perform strong').text();

            return show;
        }).get();
    }

    function translateRawShow(rawShow) {
        const monthMatch = rawShow.date.match(new RegExp(monthsNames.join('|'), 'i'));
        const mappedDay = rawShow.date.replace(/\D/g, '');
        const mappedMonth = mapMonth(monthMatch[0].toLowerCase());
        const mappedYear = mappedMonth >= month ? year : year + 1;

        const show = {
            theatre: rawShow.theatre,
            theatreRawData: {
                title: 'Театр кукол',
                url: baseUrl,
                hasFetcher: true
            },
            dates: [],
            title: s.humanize(rawShow.title),
            scene: rawShow.scene,
            duration: rawShow.duration.replace(/.*?(\d.*)/, '$1').trim(),
            author: rawShow.author,
            genre: rawShow.genre,
            premiere: rawShow.premiere,
            forKids: rawShow.forKids
        };
        if (rawShow.image) {
            show.image = url.resolve(sourceUrl, rawShow.image);
        }
        if (rawShow.playUrl) {
            show.playUrl = url.resolve(sourceUrl, rawShow.playUrl);
        }
        rawShow.time.match(/\d+:\d+/g).forEach(function(time) {
            show.dates.push(new Date(mappedYear, mappedMonth, mappedDay, ...time.split(':')))
        });

        return show;
    }

    function mapMonth(textualMonth) {
        if (typeof monthsMap[textualMonth] === 'undefined') {
            return null;
        }
        return monthsMap[textualMonth];
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
};

module.exports.fetch = fetcher;