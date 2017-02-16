"use strict";

let s = require('underscore.string');
let url = require('url');
let cheerio = require('cheerio');
let fetchHelper = require('helpers/fetch');

const sourceUrl = 'http://domaktera.kharkiv.ua/afisha';
const timeZoneOffset = '+0200';

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
        return parsedShows.map(translateRawShow);
    }

    function parseShows(content) {
        const TEXT_NODE_TYPE = 3;
        let $ = cheerio.load(content);
        return $('td:not(.day)').map(function (index, td) {
            let $td = $(td);
            let scene = $td.is(':last-child') ? 'small' : 'main';

            return $td.find('.show').map(function (index, div) {
                let $div = $(div);

                let show = {};

                const $titleLink = $div.find('[itemprop="name"] a');
                const $theatreLink = $div.find('[itemprop="performer"] a');
                show.theatre = {
                    url: $theatreLink.attr('href'),
                    title: $theatreLink.text(),
                };
                show.scene = scene;
                show.date = $div.find('time').attr('datetime');
                show.title = $titleLink.text();
                show.url = $titleLink.attr('href');

                return show;
            }).get();

        }).get();
    }

    function translateRawShow(rawShow) {
        const theatreKey = s(rawShow.theatre.url).strRightBack('/').value();
        return {
            theatre: theatreKey,
            theatreRawData: {
                title: rawShow.theatre.title,
                url: rawShow.theatre.url,
                hasFetcher: false,
                houseSlug: theatreKey,
            },
            title: rawShow.title,
            url: url.resolve(sourceUrl, rawShow.url),
            date: new Date(rawShow.date + timeZoneOffset),
            scene: rawShow.scene,
        };
    }
};

module.exports.fetch = fetcher;