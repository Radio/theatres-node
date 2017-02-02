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
 *
 * @param {[{play: Play, theatre: Theatre, scene: Scene, date: Date, price: String, buyTicketUrl: String}]} newShows
 * @param {Function} callback
 */
scheduleSchema.methods.update = function(newShows, callback) {
    let schedule = this;
    newShows.forEach(show => (show.hash = Show.calculateHash(show.theatre.key, show.play.key, show.date)));
    let existingHashes = this.shows.map(show => show.hash);
    let newHashes = newShows.map(show => show.hash);
    let hashesToRemove =  existingHashes.filter(hash => newHashes.indexOf(hash) < 0);

    newShows.forEach(function(newShow) {
        const index = existingHashes.indexOf(newShow.hash);
        if (index >= 0) {
            if (newShow.buyTicketUrl) {
                schedule.shows[index].buyTicketUrl = newShow.buyTicketUrl;
            }
            if (newShow.price) {
                schedule.shows[index].price = newShow.price;
            }
        } else {
            schedule.shows.push(new Show(newShow));
        }
    });
    schedule.shows.forEach(function(show, index) {
        if (hashesToRemove.indexOf(show.hash) >= 0) {
            delete schedule.shows[index];
        }
    });
    schedule.shows.sort(function(show1, show2) {
        if (show1.date > show2.date) {
            return 1;
        }
        if (show1.date < show2.date) {
            return -1;
        }
        return 0;
    });
    schedule.save(callback);
};

module.exports = mongoose.model('Schedule', scheduleSchema);