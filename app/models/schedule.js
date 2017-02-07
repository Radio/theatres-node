"use strict";

let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let Show = require('models/show');
let versioned = require('models/schedule/versioned');

let scheduleSchema = new Schema({
    shows: [Show.schema],
    month: Number,
    year: Number,
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
    this.findByMonthAndYear(month, year)
        .exec(function(err, schedule) {
            if (err) return callback(err);
            if (!schedule) {
                schedule = Schedule.createForMonthAndYear(month, year, callback);
                schedule.save(function(err) {
                    if (err) return callback(err);
                    callback(null, schedule);
                });
                return;
            }
            callback(null, schedule);
        });
};

scheduleSchema.statics.findByMonthAndYear = function(month, year, callback) {
    return this.findOne({ month: month, year: year }, callback);
};

scheduleSchema.statics.createForMonthAndYear = function(month, year) {
    return new this({
        shows: [],
        month: month,
        year: year,
        updated: new Date()
    });
};

/**
 * Updates the schedule with provided shows.
 * Remove existing shops if they are not listed in newShops.
 *
 * @param {[{play: Play, theatre: Theatre, scene: Scene, date: Date, price: String, buyTicketUrl: String}]} newShows
 * @param {Function} callback
 *
 * // todo: rename, 'update' is reserved.
 */
scheduleSchema.methods.update = function(newShows, callback) {
    newShows.forEach(function(show) {
        // Pre-calculate hashes for new shows in order to find shows to be removed.
        show.hash = Show.calculateHash(show.theatre.id, show.play.id, show.date);
    });

    let existingHashes = this.shows.map(show => show.hash);
    let newHashes = newShows.map(show => show.hash);
    let hashesToRemove =  existingHashes.filter(hash => newHashes.indexOf(hash) < 0);

    // todo: Do not delete passed shows
    hashesToRemove.forEach(hashToRemove => this.removeShowByHash(hashToRemove));
    newShows.forEach(newShow => this.addOrUpdateShow(newShow));
    this.sortShows();
    this.updated = new Date();
    this.save(callback);
};

/**
 * Update the schedule with new shows.
 * Do not remove existing shops if they are not listed in newShops.
 *
 * @param {[{play: Play, theatre: Theatre, scene: Scene, date: Date, price: String, buyTicketUrl: String}]} newShows
 * @param {Function} callback
 */
scheduleSchema.methods.addOrUpdateShows = function(newShows, callback) {
    newShows.forEach(newShow => this.addOrUpdateShow(newShow));
    this.sortShows();
    this.updated = new Date();
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

/**
 * Edit single show and save schedule.
 *
 * @param {String} showId
 * @param {Object} editRequest
 * @param {Function} callback
 */
scheduleSchema.methods.editShow = function(showId, editRequest, callback) {
    let show = this.shows.find(show => String(show._id) === String(showId));
    if (!show) {
        callback(new Error('There is no show with ID=' + showId + ' in this schedule.'));
    }
    show.edit(editRequest);
    this.save(callback);
};

/**
 * Remove single show and save schedule.
 *
 * @param {String} showId
 * @param {Function} callback
 */
scheduleSchema.methods.removeShow = function(showId, callback) {
    console.log(showId);
    let showIndex = this.shows.findIndex(show => String(show._id) === String(showId));
    if (showIndex < 0) {
        return callback(new Error('There is no show with ID=' + showId + ' in this schedule.'));
    }
    this.shows.splice(showIndex, 1);
    this.save(callback);
};

scheduleSchema.virtual('monthKey').get(function() {
    return (this.month < 9 ? '0' : '') + (this.month + 1) + '-' + this.year;
});

scheduleSchema = versioned(scheduleSchema);

module.exports = mongoose.model('Schedule', scheduleSchema);