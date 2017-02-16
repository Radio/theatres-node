"use strict";

let s = require('underscore.string');
let url = require('url');
let cheerio = require('cheerio');
let fetchHelper = require('helpers/fetch');

const theatreKey = 'pushkin';
const baseUrl = 'http://rusdrama.com';
const sourceUrl = baseUrl + '/afisha';

const defaultScene = 'main';

let fetcher = function(callback) {

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
        const TEXT_NODE_TYPE = 3;
        let $ = cheerio.load(content);
        return $('.afisha').map(function (index, li) {
            let $li = $(li);
            let show = {};

            show.theatre = theatreKey;
            show.date = $li.find('.date-afisha strong').text();
            show.time = $li.find('.name-perform b').text();
            show.image = $li.find('.date-afisha img').attr('src');
            show.title = $li.find('h3').text();
            show.playUrl = $li.find('h3 a').attr('href');
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
            theatre: rawShow.theatre,
            theatreRawData: {
                title: 'Театр имени Пушкина',
                url: baseUrl,
                hasFetcher: true
            },
            title: s.humanize(rawShow.title),
            playUrl: url.resolve(sourceUrl, rawShow.playUrl),
            date: new Date(year, month, rawShow.date.replace(/\D/g, ''), ...rawShow.time.split(':')),
            scene: rawShow.scene,
            buyTicketUrl: url.resolve(sourceUrl, rawShow.buyTicketUrl),
            image: url.resolve(sourceUrl, rawShow.image),
            duration: rawShow.duration.replace(/.*?(\d.*)/, '$1').trim(),
            author: rawShow.author,
            genre: rawShow.genre
        };
    }
};

module.exports.fetch = fetcher;