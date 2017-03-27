"use strict";

let url = require('url');
let cheerio = require('cheerio');
let modelHelper = require('helpers/model');
let fetchHelper = require('../helper');
let dateHelper = require('helpers/date');

const theatreKey = 'theatre19';
const baseUrl = 'http://www.theatre19.com.ua';
const sourceUrl = baseUrl + '/poster';

const scenesMap = {
    'Основная сцена': 'main',
    'Малая сцена': 'small',
    'Центр культуры Киевского района (ДК Связи)': 'dk-sviazi',
    'на сцене Харьковского ДК "Металлист"': 'dk-metalist',
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
        let $ = cheerio.load(content);
        return $('.afiasha-perfholder').map(function (index, li) {
            let $li = $(li);
            let show = {};

            show.theatre = theatreKey;
            show.day = $li.find('.perfday').text();
            show.month = $li.find('.perfmonth').text();
            show.time = $li.find('.afiasha-perftimehold  strong').text();
            const $titleLink = $li.find('.perftitle a');
            show.title = $titleLink.text();
            show.playUrl = $titleLink.attr('href');
            show.genre = $li.find('.perfdescr').text();
            show.scene = $li.find('.perfarea').text();
            show.premiere = $li.find('.afiasha-premlabel:not(.hide)').length > 0;
            show.duration = $li.find('.perftime').text() + ' ' + $li.find('.perftip').text();
            show.buyTicketUrl = $li.find('.afiasha-buebuttonholder a').attr('href');

            return show;
        }).get();
    }

    function translateRawShow(rawShow) {
        const mappedMonth = dateHelper.mapMonth(rawShow.month.toLowerCase(), 'ru');
        if (mappedMonth < 0) {
            console.warn('Theatre 19: Unable to map month: ' + rawShow.month.toLowerCase());
            return null;
        }
        const mappedYear = mappedMonth >= month ? year : year + 1;
        return {
            date: new Date(mappedYear, mappedMonth, rawShow.day, ...rawShow.time.split(':')),
            play: {
                theatre: {
                    key: rawShow.theatre,
                    title: 'Театр 19',
                    url: baseUrl,
                    hasFetcher: true,
                },
                scene: {
                    key: mapScene(rawShow.scene),
                    title: rawShow.scene
                },
                title: rawShow.title,
                url: url.resolve(sourceUrl, rawShow.playUrl),
                genre: rawShow.genre,
                premiere: rawShow.premiere,
                duration: rawShow.duration,
            },
            buyTicketUrl: url.resolve(sourceUrl, rawShow.buyTicketUrl),
        };
    }

    function mapScene(scene) {
        return scenesMap[scene] || modelHelper.generateKey(scene);
    }
};

module.exports.fetch = fetcher;