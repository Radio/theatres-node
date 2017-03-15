"use strict";

module.exports = (theatre, editRequest, callback) => {
    theatre.title = editRequest.title;
    theatre.key = editRequest.key;
    theatre.url = editRequest.url;
    theatre.houseSlug = editRequest.houseSlug;
    theatre.hasFetcher = editRequest.hasFetcher;

    theatre.save(callback);
};