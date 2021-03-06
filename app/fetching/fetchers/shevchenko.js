"use strict";

let s = require('underscore.string');
let url = require('url');
let cheerio = require('cheerio');
let async = require('async');
let priceHelper = require('helpers/price');
let fetchHelper = require('../helper');

const theatreKey = 'shevchenko';
const baseUrl = 'http://www.theatre-shevchenko.com.ua';
const sourceUrl = baseUrl + '/repertuar/month.php?id=';

const defaultScene = 'big';
const sceneMap = {
    'Мала сцена': 'small',
    'Експериментальна сцена': 'exp',
    'Велика сцена': 'big',
};

let fetcher = function(callback) {

    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();

    async.map([0, 1, 2], function(monthDelta, callback) {
        let yearToParse = year;
        let monthToParse = month + monthDelta;
        if (monthToParse > 11) {
            monthToParse = 11 - monthToParse;
            yearToParse += 1;
        }
        fetchHelper.getContent(sourceUrl + (monthToParse + 1), function(err, content) {
            if (err) return callback(err);
            callback(null, getSchedule(content, monthToParse, yearToParse));
        });
    }, function(err, results) {
        if (err) return callback(err);
        callback(null, Array.prototype.concat.apply([], results));
    });

    function getSchedule(content, month, year) {
        const parsedShows = parseShows(content, month, year);
        const translatedShows = parsedShows.map(translateRawShow).filter(show => show !== null);
        return translatedShows.reduce(fetchHelper.splitShowByDates, []);
    }

    function parseShows(content, month, year) {
        const TEXT_NODE_TYPE = 3;
        let $ = cheerio.load(content);
        return $('.primer-list li').map(function (index, li) {
            let $li = $(li);
            return {
                theatre: theatreKey,
                title: $li.find('h3').text(),
                playUrl: $li.find('h3 a').attr('href'),
                date: $li.find('.date').text(),
                premiere: !!$li.find('.primer').length,
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
            date: dateParts ?
                new Date(rawShow.year, rawShow.month, dateParts[1], dateParts[2], dateParts[3], 0) :
                null,
            play: {
                theatre: {
                    key: rawShow.theatre,
                    title: 'Театр имени Шевченко',
                    url: baseUrl,
                    hasFetcher: true
                },
                scene: { key: sceneMap[rawShow.scene] || defaultScene },
                title: rawShow.title.replace(/\s+/, ' '),
                url: url.resolve(sourceUrl, rawShow.playUrl),
                premiere: rawShow.premiere,
            },
            price: /\d/.test(rawShow.price) ?
                priceHelper.normalize(s.strRight(rawShow.price, 'квиток коштує ')) :
                null
        };
    }
};

module.exports.fetch = fetcher;