"use strict";

let request = require('request');
let s = require('underscore.string');
let cheerio = require('cheerio');
let url = require('url');

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

    getRelevantContent(sourceUrl, function(err, content) {
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

    function getRelevantContent(url, callback) {
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

module.exports.fetch = pushkin;