"use strict";

let mongoose = require('mongoose');
// let crypto = require('crypto');
let Schema = mongoose.Schema;
let Scene = require('models/scene');
let Theatre = require('models/theatre');
let Play = require('models/play');

let showSchema = new Schema({
    play: {type: Schema.Types.ObjectId, ref: 'Play', required: true},
    theatre: {type: Schema.Types.ObjectId, ref: 'Theatre', required: true},
    scene: {type: Schema.Types.ObjectId, ref: 'Scene'},
    date: {type: Date, required: true},
    hash: String,
    customHash: Boolean,
    price: String,
    url: String,
    buyTicketUrl: String,
    duplicateOf: Schema.Types.ObjectId,
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
        show1.theatre === show2.theatre &&
        show1.scene === show2.scene &&
        show1.date.getTime() === show2.date.getTime() &&
        show1.price === show2.price &&
        show1.buyTicketUrl === show2.buyTicketUrl &&
        show1.customHash === show2.customHash &&
        (!show1.customHash || (show1.hash === show2.hash)) &&
        show1.manual === show2.manual &&
        show1.labels.join() === show2.labels.join();
};

showSchema.methods.updateHash = function() {
    if (this.customHash && this.hash) {
        return;
    }
    this.hash = calculateHash(
        (this.theatre instanceof Theatre) ? this.theatre.id : String(this.theatre),
        (this.play instanceof Play) ? this.play.id : String(this.play),
        this.date
    );
};

showSchema.methods.edit = function(editRequest, callback) {
    this.date = editRequest.date;
    this.theatre = editRequest.theatre;
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
    this.labels = editRequest.labels;

    this.validate(callback);
};

showSchema.methods.markAsDuplicate = function(originalId) {
    this.duplicateOf = originalId;
};

showSchema.methods.isPubliclyVisible = function() {
    return !this.duplicateOf;
};

function calculateHash(theatreId, playId, date) {
    return hash([date.toISOString(), String(playId), String(theatreId)].join('-'));
}

function hash(string) {
    return string;
    // return crypto.createHash('md5').update(string).digest("hex")
}

module.exports = mongoose.model('Show', showSchema);