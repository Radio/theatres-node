"use strict";

let request = require('request');
let encoding = require('encoding');
let s = require('underscore.string');
let cheerio = require('cheerio');
let url = require('url');
let priceHelper = require('helpers/price');
let async = require('async');

const theatreKey = 'shevchenko';
const sourceUrl = 'http://www.theatre-shevchenko.com.ua/repertuar/month.php?id=';

const defaultScene = 'big';
const sceneMap = {
    'Мала сцена': 'small',
    'Експериментальна сцена': 'exp',
    'Велика сцена': 'big',
};

let shevchenko = function(callback) {

    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();

    let perMonthFetchers = [0, 1, 2].map(function(monthDelta) {
        return function(callback) {
            let yearToParse = year;
            let monthToParse = month + monthDelta;
            if (monthToParse > 11) {
                monthToParse = 11 - monthToParse;
                yearToParse += 1;
            }
            getRelevantContent(sourceUrl + (monthToParse + 1), function(err, content) {
                if (err) return callback(err);
                callback(null, getSchedule(content, monthToParse, yearToParse));
            });
        }
    });
    async.parallel(perMonthFetchers, function(err, results) {
        if (err) return callback(err);
        callback(null, Array.prototype.concat.apply([], results));
    });

    function getSchedule(content, month, year) {
        return parseShows(content, month, year)
            .map(translateRawShow);
    }

    function parseShows(content, month, year) {
        const TEXT_NODE_TYPE = 3;
        let $ = cheerio.load(content);
        return $('.primer-list li').map(function (index, li) {
            let $li = $(li);
            return {
                theatre: theatreKey,
                title: $li.find('h3').text(),
                url: $li.find('h3 a').attr('href'),
                date: $li.find('.date').text(),
                month: month,
                year: year,
                scene: $li.find('em')
                    .contents()
                    .filter(function() { return this.nodeType === TEXT_NODE_TYPE; })
                    .text().trim(),
                price: $li.find('.prices').text()
            };
        }).get();
    }

    function translateRawShow(rawShow) {
        const dateParts = /(\d+).+(\d\d)[.:](\d\d)/u.exec(rawShow.date);
        return {
            theatre: rawShow.theatre,
            title: rawShow.title.replace(/\s+/, ' '),
            url: url.resolve(sourceUrl, rawShow.url),
            date: dateParts ?
                new Date(rawShow.year, rawShow.month, dateParts[1], dateParts[2], dateParts[3], 0) :
                null,
            scene: sceneMap[rawShow.scene] || defaultScene,
            price: /\d/.test(rawShow.price) ?
                priceHelper.normalize(s.strRight(rawShow.price, 'квиток коштує ')) :
                null,
        };
    }

    function getRelevantContent(url, callback) {
        let options = {
            url: url,
            method: 'GET',
            encoding: 'binary'
        };
        request(options, function (err, response, body) {
            if (err) return callback(err);
            if (response.statusCode !== 200) {
                return callback(new Error('Failed to get the page contents. ' +
                    'Server responded with ' + response.statusCode));
            }

            let utf8BodyBuffer = encoding.convert(body, 'utf-8', 'cp1251');

            callback(null, utf8BodyBuffer.toString());
        });
    }
};

module.exports.fetch = shevchenko;