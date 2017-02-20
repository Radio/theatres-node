"use strict";

let request = require('request');
let encoding = require('encoding');

const utf8Encoding = 'UTF-8';
const binaryEncoding = 'binary';

const monthsMap = {
    ru: {
        'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3,
        'мая': 4, 'июня': 5, 'июля': 6, 'августа': 7,
        'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11,
    },
    ua: {
        'січня': 0, 'лютого': 1, 'березня': 2, 'квітня': 3,
        'травня': 4, 'червня': 5, 'липня': 6, 'серпня': 7,
        'вересня': 8, 'жовтня': 9, 'листопада': 10, 'грудня': 11
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