"use strict";

let internetBiletFetcher = require('fetchers/internet-bilet');

const theatreKey = 'mdt';
const sceneKey = 'kamernaya-scena-ds-mudrogo';
const sourceUrl = 'https://internet-bilet.ua/event-rooms/item.html?room_id=384';
const theatreRawData = {
    title: 'Театр МДТ',
    url: 'https://vk.com/ukraine_theatre',
    hasFetcher: true,
};

module.exports.fetch = internetBiletFetcher(theatreKey, sceneKey, sourceUrl, theatreRawData);