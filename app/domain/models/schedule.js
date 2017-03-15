"use strict";

let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let Show = require('./show');
let Play = require('./play');
let versioned = require('./plugins/schedule/versioned');
let modelHelper = require('helpers/model');

let scheduleSchema = new Schema({
    shows: [Show.schema],
    month: Number,
    year: Number,
    updated: Date
});
scheduleSchema.set('toObject', { versionKey: false });

scheduleSchema.virtual('monthKey').get(function() {
    return (this.month < 9 ? '0' : '') + (this.month + 1) + '-' + this.year;
});

/**
 * Update 'updated' property before saving the schedule.
 */
scheduleSchema.pre('save', function(next) {
    this.updateUpdated();
    next();
});

Play.schema.on('remove', function(play) {
    mongoose.model('Schedule').removePlay(play._id, function(err) { /* well, nothing */ });
});

/**
 * Find schedule by given month and year.
 *
 * @param {Number} month
 * @param {Number} year
 * @param {Function} callback
 * @return {Query|*}
 */
scheduleSchema.statics.findByMonthAndYear = function(month, year, callback) {
    return this.findOne({ month: month, year: year }, callback);
};

/**
 * Create schedule for given month and year.
 *
 * @param {Number} month
 * @param {Number} year
 *
 * @return {Object}
 */
scheduleSchema.statics.createForMonthAndYear = function(month, year) {
    return new this({
        shows: [],
        month: month,
        year: year,
        updated: new Date()
    });
};

/**
 * Replace one play with another in all schedules.
 * This method calls itself recursively until all play are not replaced.
 *
 * @param {String} oldPlayId
 * @param {String} newPlayId
 * @param {Function} callback
 */
scheduleSchema.statics.replacePlay = function(oldPlayId, newPlayId, callback) {
    const Schedule = this;
    this.update(
        { 'shows.play': oldPlayId },
        { $set: { 'shows.$.play': newPlayId } },
        { multi: true },
        function(err, raw) {
            if (err) return callback(err);
            if (!raw.nModified) {
                return callback();
            }
            Schedule.replacePlay(oldPlayId, newPlayId, callback);
        });
};

/**
 * Remove shows with given play id from all schedules.
 *
 * @param {String} playId
 * @param {Function} callback
 */
scheduleSchema.statics.removePlay = function(playId, callback) {
    this.update(
        { },
        { $pull: { shows: { play: playId } } },
        { multi: true }
    ).exec(callback);
};

/**
 * Update 'updated' field with current date.
 */
scheduleSchema.methods.updateUpdated = function() {
    this.updated = new Date();
};

/**
 * Update single show and save schedule.
 *
 * @param {Object} show
 * @param {Function} callback
 */
scheduleSchema.methods.updateShow = function(show, callback) {
    const showIndex = this.findShowIndex(show._id);
    if (showIndex < 0) {
        return callback(new Error('There is no show with ID=' + show._id + ' in this schedule.'));
    }
    this.shows[showIndex] = show;
    this.sortShows();
    this.save(callback);
};

/**
 * Add single show and save schedule.
 *
 * @param {Object} show
 * @param {Function} callback
 */
scheduleSchema.methods.addShow = function(show, callback) {
    const sameShowIndex = this.findShowIndex(show._id);
    if (sameShowIndex >= 0) {
        return callback(new Error('There is already a show with ID=' + show._id + ' in this schedule.'));
    }
    this.shows.push(show);
    this.sortShows();
    this.save(callback);
};

/**
 * Remove single show and save schedule.
 *
 * @param {String} showId
 * @param {Function} callback
 */
scheduleSchema.methods.removeShow = function(showId, callback) {
    let showIndex = this.findShowIndex(showId);
    if (showIndex < 0) {
        return callback(new Error('There is no show with ID=' + showId + ' in this schedule.'));
    }
    this.shows.splice(showIndex, 1);
    this.save(callback);
};

/**
 * Hide show from this schedule.
 *
 * @param {String} showId
 * @param {Function} callback
 */
scheduleSchema.methods.hideShow = function(showId, callback) {
    let show = this.findShow(showId);
    if (!show) {
        return callback(new Error('There is no show with ID=' + showId + ' in this schedule.'));
    }
    show.hide();
    this.save(callback);
};

/**
 * Un-mark show as hidden in this schedule.
 *
 * @param {String} showId
 * @param {Function} callback
 */
scheduleSchema.methods.unhideShow = function(showId, callback) {
    let show = this.findShow(showId);
    if (!show) {
        return callback(new Error('There is no show with ID=' + showId + ' in this schedule.'));
    }
    show.unhide();
    this.save(callback);
};

/**
 * Sort shows by date.
 */
scheduleSchema.methods.sortShows = function() {
    this.shows.sort((show1, show2) => show1.date - show2.date ||
    String(show1.play._id || show1.play).localeCompare(String(show2.play._id || show2.play)));
};

scheduleSchema.methods.findShowIndex = function(showId) {
    return this.shows.findIndex((show) => modelHelper.sameIds(show._id, showId));
};

scheduleSchema.methods.findShow = function(showId) {
    return this.shows.find((show) => modelHelper.sameIds(show._id, showId));
};

scheduleSchema.plugin(versioned);

module.exports = mongoose.model('Schedule', scheduleSchema);