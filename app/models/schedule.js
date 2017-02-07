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

scheduleSchema.virtual('monthKey').get(function() {
    return (this.month < 9 ? '0' : '') + (this.month + 1) + '-' + this.year;
});

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

scheduleSchema.pre('save', function(next) {
    this.updateUpdated();
    next();
});

/**
 * Update 'updated' field with current date.
 */
scheduleSchema.methods.updateUpdated = function() {
    this.updated = new Date();
};

/**
 * Updates the schedule with provided shows.
 * Remove existing shops if they are not listed in newShops.
 *
 * @param {[Object]} newShowsData
 */
scheduleSchema.methods.replaceShows = function(newShowsData) {
    let existingHashes = this.shows.map(show => show.hash);
    let schedule = this;
    let newHashes = newShowsData.map(function(newShowData) {
        const show = schedule.addOrUpdateOneShow(newShowData instanceof Show ? newShowData : new Show(newShowData));
        return show.hash;
    });
    let hashesToRemove =  existingHashes.filter(hash => newHashes.indexOf(hash) < 0);
    hashesToRemove.forEach(function(hashToRemove) {
        schedule.removeShowByHash(hashToRemove)
    });
    this.sortShows();
};

/**
 * Updates the schedule with provided shows.
 * Remove existing shops if they are not listed in newShops.
 * Save the schedule.
 *
 * @param {[Object]} newShowsData
 * @param {Function} callback
 */
scheduleSchema.methods.replaceShowsAndSave = function(newShowsData, callback) {
    this.replaceShows(newShowsData);
    this.save(callback);
};

/**
 * Update the schedule with new shows.
 * Do not remove existing shops if they are not listed in newShops.
 *
 * @param {[Object]} newShowsData
 */
scheduleSchema.methods.addOrUpdateShows = function(newShowsData) {
    let schedule = this;
    newShowsData.forEach(function(newShowData) {
        schedule.addOrUpdateOneShow(newShowData instanceof Show ? newShowData : new Show(newShowData));
    });
    this.sortShows();
};

/**
 * Update the schedule with new shows.
 * Do not remove existing shops if they are not listed in newShops.
 * Save the schedule.
 *
 * @param {[Object]} newShowsData
 * @param {Function} callback
 */
scheduleSchema.methods.addOrUpdateShowsAndSave = function(newShowsData, callback) {
    this.addOrUpdateShows(newShowsData);
    this.save(callback);
};

/**
 * Remove shows by ids.
 *
 * @param {[String]} showsIds
 */
scheduleSchema.methods.removeShows = function(showsIds) {
    let schedule = this;
    showsIds.forEach(function(showId) {
        let showIndex = schedule.shows.findIndex(show => String(show._id) === String(showId));
        if (showIndex >= 0) {
            schedule.shows.splice(showIndex, 1);
        }
    });
};

/**
 * Remove shows by ids.
 * Save the schedule.
 *
 * @param {[String]} showsIds
 * @param {Function} callback
 */
scheduleSchema.methods.removeShowsAndSave = function(showsIds, callback) {
    this.removeShows(showsIds);
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
 * @param {object} show A plain object representing the show.
 *
 * @return {Object} Show document
 */
scheduleSchema.methods.addOrUpdateOneShow = function(show) {
    const sameShowIndex = this.shows.findIndex((existingShow) => existingShow._id === show._id);
    if (sameShowIndex >= 0) {
        this.shows[sameShowIndex] = show;
        return this.shows[sameShowIndex];
    }
    show.updateHash();
    const sameHashIndex = this.shows.findIndex((existingShow) => existingShow.hash === show.hash);
    if (sameHashIndex >= 0) {
        if (show.buyTicketUrl) {
            this.shows[sameHashIndex].buyTicketUrl = show.buyTicketUrl;
        }
        if (show.price) {
            this.shows[sameHashIndex].price = show.price;
        }
        return this.shows[sameHashIndex];
    } else {
        this.shows.push(show);
        return show;
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
    let showIndex = this.shows.findIndex(show => String(show._id) === String(showId));
    if (!showIndex) {
        callback(new Error('There is no show with ID=' + showId + ' in this schedule.'));
    }
    let show = new Show({_id: showId});
    let schedule = this;
    show.edit(editRequest, function(err) {
        if (err) return callback(err);
        schedule.addOrUpdateShowsAndSave([show], callback);
    });

};

/**
 * Add single show and save schedule.
 *
 * @param {Object} editRequest
 * @param {Function} callback
 */
scheduleSchema.methods.addShow = function(editRequest, callback) {
    let show = new Show();
    let schedule = this;
    show.edit(editRequest, function(err) {
        if (err) return callback(err);
        schedule.addOrUpdateShowsAndSave([show], callback);
    });
};

/**
 * Remove single show and save schedule.
 *
 * @param {String} showId
 * @param {Function} callback
 */
scheduleSchema.methods.removeShow = function(showId, callback) {
    let showIndex = this.shows.findIndex(show => String(show._id) === String(showId));
    if (showIndex < 0) {
        return callback(new Error('There is no show with ID=' + showId + ' in this schedule.'));
    }
    this.removeShowsAndSave([showId], callback);
};

scheduleSchema = versioned(scheduleSchema);

module.exports = mongoose.model('Schedule', scheduleSchema);