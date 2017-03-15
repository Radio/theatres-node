"use strict";

module.exports = function(showSchema, options) {
    /**
     * Compare two shows based on comparable properties.
     * @param {Object} show1
     * @param {Object} show2
     * @return {Boolean}
     */
    showSchema.statics.sameShows = function(show1, show2) {
        return show1.play === show2.play &&
            show1.theatre === show2.theatre &&
            show1.scene === show2.scene &&
            show1.date.getTime() === show2.date.getTime() &&
            show1.price === show2.price &&
            show1.buyTicketUrl === show2.buyTicketUrl &&
            show1.customHash === show2.customHash &&
            (!show1.customHash || (show1.hash === show2.hash)) &&
            show1.hidden === show2.hidden &&
            show1.manual === show2.manual &&
            show1.labels.join() === show2.labels.join();
    };
};