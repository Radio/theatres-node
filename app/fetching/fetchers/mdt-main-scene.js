"use strict";

let internetBiletFetcher = require('./factories/internet-bilet');

const sourceUrl = 'https://internet-bilet.ua/event-rooms/item.html?room_id=495';
const playSceneData = {
    key: 'main'
};
const playTheatreData = {
    key: 'mdt',
    title: 'Театр МДТ',
    url: 'https://vk.com/ukraine_theatre',
    hasFetcher: true,
};
const showTheatreData = {
    key: 'dvorec-studentov-imeni-mudrogo',
    title: 'Дворец студентов имени Мудрого',
};

module.exports.fetch = internetBiletFetcher(sourceUrl, playTheatreData, playSceneData, showTheatreData);