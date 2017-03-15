"use strict";

let internetBiletFetcher = require('./internet-bilet');

const sourceUrl = 'https://internet-bilet.ua/event-rooms/item.html?room_id=47';
const sceneRawData = {
    key: 'big'
};
const theatreRawData = {
    key: 'shevchenko',
    title: 'Театр имени Шевченко',
    url: 'http://www.theatre-shevchenko.com.ua',
    hasFetcher: true,
};

module.exports.fetch = internetBiletFetcher(sourceUrl, theatreRawData, sceneRawData);