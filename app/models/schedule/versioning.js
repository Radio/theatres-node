"use strict";

module.exports = {
    /**
     * Make plain object snapshot from the schedule.
     * Remove fields that are not relevant.
     *
     * @param {Schedule} schedule
     *
     * @return {Object}
     */
    makeSnapshot: function (schedule) {
        return schedule.toObject({
            depopulate: true,
            virtuals: false,
            getters: false,
            versionKey: false,
            transform: function(doc, ret, options) {
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
     * @param {Schedule} schedule
     * @param {Object} snapshot
     *
     * @return {Boolean}
     */
    compareWithSnapshot: function(schedule, snapshot) {
        const currentSnapshot = this.makeSnapshot(schedule);
        if (!snapshot.shows || !currentSnapshot.shows) {
            return false;
        }
        if (snapshot.shows.length !== currentSnapshot.shows.length) {
            return false;
        }
        const allShowsEqual = snapshot.shows.reduce(function(result, show) {
            if (!result) {
                return false;
            }
            const sameShowIndex = currentSnapshot.shows.findIndex(function(currentShow) {
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
    /**
     * Create revision from a snapshot.
     *
     * @param {Object} snapshot
     * @param {Function} constructor
     * @param {Function} callback
     */
    createRevision: function(snapshot, constructor, callback) {
        delete snapshot._id;
        snapshot.actual = false;
        let revision = new constructor(snapshot);
        revision.save(function(err) {
            if (err) return callback(err);
            callback(null, revision);
        });
    }
};