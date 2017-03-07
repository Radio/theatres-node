"use strict";

let internetBiletFetcher = require('fetchers/internet-bilet');

const theatreKey = 'shevchenko';
const sceneKey = 'big';
const sourceUrl = 'https://internet-bilet.ua/event-rooms/item.html?room_id=47';
const theatreRawData = {
    title: 'Театр имени Шевченко',
    url: 'http://www.theatre-shevchenko.com.ua',
    hasFetcher: true,
};

module.exports.fetch = internetBiletFetcher(theatreKey, sceneKey, sourceUrl, theatreRawData);