"use strict";

let request = require('request');
let encoding = require('encoding');
let s = require('underscore.string');
let cheerio = require('cheerio');
let url = require('url');
let priceHelper = require('helpers/price');

const sourceUrl = 'http://www.theatre-shevchenko.com.ua/repertuar/month.php?id=';

const relevantContentStart = '<ul class="primer-list">';
const relevantContentFinish = '</ul>';

const defaultScene = 'big';
const sceneMap = {
    'Мала сцена': 'small',
    'Експериментальна сцена': 'exp',
    'Велика сцена': 'big',
};

let shevchenko = function(month, year, callback) {

    getRelevantContent(sourceUrl + month, function(err, content) {
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
        return $('li').map(function (index, li) {
            let $li = $(li);
            return {
                title: $li.find('h3').text(),
                url: $li.find('h3 a').attr('href'),
                date: $li.find('.date').text(),
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
            title: rawShow.title.replace(/\s+/, ' '),
            url: url.resolve(sourceUrl, rawShow.url),
            date: dateParts ?
                new Date(year, month - 1, dateParts[1], dateParts[2], dateParts[3], 0) :
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

            let relevantHtmlInCP1251 = relevantContentStart +
                s(body).strRight(relevantContentStart).strLeft(relevantContentFinish).value() +
                relevantContentFinish;

            let relevantHtmlBuffer = encoding.convert(relevantHtmlInCP1251, 'utf-8', 'cp1251');

            callback(null, relevantHtmlBuffer.toString());
        });
    }
};

module.exports.fetch = shevchenko;