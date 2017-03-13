"use strict";

let request = require('request');
let encoding = require('encoding');

const utf8Encoding = 'UTF-8';
const binaryEncoding = 'binary';

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
};