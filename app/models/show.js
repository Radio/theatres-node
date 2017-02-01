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
    price: String
});
showSchema.set('toObject', { versionKey: false });

showSchema.pre('save', function(next) {
    this.hash = this.generateHash();
    next();
});

showSchema.statics.findByHash = function(hash, callback) {
    return this.findOne({ hash: hash }, callback);
};

showSchema.statics.replacePlay = function(oldPlay, newPlay, callback) {
    this.update({ play: oldPlay.id }, { play: newPlay.id }, { multi: true }, callback);
};

showSchema.methods.generateHash = function() {
    return hash([this.theatre, this.play, this.scene, this.date.toString()].join('-'));
};

function hash(string) {
    return crypto.createHash('md5').update(string).digest("hex")
}

module.exports = mongoose.model('Show', showSchema);