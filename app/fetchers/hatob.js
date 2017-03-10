"use strict";

let s = require('underscore.string');
let url = require('url');
let cheerio = require('cheerio');
let async = require('async');
let fetchHelper = require('helpers/fetch');
let dateHelper = require('helpers/date');

const theatreKey = 'hatob';
const defaultScene = 'main';
const baseUrl = 'http://www.hatob.com.ua';
const sourceUrl = baseUrl + '/rus/afisha';

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
        return $('.pagination li:not([class^="pagination"]) a').map(function(index, link) {
            return url.resolve(sourceUrl, $(link).attr('href'));
        });
    }

    function parseShows($) {
        const TEXT_NODE_TYPE = 3;
        return $('.items-row .article').map(function (index, li) {
            let $li = $(li);
            let show = {};

            let $image = $li.find('a img');

            show.theatre = theatreKey;
            show.scene = defaultScene;

            show.image = $image.attr('src');
            show.url = $image.parent('a').attr('href');
            show.title = [];

            $li.find('p').each(function(index, paragraph) {
                let $paragraph = $(paragraph);
                const dateRegExp = new RegExp('(\\d+)\\s*(' + dateHelper.getMonthsNames('ru').join('|') + ')(.*)', 'i');
                let dateMatch = $paragraph.text().match(dateRegExp);
                if (dateMatch) {
                    show.date = dateMatch;
                    show.times = dateMatch[3].match(/\d+(:|-)\d+/g);
                    return;
                }
                let durationMatch = $paragraph.text().match(/\d+\s*(час|год).*\s*\d+\s*(мин|хв).*/);
                if (durationMatch) {
                    show.duration = durationMatch[0];
                    return;
                }

                const paragraphText = $paragraph.html($paragraph.html().replace(/<br ?\/?>/g, "\n")).text().trim();
                if (paragraphText) {
                    show.title.push(paragraphText.replace("\n", ', '));
                }
            });
            if (!show.title) {
                // This will remove item from resulting collection
                console.warn('Hatob: Skip show because title was not found. Show text: ' + $li.text());
                return null;
            }
            if (!show.date || !show.times) {
                // This will remove item from resulting collection
                console.warn('Hatob: Skip show because date or time were not found. Show text: ' + $li.text());
                return null;
            }
            if (!show.duration) {
                console.warn('Hatob: Duration was not found. Show text: ' + $li.text());
            }

            return show;
        }).get();
    }

    function translateRawShow(rawShow) {
        const mappedMonth = dateHelper.mapMonth(rawShow.date[2].toLowerCase(), 'ru');
        if (mappedMonth < 0) {
            console.warn('Hatob: Unable to map month: ' + rawShow.date[2].toLowerCase());
            return null;
        }
        const mappedYear = mappedMonth >= month ? year : year + 1;
        rawShow.title[0] = s.humanize(rawShow.title[0]);
        const show = {
            dates: [],
            play: {
                theatre: {
                    key: rawShow.theatre,
                    title: 'ХАТОБ',
                    url: baseUrl,
                    hasFetcher: true
                },
                scene: { key: rawShow.scene },
                title: rawShow.title.join(', '),
                image: url.resolve(sourceUrl, rawShow.image),
                duration: s.humanize(rawShow.duration),
            },
            url: url.resolve(sourceUrl, rawShow.url),
        };
        (rawShow.times || []).forEach(function(time) {
            show.dates.push(new Date(mappedYear, mappedMonth, rawShow.date[1], ...time.split(/:|-/)));
        });
        return show;
    }
};

module.exports.fetch = fetcher;