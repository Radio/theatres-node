"use strict";

let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let Show = require('models/show');
let Play = require('models/play');
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
 * Update 'updated' property before saving the schedule.
 */
scheduleSchema.pre('save', function(next) {
    this.updateUpdated();
    next();
});

Play.schema.on('remove', function(play) {
    mongoose.model('Schedule').update(
        { },
        { $pull: { shows: { play: play._id } } },
        { multi: true }
    ).exec();
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
 * Retrieve labels from all shows in actual schedules.
 *
 * @param {Function} callback
 *
 * @return {Aggregate|Promise}
 */
scheduleSchema.statics.getActualLabels = function(callback) {
    return this.aggregate([
        { $match: { actual: true } },
        { $unwind: "$shows" },
        { $unwind: "$shows.labels" },
        { $project: { "label": "$shows.labels" } },
        { $group: { _id: 'all', labels: { $addToSet: '$label' } } }
    ], function(err, result) {
        if (err) return callback(err);
        if (!result || result.length === 0) {
            return callback(null, []);
        }
        callback(null, result[0].labels);
    });
};

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
    const today = new Date();
    let removalCandidates = this.shows.filter(show => !show.manual && show.date > today).map(show => show.hash);
    let schedule = this;
    let newHashes = newShowsData.map(function(newShowData) {
        const show = schedule.addOrUpdateOneShow(newShowData instanceof Show ? newShowData : new Show(newShowData));
        return show.hash;
    });
    let hashesToRemove =  removalCandidates.filter(hash => newHashes.indexOf(hash) < 0);
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
        if (show.url) {
            this.shows[sameHashIndex].url = show.url;
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
    if (showIndex < 0) {
        return callback(new Error('There is no show with ID=' + showId + ' in this schedule.'));
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

/**
 * Mark show as a duplicate of another show.
 *
 * @param {String} duplicateId
 * @param {String} originalId
 * @param {Function} callback
 */
scheduleSchema.methods.markShowAsDuplicate = function(duplicateId, originalId, callback) {
    let show = this.shows.find(show => String(show._id) === String(duplicateId));
    if (!show) {
        return callback(new Error('There is no show with ID=' + duplicateId + ' in this schedule.'));
    }
    show.markAsDuplicate(originalId);
    this.save(callback);
};

scheduleSchema = versioned(scheduleSchema);

module.exports = mongoose.model('Schedule', scheduleSchema);