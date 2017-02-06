"use strict";

let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let Show = require('./show');

let scheduleSchema = new Schema({
    shows: [Show.schema],
    month: Number,
    year: Number,
    version: Number,
    actual: Boolean,
    updated: Date
});
scheduleSchema.set('toObject', { versionKey: false });

/**
 * Resolve schedule by given month and year.
 * If schedule doesn't exist it will be created.
 *
 * @param {Number} month
 * @param {Number} year
 * @param {Function} callback
 */
scheduleSchema.statics.resolve = function(month, year, callback) {
    let Schedule = this;
    this.findOne({ month: month, year: year, actual: true }, function(err, schedule) {
        if (err) return callback(err);
        if (!schedule) {
            schedule = new Schedule({
                shows: [],
                month: month,
                year: year,
                version: 1,
                actual: true,
                updated: new Date()
            });
            schedule.save(function(err) {
                if (err) return callback(err);
                callback(null, schedule);
            });
            return;
        }
        callback(null, schedule);
    });
};

/**
 * Updates the schedule with provided shows.
 * Remove existing shops if they are not listed in newShops.
 *
 * @param {[{play: Play, theatre: Theatre, scene: Scene, date: Date, price: String, buyTicketUrl: String}]} newShows
 * @param {Function} callback
 */
scheduleSchema.methods.update = function(newShows, callback) {
    newShows.forEach(function(show) {
        // Pre-calculate hashes for new shows in order to find shows to be removed.
        show.hash = Show.calculateHash(show.theatre.id, show.play.id, show.date);
    });
    let existingHashes = this.shows.map(show => show.hash);
    let newHashes = newShows.map(show => show.hash);
    let hashesToRemove =  existingHashes.filter(hash => newHashes.indexOf(hash) < 0);

    // todo: implement versioning
    // todo: Do not delete passed shows
    newShows.forEach(newShow => this.addOrUpdateShow(newShow));
    hashesToRemove.forEach(hashToRemove => this.removeShowByHash(hashToRemove));
    this.sortShows();
    this.save(callback);
};

/**
 * Update teh schedule with new shows.
 * Do not remove existing shops if they are not listed in newShops.
 *
 * @param {[{play: Play, theatre: Theatre, scene: Scene, date: Date, price: String, buyTicketUrl: String}]} newShows
 * @param {Function} callback
 */
scheduleSchema.methods.addOrUpdateShows = function(newShows, callback) {
    // todo: implement versioning
    newShows.forEach(newShow => this.addOrUpdateShow(newShow));
    this.sortShows();
    this.save(callback);
};

/**
 * Remove show by hash.
 *
 * @param {String} hashToRemove
 */
scheduleSchema.methods.removeShowByHash = function(hashToRemove) {
    const index = this.shows.findIndex(function(show) {
        return show.hash === hashToRemove;
    });
    if (index >= 0) {
        this.shows.splice(index, 1);
    }
};

/**
 * Sort shows by date.
 */
scheduleSchema.methods.sortShows = function() {
    this.shows.sort((show1, show2) => show1.date - show2.date);
};

/**
 * Update certain show data or add a new show to schedule.
 *
 * @param {object} newShowData A plain object representing the show.
 */
scheduleSchema.methods.addOrUpdateShow = function(newShowData) {
    newShowData.hash = newShowData.hash ||
        Show.calculateHash(newShowData.theatre.id, newShowData.play.id, newShowData.date);
    const index = this.shows.findIndex((show) => show.hash === newShowData.hash);
    if (index >= 0) {
        if (newShowData.buyTicketUrl) {
            this.shows[index].buyTicketUrl = newShowData.buyTicketUrl;
        }
        if (newShowData.price) {
            this.shows[index].price = newShowData.price;
        }
    } else {
        this.shows.push(new Show(newShowData));
    }
};

module.exports = mongoose.model('Schedule', scheduleSchema);