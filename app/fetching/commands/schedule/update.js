"use strict";

const modelHelper = require('helpers/model');

/**
 * Updates the schedule with provided shows.
 * Remove existing shops if they are not listed in newShops.
 * Save the schedule if shows were changed.
 *
 * @param {[Object]} schedule
 * @param {[Object]} newShows
 * @param {Function} callback
 */
module.exports = (schedule, newShows, callback) => {
    const removalCandidates = getRemovalCandidates(schedule);
    const newHashes = newShows.map(function(newShow) {
        const show = addOrUpdateOneShow(schedule, newShow);
        return show.hash;
    });
    const hashesToRemove =  removalCandidates.filter(hash => newHashes.indexOf(hash) < 0);
    hashesToRemove.forEach(function(hashToRemove) {
        removeShowByHash(schedule, hashToRemove)
    });
    schedule.sortShows();
    return schedule.save(callback);
};

function getRemovalCandidates(schedule) {
    const today = new Date();
    return schedule.shows.filter(show => !show.manual && show.date > today)
        .map(show => show.hash);
}

function removeShowByHash(schedule, hashToRemove) {
    const index = schedule.shows.findIndex(show => show.hash === hashToRemove);
    if (index >= 0) {
        schedule.shows.splice(index, 1);
    }
}

function addOrUpdateOneShow(schedule, show) {
    const sameIdIndex = schedule.shows.findIndex((existingShow) => modelHelper.sameIds(existingShow._id, show._id));
    if (sameIdIndex >= 0) {
        schedule.shows[sameIdIndex] = show;
        return show;
    }
    show.updateHash();
    const sameHashIndex = schedule.shows.findIndex((existingShow) => existingShow.hash === show.hash);
    if (sameHashIndex >= 0) {
        ['buyTicketUrl', 'price', 'url', 'theatre', 'scene', 'labels'].forEach(property => {
            if (show[property]) {
                schedule.shows[sameHashIndex][property] = show[property];
            }
        });
        return schedule.shows[sameHashIndex];
    } else {
        schedule.shows.push(show);
        return show;
    }
}
