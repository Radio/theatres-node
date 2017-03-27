"use strict";

let internetBiletFetcher = require('./factories/internet-bilet');

const sourceUrl = 'https://internet-bilet.ua/event-rooms/item.html?room_id=14';
const playSceneData = {
    key: 'main'
};
const theatreData = {
    key: 'hatob',
    title: 'ХАТОБ',
    url: 'http://www.hatob.com.ua',
    hasFetcher: true,
};

module.exports.fetch = internetBiletFetcher(sourceUrl, theatreData, playSceneData, theatreData);