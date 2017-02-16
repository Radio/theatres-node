"use strict";

let s = require('underscore.string');
let url = require('url');
let cheerio = require('cheerio');
let fetchHelper = require('helpers/fetch');

const theatreKey = 'beautiful-flowers';
const sourceUrl = 'http://gobananas.com.ua/';

const defaultTime = '19:00'; // todo: there might be two same plays at different time.
const defaultScene = 'main';

const monthsMap = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
};

let pushkin = function(callback) {

    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();

    fetchHelper.getContent(sourceUrl, function(err, content) {
        if (err) return callback(err);
        callback(null, getSchedule(content));
    });

    function getSchedule(content) {
        return parseShows(content)
            .map(translateRawShow);
    }

    function parseShows(content) {
        let $ = cheerio.load(content);
        return $('.afisha .afisha-card').map(function (index, div) {
            let $div = $(div);
            let show = {};
            show.theatre = theatreKey;
            show.scene = defaultScene;
            show.title = $div.find('h2').text();
            show.url = $div.find('h2 a').attr('href');
            show.month = $div.find('.date .month').text();
            show.day = $div.find('.date .day').text();
            show.buyTicketUrl = $div.find('.buy-ticket').attr('href');

            return show;
        }).get();
    }

    function translateRawShow(rawShow) {
        let mappedMonth = monthsMap[rawShow.month.toLowerCase()];
        if (typeof mappedMonth === 'undefined') {
            mappedMonth = month;
        }
        return {
            theatre: rawShow.theatre,
            scene: rawShow.scene,
            title: rawShow.title,
            url: url.resolve(sourceUrl, rawShow.url),
            date: new Date(year, mappedMonth, rawShow.day, ...defaultTime.split(':')),
            buyTicketUrl: url.resolve(sourceUrl, rawShow.buyTicketUrl)
        };
    }
};

module.exports.fetch = pushkin;