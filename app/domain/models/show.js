"use strict";

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Theatre = require('./theatre');
const Scene = require('./scene');
const Play = require('./play');
const versioned = require('./plugins/show/versioned');
const modelHelper = require('helpers/model');

let showSchema = new Schema({
    play: {type: Schema.Types.ObjectId, ref: 'Play', required: true},
    theatre: {type: Schema.Types.ObjectId, ref: 'Theatre'},
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

showSchema.methods.updateHash = function() {
    if (this.customHash && this.hash) {
        return;
    }
    this.hash = calculateHash(modelHelper.getId(this.play), this.date);
};

showSchema.methods.hide = function() {
    this.hidden = true;
};

showSchema.methods.unhide = function() {
    this.hidden = false;
};

showSchema.methods.isPubliclyVisible = function() {
    if (!this.play instanceof Play) {
        this.populate('play');
    }
    return !this.hidden && !this.play.hidden;
};

function calculateHash(playId, date) {
    // I used md5 previously, but since play ID is already a hash and date ISO string has fixed length,
    // their concatenation fits for me. And it is more readable.
    return [date.toISOString(), String(playId)].join('-');
}

showSchema.plugin(versioned);

module.exports = mongoose.model('Show', showSchema);