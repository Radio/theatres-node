"use strict";

let s = require('underscore.string');
let url = require('url');
let cheerio = require('cheerio');
let fetchHelper = require('../helper');
let dateHelper = require('helpers/date');

const theatreKey = 'beautiful-flowers';
const sourceUrl = 'http://gobananas.com.ua/';

const defaultTime = '19:00'; // todo: there might be two same plays at different time.
const defaultScene = 'main';

let pushkin = function(callback) {

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
        return $('.afisha .afisha-card').map(function (index, div) {
            let $div = $(div);
            let show = {};
            show.theatre = theatreKey;
            show.scene = defaultScene;
            show.title = $div.find('h2').text();
            show.playUrl = $div.find('h2 a').attr('href');
            show.month = $div.find('.date .month').text();
            show.day = $div.find('.date .day').text();
            show.buyTicketUrl = $div.find('.buy-ticket').attr('href');

            return show;
        }).get();
    }

    function translateRawShow(rawShow) {
        let mappedMonth = dateHelper.mapMonth(rawShow.month.toLowerCase(), 'en');
        if (typeof mappedMonth < 0) {
            mappedMonth = month;
        }
        return {
            date: new Date(year, mappedMonth, rawShow.day, ...defaultTime.split(':')),
            play: {
                theatre: {
                    key: rawShow.theatre,
                    title: 'Прекрасные цветы',
                    url: sourceUrl,
                    hasFetcher: true,
                    houseSlug: 'teatr-prekrasny-e-tsvety'
                },
                scene: { key: rawShow.scene },
                title: rawShow.title,
                url: url.resolve(sourceUrl, rawShow.playUrl),
            },
            buyTicketUrl: url.resolve(sourceUrl, rawShow.buyTicketUrl)
        };
    }
};

module.exports.fetch = pushkin;