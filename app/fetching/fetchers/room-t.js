"use strict";

let internetBiletFetcher = require('./factories/internet-bilet');

const sourceUrl = 'https://internet-bilet.ua/event-rooms/item.html?room_id=620';
const playSceneData = {
    key: 'main'
};
const playTheatreData = {
    key: 'room-t',
    title: 'Комната Т',
    hasFetcher: true,
};

module.exports.fetch = internetBiletFetcher(sourceUrl, playTheatreData, playSceneData);