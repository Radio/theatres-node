"use strict";

const mongoose = require('mongoose');
const Show = require('../../show');

module.exports = function(scheduleSchema, options) {

    scheduleSchema.add({
        version: Number,
        actual: Boolean
    });

    /**
     * Make a snapshot and save it to local variable.
     */
    scheduleSchema.post('init', function(doc) {
        if (!doc.actual) {
            return;
        }
        doc.snapshot = makeSnapshot(doc);
    });

    /**
     * Increment version if existing snapshot differs from new state.
     * Instruct post-save hook to create a revision if so.
     */
    scheduleSchema.pre('save', function(next) {
        const snapshot = this.snapshot;
        const snapshotIsEmpty = !snapshot || (snapshot.version === 1 && !snapshot.shows.length);
        if (snapshotIsEmpty) {
            return next();
        }
        const noChanges = scheduleEqualsToSnapshot(this, snapshot);
        if (noChanges) {
            return next();
        }
        this.createRevision = true;
        this.version++;
        next();
    });

    /**
     * Create a revision if snapshot is available and this.createRevision set to true.
     */
    scheduleSchema.post('save', function(doc) {
        if (!this.snapshot || !this.createRevision) {
            return;
        }
        this.constructor.createRevision(this.snapshot, function (err, revision) { /* nothing to do */ });
        delete this.createRevision;
        this.snapshot = makeSnapshot(doc);
    });

    /**
     * Find actual schedule by given month and year.
     *
     * @param {Number} month
     * @param {Number} year
     * @param {Function} callback
     * @return {Query|*}
     */
    scheduleSchema.statics.findByMonthAndYear = function(month, year, callback) {
        return this.findOne({ month: month, year: year, actual: true }, callback);
    };

    /**
     * Create actual schedule for given month and year.
     *
     * @param {Number} month
     * @param {Number} year
     *
     * @return {Object}
     */
    scheduleSchema.statics.createForMonthAndYear = function(month, year) {
        let schedule = parentCreateForMonthAndYear.call(this, month, year);
        schedule.version = 1;
        schedule.actual = true;
        return schedule;
    };
    const parentCreateForMonthAndYear = scheduleSchema.statics.createForMonthAndYear;

    /**
     * Update 'updated' field with current date if actual is true.
     */
    scheduleSchema.methods.updateUpdated = function() {
        if (this.actual) {
            this.updated = new Date();
        }
    };


    /**
     * Make plain object snapshot from the schedule.
     * Remove fields that are not relevant.
     *
     * @param {Object} schedule
     *
     * @return {Object}
     */
    function makeSnapshot(schedule) {
        return schedule.toObject({
            depopulate: true,
            virtuals: false,
            getters: false,
            versionKey: false,
            transform: function (doc, ret, options) {
                delete ret._id;
                if (ret.theatre) {
                    ret.theatre = String(ret.theatre);
                }
                if (ret.scene) {
                    ret.scene = String(ret.scene);
                }
                if (ret.play) {
                    ret.play = String(ret.play);
                }
            }
        });
    }

    /**
     * Compare given schedule with the snapshot.
     * Return TRUE if they are equal, FALSE otherwise.
     *
     * @param {Object} schedule
     * @param {Object} snapshot
     *
     * @return {Boolean}
     */
    function scheduleEqualsToSnapshot(schedule, snapshot) {
        const currentSnapshot = this.makeSnapshot(schedule);
        if (!snapshot.shows || !currentSnapshot.shows) {
            return false;
        }

        if (snapshot.shows.length !== currentSnapshot.shows.length) {
            return false;
        }

        const allShowsEqual = snapshot.shows.reduce(function (result, show) {
            if (!result) {
                return false;
            }
            const sameShowIndex = currentSnapshot.shows.findIndex(currentShow => Show.sameShows(show, currentShow));
            return sameShowIndex >= 0;
        }, true);
        if (!allShowsEqual) {
            return false;
        }

        return true;
    }

    /**
     * Create a non-actual schedule revision from a snapshot.
     *
     * @param {Object} snapshot
     * @param {Function} callback
     */
    function createRevision(snapshot, callback) {
        const Schedule = mongoose.model('Schedule');
        delete snapshot._id;
        snapshot.actual = false;
        let revision = new Schedule(snapshot);
        revision.save(function (err) {
            if (err) return callback(err);
            callback(null, revision);
        });
    }
};