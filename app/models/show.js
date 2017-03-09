"use strict";

let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let Scene = require('models/scene');
let Play = require('models/play');

let showSchema = new Schema({
    play: {type: Schema.Types.ObjectId, ref: 'Play', required: true},
    scene: {type: Schema.Types.ObjectId, ref: 'Scene'},
    date: {type: Date, required: true},
    hash: String,
    customHash: Boolean,
    price: String,
    url: String,
    buyTicketUrl: String,
    hidden: Boolean,
    manual: Boolean,
    labels: [String]
});
showSchema.set('toObject', { versionKey: false });

showSchema.pre('save', function(next) {
    this.updateHash();
    next();
});

/**
 * Compare two shows based on comparable properties.
 * @param {Object} show1
 * @param {Object} show2
 * @return {Boolean}
 */
showSchema.statics.equal = function(show1, show2) {
    return show1.play === show2.play &&
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

showSchema.methods.updateHash = function() {
    if (this.customHash && this.hash) {
        return;
    }
    this.hash = calculateHash(
        (this.play instanceof Play) ? this.play.id : String(this.play),
        this.date
    );
};

showSchema.methods.edit = function(editRequest, callback) {
    this.date = editRequest.date;
    this.scene = editRequest.scene;
    this.play = editRequest.play;
    this.price = editRequest.price;
    this.url = editRequest.url;
    this.buyTicketUrl = editRequest.buyTicketUrl;
    this.customHash = editRequest.customHash;
    if (this.customHash) {
        this.hash = editRequest.hash;
    }
    this.manual = editRequest.manual;
    this.hidden = editRequest.hidden;
    this.labels = editRequest.labels;

    this.validate(callback);
};

showSchema.methods.hide = function() {
    this.hidden = true;
};

showSchema.methods.unhide = function() {
    this.hidden = false;
};

showSchema.methods.isPubliclyVisible = function() {
    return !this.hidden;
};

function calculateHash(playId, date) {
    return hash([date.toISOString(), String(playId)].join('-'));
}

function hash(string) {
    // I used md5 previously, but since play ID is already a hash and date ISO string has fixed length
    // their concatenation fits for me. And it is more descriptive.
    return string;
}

module.exports = mongoose.model('Show', showSchema);