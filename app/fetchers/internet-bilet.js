"use strict";

let s = require('underscore.string');
let url = require('url');
let cheerio = require('cheerio');
let priceHelper = require('helpers/price');
let fetchHelper = require('helpers/fetch');
let dateHelper = require('helpers/date');

let internetBiletFetcher = function(theatreKey, sceneKey, sourceUrl, theatreRawData) {

    return function (callback) {

        const today = new Date();
        const month = today.getMonth();
        const year = today.getFullYear();

        fetchHelper.getContent(sourceUrl, function (err, content) {
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
            return $('.events-table-style tr').map(function (index, li) {
                let $li = $(li);
                let show = {};

                show.theatre = theatreKey;
                show.scene = sceneKey;
                show.date = $li.find('.event-date').text();
                const $titleLink = $li.find('.event-title a');
                show.title = $titleLink.text();
                show.url = $titleLink.attr('href');
                show.image = $li.find('.img-item img').attr('src');
                show.price = $li.find('.price-item strong').text();
                show.buyTicketUrl = $li.find('.tickets-wrap a').attr('href');

                return show;
            }).get();
        }

        function translateRawShow(rawShow) {
            const date = parseDate(rawShow.date);
            if (!date) {
                return null;
            }
            return {
                theatre: rawShow.theatre,
                theatreRawData: theatreRawData,
                scene: rawShow.scene,
                date: date,
                title: rawShow.title,
                url: url.resolve(sourceUrl, rawShow.url),
                image: url.resolve(sourceUrl, (rawShow.image || '').replace('size1', 'original')),
                price: priceHelper.normalize(rawShow.price),
                buyTicketUrl: url.resolve(sourceUrl, rawShow.buyTicketUrl),
            };
        }

        function parseDate(dateString) {
            const monthsNames = dateHelper.getMonthsNames('ru');
            const dateRegExp = new RegExp('(\\d+)\\s+(' + monthsNames.join('|') + '),\\s+(\\d+:\\d+)', 'i');
            let dateMatch = dateString.match(dateRegExp);
            if (!dateMatch) {
                return null;
            }
            const mappedMonth = dateHelper.mapMonth(dateMatch[2].toLowerCase(), 'ru');
            if (mappedMonth < 0) {
                console.warn('Internet Bilet (' + theatreKey + '): Unable to map month: ' + dateMatch[2].toLowerCase());
                return null;
            }
            const mappedYear = mappedMonth >= month ? year : year + 1;

            return new Date(mappedYear, mappedMonth, dateMatch[1], ...dateMatch[3].split(':'));
        }
    };
};

module.exports = internetBiletFetcher;