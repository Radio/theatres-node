"use strict";

let s = require('underscore.string');
let url = require('url');
let cheerio = require('cheerio');
let priceHelper = require('helpers/price');
let fetchHelper = require('../helper');
let dateHelper = require('helpers/date');

const theatreKey = 'madrigal';
const baseUrl = 'http://madrigal.org.ua';
const sourceUrl= baseUrl + '/afisha';

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
        return $('#dAnnouncementBlock .cliRowStyle').map(function (index, li) {
            let $li = $(li);
            let show = {};

            show.theatre = theatreKey;
            show.scene = defaultScene;

            let $photoColumn = $li.find('.photo');
            let $contentColumn = $li.find('.content');
            let $additionalColumn = $li.find('.additional');

            show.date = $photoColumn.find('.itemHeader').text();
            show.time = $additionalColumn.find('.itemHeader').text();
            show.image = $photoColumn.find('img').attr('src');
            show.title = $contentColumn.find('.itemHeader').text();
            show.playUrl = $contentColumn.find('.itemHeader a').attr('href');
            show.price = $additionalColumn.find('.Prise').text();
            show.buyTicketUrl = $additionalColumn.find('.orderButton').attr('href');

            return show;
        }).get();
    }

    function translateRawShow(rawShow) {
        let date = parseDate(rawShow);
        if (!date) {
            return null;
        }
        const show = {
            date: date,
            play: {
                theatre: {
                    key: rawShow.theatre,
                    title: 'Мадригал',
                    url: baseUrl,
                    hasFetcher: true,
                },
                scene: { key: rawShow.scene },
                title: s.humanize(rawShow.title),
            },
            price: priceHelper.normalize(rawShow.price)
        };
        if (rawShow.playUrl) {
            show.play.url = url.resolve(sourceUrl, rawShow.playUrl);
        }
        if (rawShow.image) {
            show.play.image = url.resolve(sourceUrl, rawShow.image);
        }
        if (rawShow.buyTicketUrl) {
            show.buyTicketUrl = url.resolve(sourceUrl, rawShow.buyTicketUrl);
        }
        return show;
    }

    function parseDate(rawShow) {
        const day = rawShow.date.replace(/\D/g, '');
        const monthMatch = rawShow.date.match(new RegExp(dateHelper.getMonthsNames('ru').join('|'), 'i'));
        const timeMatch = rawShow.time.match(/\d+:\d+/);
        if (!monthMatch || !day || !timeMatch) {
            return null;
        }
        const mappedMonth = dateHelper.mapMonth(monthMatch[0].toLowerCase(), 'ru');
        if (mappedMonth < 0) {
            console.warn('Madrigal: Unable to map month: ' + monthMatch[0].toLowerCase());
            return null;
        }
        const mappedYear = mappedMonth >= month ? year : year + 1;

        return new Date(mappedYear, mappedMonth, day, ...timeMatch[0].split(':'))
    }
};

module.exports.fetch = fetcher;