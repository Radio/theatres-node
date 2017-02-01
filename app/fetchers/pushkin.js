"use strict";

let request = require('request');
let s = require('underscore.string');
let cheerio = require('cheerio');
let url = require('url');

const sourceUrl = 'http://rusdrama.com/afisha';

const defaultScene = 'main';

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
        return $('.afisha').map(function (index, li) {
            let $li = $(li);
            let show = {};

            show.date = $li.find('.date-afisha strong').text();
            show.time = $li.find('.name-perform b').text();
            show.image = $li.find('.date-afisha img').attr('src');
            show.title = $li.find('h3').text();
            show.url = $li.find('h3 a').attr('href');
            show.scene = defaultScene;
            show.buyTicketUrl = $li.find('.vkino-link').attr('href');
            show.duration = $li.find('.name-perform')
                .contents()
                .filter(function() { return s.startsWith(this.nodeValue, 'Продолжительность'); })
                .text();
            let authorAndGenre = $li.find('.name-perform strong').first()
                .contents()
                .filter(function() { return this.nodeType === TEXT_NODE_TYPE; })
                .map((index, element) => element.nodeValue);
            show.author = authorAndGenre.get(0);
            show.genre = authorAndGenre.get(1);

            return show;
        }).get();
    }

    function translateRawShow(rawShow) {
        return {
            title: s.humanize(rawShow.title),
            url: url.resolve(sourceUrl, rawShow.url),
            date: new Date(year, month - 1, rawShow.date.replace(/\D/g, ''), ...rawShow.time.split(':')),
            scene: rawShow.scene,
            buyTicketUrl: url.resolve(sourceUrl, rawShow.buyTicketUrl),
            image: url.resolve(sourceUrl, rawShow.image),
            duration: rawShow.duration.replace(/.*?(\d.*)/, '$1').trim(),
            author: rawShow.author,
            genre: rawShow.genre
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