"use strict";

let mongoose = require('mongoose');
let crypto = require('crypto');
let Schema = mongoose.Schema;
let Scene = require('./scene');
let Theatre = require('./theatre');
let Play = require('./play');

let showSchema = new Schema({
    play: {type: Schema.Types.ObjectId, ref: 'Play'},
    theatre: {type: Schema.Types.ObjectId, ref: 'Theatre'},
    scene: {type: Schema.Types.ObjectId, ref: 'Scene'},
    date: Date,
    hash: String,
    price: String,
    url: String,
    buyTicketUrl: String
});
showSchema.set('toObject', { versionKey: false });

showSchema.pre('save', function(next) {
    this.updateHash();
    next();
});

showSchema.methods.updateHash = function() {
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

    this.validate(callback);
};

function calculateHash(theatreId, playId, date) {
    return hash([String(theatreId), String(playId), date.toUTCString()].join('-'));
}

function hash(string) {
    return crypto.createHash('md5').update(string).digest("hex")
}

module.exports = mongoose.model('Show', showSchema);