"use strict";

/**
 * Edit given show.
 *
 * @param {Object} show
 * @param {Object} editRequest
 * @param {Function} callback
 */
module.exports = (show, editRequest, callback) => {
    show.date = editRequest.date;
    show.theatre = editRequest.theatre;
    show.scene = editRequest.scene;
    show.play = editRequest.play;
    show.price = editRequest.price;
    show.url = editRequest.url;
    show.buyTicketUrl = editRequest.buyTicketUrl;
    show.customHash = editRequest.customHash;
    if (show.customHash) {
        show.hash = editRequest.hash;
    }
    show.manual = editRequest.manual;
    if (typeof editRequest.hidden !== 'undefined') {
        show.hidden = editRequest.hidden;
    }
    show.labels = editRequest.labels;

    show.validate(callback);
};