"use strict";

let Show = require('models/show');

let versioning = {
    /**
     * Make plain object snapshot from the schedule.
     * Remove fields that are not relevant.
     *
     * @param {Object} schedule
     *
     * @return {Object}
     */
    makeSnapshot: function (schedule) {
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
    },
    /**
     * Compare given schedule with the snapshot.
     * Return TRUE if they are equal, FALSE otherwise.
     *
     * @param {Object} schedule
     * @param {Object} snapshot
     *
     * @return {Boolean}
     */
    compareWithSnapshot: function (schedule, snapshot) {
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
            const sameShowIndex = currentSnapshot.shows.findIndex(currentShow => Show.equal(show, currentShow));
            return sameShowIndex >= 0;
        }, true);

        return allShowsEqual;
    },
};

let versioned = function(scheduleSchema) {

    scheduleSchema.add({
        version: Number,
        actual: Boolean
    });

    scheduleSchema.statics.findByMonthAndYear = function(month, year, callback) {
        return this.findOne({ month: month, year: year, actual: true }, callback);
    };

    const parentCreateForMonthAndYear = scheduleSchema.statics.createForMonthAndYear;
    scheduleSchema.statics.createForMonthAndYear = function(month, year) {
        let schedule = parentCreateForMonthAndYear.call(this, month, year);
        schedule.version = 1;
        schedule.actual = true;
        return schedule;
    };

    /**
     * Update 'updated' field with current date if actual is true.
     */
    scheduleSchema.methods.updateUpdated = function() {
        if (this.actual) {
            this.updated = new Date();
        }
    };

    /**
     * Updates the schedule with provided shows.
     * Remove existing shops if they are not listed in newShops.
     * Save the schedule if shows were changed.
     *
     * @param {[Object]} newShowsData
     * @param {Function} callback
     */
    scheduleSchema.methods.replaceShowsAndSave = function(newShowsData, callback) {
        const previousVersion = versioning.makeSnapshot(this);
        this.replaceShows(newShowsData);
        this.saveIfHasChanges(previousVersion, callback);
    };

    /**
     * Update the schedule with new shows.
     * Do not remove existing shops if they are not listed in newShops.
     * Save the schedule if shows were changed.
     *
     * @param {[Object]} newShowsData
     * @param {Function} callback
     */
    scheduleSchema.methods.addOrUpdateShowsAndSave = function(newShowsData, callback) {
        const previousVersion = versioning.makeSnapshot(this);
        this.addOrUpdateShows(newShowsData);
        this.saveIfHasChanges(previousVersion, callback);
    };

    /**
     * Remove shows by ids.
     * Save the schedule.
     *
     * @param {[String]} showsIds
     * @param {Function} callback
     */
    scheduleSchema.methods.removeShowsAndSave = function(showsIds, callback) {
        const previousVersion = versioning.makeSnapshot(this);
        this.removeShows(showsIds);
        this.saveIfHasChanges(previousVersion, callback);
    };

    /**
     * Compare the shows with previous snapshot and save the schedule if there are any relevant changes.
     * Create a revision from the snapshot in this case.
     *
     * @param {Object} previousVersion
     * @param {Function} callback
     */
    scheduleSchema.methods.saveIfHasChanges = function(previousVersion, callback) {
        let previousSnapshotIsEmpty = previousVersion.version === 1 && !previousVersion.shows.length;
        if (previousSnapshotIsEmpty) {
            return this.save(callback);
        }
        let hasChanges = !versioning.compareWithSnapshot(this, previousVersion);
        if (hasChanges) {
            const Schedule = this.constructor;
            this.version++;
            this.save(function (err) {
                if (err) return callback(err);
                Schedule.createRevision(previousVersion, function (err, revision) {
                    if (err) return callback(err);
                    callback();
                });
            });
            return;
        }
        callback();
    };

    /**
     * Create revision from a snapshot.
     *
     * @param {Object} snapshot
     * @param {Function} callback
     */
    scheduleSchema.statics.createRevision = function (snapshot, callback) {
        delete snapshot._id;
        snapshot.actual = false;
        let revision = new this(snapshot);
        revision.save(function (err) {
            if (err) return callback(err);
            callback(null, revision);
        });
    };

    return scheduleSchema;
};

module.exports = versioned;