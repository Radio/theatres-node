"use strict";

let s = require('underscore.string');
let url = require('url');
let cheerio = require('cheerio');
let fetchHelper = require('helpers/fetch');

const theatreKey = 'pushkin';
const baseUrl = 'http://rusdrama.com';
const sourceUrl = baseUrl + '/afisha';

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
        const TEXT_NODE_TYPE = 3;
        let $ = cheerio.load(content);
        return $('.afisha').map(function (index, li) {
            let $li = $(li);
            let show = {};

            show.theatre = theatreKey;
            show.date = $li.find('.date-afisha strong').text();
            show.time = $li.find('.name-perform b').text();
            show.image = $li.find('.date-afisha img').attr('src');
            show.title = $li.find('h3').text();
            show.playUrl = $li.find('h3 a').attr('href');
            show.scene = defaultScene;
            show.buyTicketUrl = $li.find('.vkino-link').attr('href');
            show.premiere = $li.find('.name-perform').text().indexOf('премьера') >= 0;
            show.duration = $li.find('.name-perform')
                .contents()
                .filter(function() { return s.startsWith(this.nodeValue, 'Продолжительность'); })
                .text();
            let authorAndGenre = $li.find('.name-perform strong').first()
                .contents()
                .filter(function() { return this.nodeType === TEXT_NODE_TYPE; })
                .map((index, element) => element.nodeValue);
            show.author = authorAndGenre.get(0);
            show.genre = authorAndGenre.get(1);

            return show;
        }).get();
    }

    function translateRawShow(rawShow) {
        const monthMatch = rawShow.date.match(new RegExp(fetchHelper.getMonthsNames('ru').join('|'), 'i'));
        const mappedMonth = fetchHelper.mapMonth(monthMatch[0].toLowerCase(), 'ru');
        if (mappedMonth < 0) {
            console.warn('Pushkin: Unable to map month: ' + rawShow.date[2].toLowerCase());
            return null;
        }
        const mappedYear = mappedMonth >= month ? year : year + 1;

        const show = {
            theatre: rawShow.theatre,
            theatreRawData: {
                title: 'Театр имени Пушкина',
                url: baseUrl,
                hasFetcher: true
            },
            title: s.humanize(rawShow.title),
            date: new Date(mappedYear, mappedMonth, rawShow.date.replace(/\D/g, ''), ...rawShow.time.split(':')),
            scene: rawShow.scene,
            buyTicketUrl: url.resolve(sourceUrl, rawShow.buyTicketUrl),
            duration: rawShow.duration.replace(/.*?(\d.*)/, '$1').trim(),
            author: rawShow.author,
            genre: rawShow.genre,
            premiere: rawShow.premiere
        };
        if (rawShow.image) {
            show.image = url.resolve(sourceUrl, rawShow.image);
        }
        if (rawShow.playUrl) {
            show.playUrl = url.resolve(sourceUrl, rawShow.playUrl);
        }
        return show;
    }
};

module.exports.fetch = fetcher;