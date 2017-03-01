"use strict";

let s = require('underscore.string');
let url = require('url');
let cheerio = require('cheerio');
let fetchHelper = require('helpers/fetch');
let dateHelper = require('helpers/date');

const theatreKey = 'novascena';
const baseUrl = 'http://novascena.org';
const sourceUrl = baseUrl + '/?page=playbills';

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
        return $('.slider>ul>li').map(function (index, li) {
            let $li = $(li);
            let show = {};

            show.theatre = theatreKey;
            show.scene = defaultScene;
            show.date = $li.find('.date').text();
            const $image = $li.find('img');
            show.title = $image.attr('alt');
            show.image = $image.attr('src');
            const $links = $li.find('.links-list li a');
            show.url = $($links.get(0)).attr('href');
            show.playUrl = $($links.get(1)).attr('href');
            show.buyTicketUrl = $li.find('a.buy').attr('href');

            return show;
        }).get();
    }

    function translateRawShow(rawShow) {
        const dateRegExp = new RegExp('(\\d+:\\d+)\\s+\/\\s+(\\d+)\\s+(' +
            dateHelper.getMonthsNames('ru_short').join('|') + ')\\s+(\\d+)', 'i');
        const dateMatch = rawShow.date.match(dateRegExp);
        if (!dateMatch) {
            console.warn('Novascena: Unable to parse date: ' + rawShow.date);
            return null;
        }
        const mappedTime = dateMatch[1];
        const mappedDay = dateMatch[2];
        const mappedMonth = dateHelper.mapMonth(dateMatch[3].toLowerCase(), 'ru');
        if (mappedMonth < 0) {
            console.warn('Novascena: Unable to map month: ' + dateMatch[3].toLowerCase().toLowerCase());
            return null;
        }
        const mappedYear = dateMatch[4];
        const show = {
            theatre: rawShow.theatre,
            theatreRawData: {
                title: 'ЦИC «Новая Сцена»',
                url: baseUrl,
                hasFetcher: true,
            },
            title: rawShow.title,
            scene: rawShow.scene,
            date: new Date(mappedYear, mappedMonth, mappedDay, ...mappedTime.split(':')),
            image: url.resolve(sourceUrl, rawShow.image),
            url: url.resolve(sourceUrl, rawShow.url),
            playUrl: url.resolve(sourceUrl, rawShow.playUrl),
        };
        if (rawShow.buyTicketUrl) {
            show.buyTicketUrl = url.resolve(sourceUrl, rawShow.buyTicketUrl);
        }
        return show;
    }
};

module.exports.fetch = fetcher;