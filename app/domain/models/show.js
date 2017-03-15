"use strict";

let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let Theatre = require('domain/models/theatre');
let Scene = require('domain/models/scene');
let Play = require('domain/models/play');
let versioned = require('domain/models/plugins/show/versioned');

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
    this.hash = calculateHash(
        (this.play instanceof Play) ? this.play.id : String(this.play),
        this.date
    );
};

showSchema.methods.edit = function(editRequest, callback) {
    // todo: move to command
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
    if (typeof editRequest.hidden !== 'undefined') {
        this.hidden = editRequest.hidden;
    }
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