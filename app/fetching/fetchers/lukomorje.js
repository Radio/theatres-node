"use strict";

let internetBiletFetcher = require('./factories/internet-bilet');

const sourceUrl = 'https://internet-bilet.ua/event-rooms/item.html?room_id=606';
const playSceneData = {
    key: 'main'
};
const playTheatreData = {
    key: 'lukomorje',
    title: 'Театр «Лукоморье»',
    url: 'http://lukomorie.kh.ua/events',
    hasFetcher: true,
};

module.exports.fetch = internetBiletFetcher(sourceUrl, playTheatreData, playSceneData);