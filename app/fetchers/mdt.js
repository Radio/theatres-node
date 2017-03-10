"use strict";

let internetBiletFetcher = require('fetchers/internet-bilet');

const sourceUrl = 'https://internet-bilet.ua/event-rooms/item.html?room_id=384';
const sceneRawData = {
    key: 'kamernaya-scena-ds-mudrogo'
};
const theatreRawData = {
    key: 'mdt',
    title: 'Театр МДТ',
    url: 'https://vk.com/ukraine_theatre',
    hasFetcher: true,
};

module.exports.fetch = internetBiletFetcher(sourceUrl, theatreRawData, sceneRawData);