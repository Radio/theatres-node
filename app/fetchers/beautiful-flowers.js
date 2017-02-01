"use strict";

let request = require('request');
let s = require('underscore.string');
let cheerio = require('cheerio');
let url = require('url');

const sourceUrl = 'http://gobananas.com.ua/';

const defaultTime = '19:00';

const monthsMap = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
};

let pushkin = function(month, year, callback) {

    getRelevantContent(sourceUrl, function(err, content) {
        if (err) return callback(err);
        callback(null, getSchedule(content));
    });

    function getSchedule(content) {
        return parseShows(content)
            .map(translateRawShow);
    }

    function parseShows(content) {
        const TEXT_NODE_TYPE = 3;
        let $ = cheerio.load(content);
        return $('.afisha .afisha-card').map(function (index, div) {
            let $div = $(div);
            let show = {};
            show.title = $div.find('h2').text();
            show.url = $div.find('h2 a').attr('href');
            show.month = $div.find('.date .month').text();
            show.day = $div.find('.date .day').text();
            show.buyTicketUrl = $div.find('.buy-ticket').attr('href');

            return show;
        }).get();
    }

    function translateRawShow(rawShow) {
        return {
            title: rawShow.title,
            url: url.resolve(sourceUrl, rawShow.url),
            date: new Date(year, (monthsMap[rawShow.month.toLowerCase()] || month) - 1, rawShow.day, ...defaultTime.split(':')),
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