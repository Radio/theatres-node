"use strict";

let s = require('underscore.string');
let url = require('url');
let cheerio = require('cheerio');
let async = require('async');
let fetchHelper = require('helpers/fetch');
let dateHelper = require('helpers/date');

const theatreKey = 'operetta';
const defaultScene = 'main';
const baseUrl = 'http://www.operetta.kharkiv.ua';
const sourceUrl = baseUrl;

let fetcher = function(callback) {

    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();

    fetchHelper.getContent(sourceUrl, function(err, content) {
        if (err) return callback(err);

        let $ = cheerio.load(content);

        let firstPageSchedule = getSchedule($);
        let otherPagesUrls = findOtherPages($);

        async.map(otherPagesUrls, function(otherSourceUrl, callback) {
            fetchHelper.getContent(otherSourceUrl, function(err, content) {
                if (err) return callback(err);
                let $ = cheerio.load(content);
                let otherPageSchedule = getSchedule($);
                callback(null, otherPageSchedule);
            });
        }, function(err, schedules) {
            if (err) return callback(err);
            schedules.splice(0, 0, firstPageSchedule);
            callback(null, Array.prototype.concat.apply([], schedules));
        });
    });

    function getSchedule($) {
        const parsedShows = parseShows($);
        const translatedShows = parsedShows.map(translateRawShow).filter(show => show !== null);
        return translatedShows.reduce(fetchHelper.splitShowByDates, []);
    }

    function findOtherPages($) {
        return $('.pager a')
            .map(function(index, link) {
                return url.resolve(sourceUrl, $(link).attr('href'));
            })
            .get()
            .filter((value, index, self) => self.indexOf(value) === index);
    }

    function parseShows($) {
        return $('.blogafisha .article').map(function (index, li) {
            let $li = $(li);
            let show = {};

            show.theatre = theatreKey;
            show.scene = defaultScene;

            let $paragraphs = $li.find('p');

            const $dateParagraph = $($paragraphs.get(0));
            const dateParagraphText = $dateParagraph.html($dateParagraph.html().replace(/<br ?\/?>/g, "|"))
                .text().trim();
            [show.time, show.day, show.month] = dateParagraphText.split("|");

            const $imageParagraph = $($paragraphs.get(1));
            show.image = $imageParagraph.find('img').attr('src');
            show.playUrl = $imageParagraph.find('a').attr('href');

            const $nameParagraph = $($paragraphs.get(2));
            const nameParagraphText = $nameParagraph.html($nameParagraph.html().replace(/<br ?\/?>/g, "|"))
                .text().trim();
            [show.director, show.title, show.genre] = nameParagraphText.split("|");
            if (!show.playUrl) {
                const $linkInNameParagraph = $nameParagraph.find('a');
                if ($linkInNameParagraph.text().replace('|', '').trim().length) {
                    show.playUrl = $linkInNameParagraph.attr('href')
                }
            }
            show.premiere = !!nameParagraphText.match(/ПРЕМЬЕРА/);

            return show;
        }).get();
    }

    function translateRawShow(rawShow) {
        let date = parseDate(rawShow);
        if (!date) {
            return null;
        }
        const show = {
            theatre: rawShow.theatre,
            theatreRawData: {
                title: 'Театр музыкальной комедии',
                url: baseUrl,
                hasFetcher: true
            },
            date: date,
            title: s.humanize(rawShow.title),
            scene: rawShow.scene,
            premiere: rawShow.premiere,
        };
        if (rawShow.playUrl) {
            show.playUrl = url.resolve(sourceUrl, rawShow.playUrl);
        }
        if (rawShow.image) {
            show.image = url.resolve(sourceUrl, rawShow.image);
        }
        if (rawShow.director) {
            show.director = rawShow.director.replace(/премьера!?/i, '').trim();
        }
        if (rawShow.genre) {
            show.genre = rawShow.genre.trim();
        }
        return show;
    }

    function parseDate(rawShow) {
        const mappedDay = rawShow.day.trim();
        const mappedTime = rawShow.time.replace(/[^\d:]/g, '');
        const mappedMonth = dateHelper.mapMonth(rawShow.month.toLowerCase(), 'ru');
        if (mappedMonth < 0) {
            console.warn('Operetta: Unable to map month: ' + rawShow.month.toLowerCase());
            return null;
        }
        const mappedYear = mappedMonth >= month ? year : year + 1;

        return new Date(mappedYear, mappedMonth, mappedDay, ...mappedTime.split(':'))
    }
};

module.exports.fetch = fetcher;