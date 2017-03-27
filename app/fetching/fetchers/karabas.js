"use strict";

let s = require('underscore.string');
let url = require('url');
let cheerio = require('cheerio');
let fetchHelper = require('../helper');
let dateHelper = require('helpers/date');
let priceHelper = require('helpers/price');

const sourceUrl = 'https://kharkov.karabas.com/theatres/';

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
        const parsedShows = parseShows(content);
        const translatedShows = parsedShows.map(translateRawShow).filter(show => show !== null);
        return translatedShows.reduce(fetchHelper.splitShowByDates, []);
    }

    function parseShows(content) {
        let $ = cheerio.load(content);
        return $('.block-mini').map(function(index, block) {
            let $block = $(block);
            let date = $block.find('.box-date').text();
            return $block.find('.information>li').map((index, li) => {
                let $li = $(li);
                let show = {};

                show.hallId = $li.attr('hall');
                show.hallTitle = $li.find('.block-time a').attr('title');
                show.scene = defaultScene;
                const $link = $li.find('.event_title a');
                show.title = $link.text();
                show.url = $link.attr('href');
                show.date = date;
                show.time = $li.find('.block-time span').text();
                show.price = $li.find('.block-price strong').text();
                show.buyTicketUrl = $li.find('.btn-green').attr('href');
                show.image = $li.find('img').attr('data-cfsrc');

                return show;
            }).get();
        }).get();
    }

    function translateRawShow(rawShow) {
        const date = parseDate(rawShow);
        if (!date) {
            console.warn('Karabas: show skipped because date parsing failed.' +
                ' Date: ' + rawShow.date + ' Time: ' + rawShow.time);
            return null;
        }
        let show = {
            date: date,
            play: {
                theatre: {
                    karabasHallId: rawShow.hallId,
                    title: rawShow.hallTitle
                },
                scene: { key: rawShow.scene },
                title: rawShow.title.trim(),
            }
        };
        if (rawShow.image) {
            show.play.image = url.resolve(sourceUrl, rawShow.image.replace(/\/48\//g, '/1024/'));
        }
        if (rawShow.url) {
            show.url = url.resolve(sourceUrl, rawShow.url);
        }
        if (rawShow.buyTicketUrl) {
            show.buyTicketUrl = url.resolve(sourceUrl, rawShow.buyTicketUrl);
        }
        if (rawShow.price) {
            show.price = priceHelper.normalize(rawShow.price + ' грн');
        }
        return show;
    }

    function parseDate(rawShow) {
        const monthNames = dateHelper.getMonthsNames('ru').join('|');
        const dateRegExp = new RegExp('(\\d+).*(' + monthNames + ').*?(\\d+)');
        const [match, day, monthName, year] = rawShow.date.replace(/[\r\n]/g, ' ').match(dateRegExp) || [];
        const [time] = rawShow.time.match(/\d+:\d+/) || [];
        if (!match || !time) {
            return null;
        }
        const month = dateHelper.mapMonth(monthName, 'ru');
        if (month < 0) {
            return null;
        }
        return new Date(year, month, day, ...time.split(':'));
    }
};

module.exports.fetch = fetcher;