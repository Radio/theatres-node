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
            const sameShowIndex = currentSnapshot.shows.findIndex(function (currentShow) {
                return show.play === currentShow.play &&
                    show.theatre === currentShow.theatre &&
                    show.scene === currentShow.scene &&
                    show.date.getTime() === currentShow.date.getTime() &&
                    show.price === currentShow.price &&
                    show.buyTicketUrl === currentShow.buyTicketUrl;
            });
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
     * Updates the schedule with provided shows.
     * Remove existing shops if they are not listed in newShops.
     *
     * @param {[{play: Play, theatre: Theatre, scene: Scene, date: Date, price: String, buyTicketUrl: String}]} newShows
     * @param {Function} callback
     */
    scheduleSchema.methods.update = function(newShows, callback) {

        const previousVersion = versioning.makeSnapshot(this);

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
        this.saveIfHasChanges(previousVersion, callback);
    };

    /**
     * Update the schedule with new shows.
     * Do not remove existing shops if they are not listed in newShops.
     *
     * @param {[{play: Play, theatre: Theatre, scene: Scene, date: Date, price: String, buyTicketUrl: String}]} newShows
     * @param {Function} callback
     */
    scheduleSchema.methods.addOrUpdateShows = function(newShows, callback) {
        const previousVersion = versioning.makeSnapshot(this);

        newShows.forEach(newShow => this.addOrUpdateShow(newShow));
        this.sortShows();
        this.updated = new Date();
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
            this.save(callback);
            return;
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
    scheduleSchema.methods.createRevision = function (snapshot, callback) {
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