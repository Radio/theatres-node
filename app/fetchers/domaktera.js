"use strict";

let s = require('underscore.string');
let url = require('url');
let cheerio = require('cheerio');
let fetchHelper = require('helpers/fetch');

const sourceUrl = 'http://domaktera.kharkiv.ua/afisha';
const defaultTheatreKey = 'domaktera';
const defaultTheatreRawData = {
    title: 'Дом Актера',
    url: 'http://domaktera.kharkiv.ua/',
    hasFetcher: true
};

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
        return $('td:not(.day)').map(function (index, td) {
            let $td = $(td);
            let scene = $td.is(':last-child') ? 'small' : 'main';

            return $td.find('.show').map(function (index, div) {
                let $div = $(div);

                let show = {};

                const $titleLink = $div.find('[itemprop="name"] a');
                const $theatreLink = $div.find('[itemprop="performer"] a');
                show.theatre = {
                    url: $theatreLink.attr('href'),
                    title: $theatreLink.text(),
                };
                show.scene = scene;
                show.date = $div.find('time').attr('datetime');
                show.title = $titleLink.text();
                show.playUrl = $titleLink.attr('href');

                return show;
            }).get();

        }).get();
    }

    function translateRawShow(rawShow) {
        let [dateString, timeString] = rawShow.date.split('T');
        let [year, month, day, hour, minute] = [...dateString.split('-'), ... timeString.split(':')];
        const date = new Date(year, month - 1, day, hour, minute);
        let theatreKey = s(rawShow.theatre.url).strRightBack('/').value();
        let theatreRawData = {
            title: rawShow.theatre.title,
            url: rawShow.theatre.url,
            hasFetcher: false,
            houseSlug: theatreKey,
        };
        if (theatreKey === 'afisha' || !theatreKey) {
            theatreKey = defaultTheatreKey;
            theatreRawData = defaultTheatreRawData;
        }
        return {
            theatre: theatreKey,
            theatreRawData: theatreRawData,
            title: rawShow.title,
            playUrl: url.resolve(sourceUrl, rawShow.playUrl),
            date: date,
            scene: rawShow.scene,
        };
    }
};

module.exports.fetch = fetcher;