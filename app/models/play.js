"use strict";

let mongoose = require('mongoose');
let modelHelper = require('helpers/model');
let Schema = mongoose.Schema;
let Scene = require('./scene');
let Theatre = require('./theatre');

let playSchema = new Schema({
    key: { type: String, required: true },
    // title: {type: String, set: setTitle },
    title: { type: String, required: true },
    theatre: { type: Schema.Types.ObjectId, ref: 'Theatre', required: true },
    scene: { type: Schema.Types.ObjectId, ref: 'Scene', required: true },
    url: String,
    director: String,
    author: String,
    genre: String,
    duration: String,
    description: String,
    image: String,
    tags: [String]
});
playSchema.set('toObject', { versionKey: false });

playSchema.statics.findByTag = function(tag, callback) {
    return this.findOne({ tags: tag }, callback);
};

playSchema.methods.addTags = function(tags) {
    this.tags = [...this.tags, ...tags];
};

playSchema.methods.absorbDuplicate = function(duplicate, callback) {
    this.addTags(duplicate.tags);
    this.save(function(err) {
        if (err) return callback(err);
        duplicate.remove(callback);
    });
};


module.exports = mongoose.model('Play', playSchema);