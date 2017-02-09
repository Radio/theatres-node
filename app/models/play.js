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
    premiere: Boolean,
    musical: Boolean,
    dancing: Boolean,
    forKids: Boolean,
    tags: [String]
});
playSchema.set('toObject', { versionKey: false });

playSchema.statics.findByKey = function(key, callback) {
    return this.findOne({ key: key }, callback);
};
playSchema.statics.findByTag = function(tag, callback) {
    return this.findOne({ tags: tag }, callback);
};

playSchema.methods.addTag = function(tag) {
    if (this.tags.indexOf(tag) < 0) {
        this.tags.push(tag);
    }
};
playSchema.methods.addTags = function(tags) {
    tags.forEach(tag => this.addTag(tag));
};

playSchema.methods.absorbDuplicate = function(duplicate, callback) {
    this.addTags(duplicate.tags);
    this.save(function(err) {
        if (err) return callback(err);
        duplicate.remove(callback);
    });
};

playSchema.methods.edit = function(editRequest, callback) {

    const oldTitle = this.title;

    this.key = editRequest.key;
    this.title = editRequest.title;
    this.theatre = editRequest.theatre;
    this.scene = editRequest.scene;
    this.url = editRequest.url;
    this.director = editRequest.director;
    this.author = editRequest.author;
    this.genre = editRequest.genre;
    this.duration = editRequest.duration;
    this.description = editRequest.description;
    this.image = editRequest.image;
    this.premiere = editRequest.premiere;
    this.musical = editRequest.musical;
    this.dancing = editRequest.dancing;
    this.forKids = editRequest.forKids;
    this.tags = editRequest.tags;
    if (oldTitle !== editRequest.title) {
        this.addTags([oldTitle, editRequest.title]);
    }

    this.save(callback);
};


module.exports = mongoose.model('Play', playSchema);