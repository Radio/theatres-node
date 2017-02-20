"use strict";

let request = require('request');
let encoding = require('encoding');

const utf8Encoding = 'UTF-8';
const binaryEncoding = 'binary';

const monthsMap = {
    ru: {
        'январь': 0, 'января': 0, 'февраль': 1, 'февраля': 1, 'март': 2, 'марта': 2, 'апрель': 3, 'апреля': 3,
        'май': 4, 'мая': 4, 'июнь': 5, 'июня': 5, 'июль': 6, 'июля': 6, 'август': 7, 'августа': 7, 'сентябрь': 8,
        'сентября': 8, 'октябрь': 9, 'октября': 9, 'ноябрь': 10, 'ноября': 10, 'декабрь': 11, 'декабря': 11,
    },
    ru_short: {
        'янв': 0, 'фев': 1, 'мар': 2, 'апр': 3, 'май': 4, 'мая': 4, 'июн': 5,
        'июл': 6, 'авг': 7, 'сен': 8, 'окт': 9, 'ноя': 10, 'дек': 11,
    },
    ua: {
        'січень': 0, 'січня': 0,  'лютий': 1, 'лютого': 1,  'березень': 2, 'березня': 2,  'квітень': 3, 'квітня': 3,
        'травень': 4, 'травня': 4,  'червень': 5, 'червня': 5, 'липень': 6, 'липня': 6,  'серпень': 7, 'серпня': 7,
        'вересень': 8, 'вересня': 8,  'жовтень': 9, 'жовтня': 9,  'листопад': 10, 'листопада': 10,  'грудень': 11,
        'грудня': 11,
    },
    en_short: {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    }
};

module.exports = {
    /**
     * Get HTML content by given URL.
     *
     * @param {String} url
     * @param {String|Function} expectedEncoding
     * @param {Function} callback
     */
    getContent: function(url, expectedEncoding, callback) {
        if (typeof expectedEncoding === 'function') {
            callback = expectedEncoding;
            expectedEncoding = utf8Encoding;
        }
        const expectingUtf8 = expectedEncoding === utf8Encoding;
        request({
            url: url,
            encoding: expectingUtf8 ? utf8Encoding : binaryEncoding
        }, function (err, response, body) {
            if (err) return callback(err);
            if (response.statusCode !== 200) {
                return callback(new Error('Failed to get the page contents. ' +
                    'Server responded with ' + response.statusCode));
            }
            if (!expectingUtf8) {
                let utf8BodyBuffer = encoding.convert(body, utf8Encoding, expectedEncoding);
                callback(null, utf8BodyBuffer.toString());
                return;
            }
            callback(null, body);
        });
    },
    /**
     * Array reducer: Split single show to many by dates and put these shows to the result array.
     *
     * @param {Array} splitShows The resulting array required by the Array.prototype.reduce() function.
     * @param {Object} show
     *
     * @return {Array}
     */
    splitShowByDates: function(splitShows, show) {
        if (typeof show.dates === 'undefined') {
            splitShows.push(show);
            return splitShows;
        }
        show.dates.forEach(function(date) {
            let clonedShow = Object.assign({}, show);
            delete clonedShow.dates;
            clonedShow.date = date;
            splitShows.push(clonedShow);
        });
        return splitShows;
    },
    /**
     * Map given month name to month number according to Date.
     *
     * @param {String} textualMonth
     * @param {String} mapCode
     *
     * @return {Number}
     */
    mapMonth: function(textualMonth, mapCode) {
        if (typeof monthsMap[mapCode][textualMonth] === 'undefined') {
            return -1;
        }
        return monthsMap[mapCode][textualMonth];
    },
    getMonthsNames: function(mapCode) {
        if (typeof monthsMap[mapCode] === 'undefined') {
            throw new Error('There is no month map with code: ' + mapCode);
        }
        let monthsNames = [];
        for (let monthName in monthsMap[mapCode]) {
            if (monthsMap[mapCode].hasOwnProperty(monthName)) {
                monthsNames.push(monthName);
            }
        }
        return monthsNames;
    }
};