"use strict";

let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let Scene = require('domain/models/scene');
let Theatre = require('domain/models/theatre');

let playSchema = new Schema({
    key: { type: String, required: true, unique: true },
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
    tags: [String],

    // flags
    premiere: Boolean,
    musical: Boolean,
    dancing: Boolean,
    forKids: Boolean,
    opera: Boolean,
    ballet: Boolean,

    // A link to another play, that should be used by play mapper.
    mapAs: { type: Schema.Types.ObjectId, ref: 'Play' },
    hidden: Boolean,
});
playSchema.set('toObject', { versionKey: false });

playSchema.post('remove', function() {
    playSchema.emit('remove', this);
});
playSchema.pre('save', function(next) {
    this.tags = this.tags.map(tag => tag.trim());
    next();
});

playSchema.statics.findByKey = function(key, callback) {
    return this.findOne({ key: key }, callback);
};
playSchema.statics.findByTag = function(tag, callback) {
    return this.findOne({ tags: tag.trim() }, callback);
};

playSchema.methods.addTag = function(tag) {
    if (this.tags.indexOf(tag.trim()) < 0) {
        this.tags.push(tag.trim());
    }
};
playSchema.methods.addTags = function(tags) {
    tags.forEach(tag => this.addTag(tag));
};

playSchema.methods.absorbDuplicate = function(duplicate, callback) {
    this.url = this.url || duplicate.url;
    this.director = this.director || duplicate.director;
    this.author = this.author || duplicate.author;
    this.genre = this.genre || duplicate.genre;
    this.duration = this.duration || duplicate.duration;
    this.description = this.description || duplicate.description;
    this.image = this.image || duplicate.image;
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
    this.opera = editRequest.opera;
    this.ballet = editRequest.ballet;
    this.mapAs = editRequest.mapAs;
    this.tags = editRequest.tags.map(tag => tag.trim());
    this.addTag(editRequest.title.trim());
    if (oldTitle && oldTitle !== editRequest.title) {
        this.addTag(oldTitle.trim());
    }
    if (typeof editRequest.hidden !== 'undefined') {
        this.hidden = editRequest.hidden;
    }

    this.save(callback);
};

playSchema.methods.hide = function(callback) {
    this.hidden = true;
    this.save(callback);
};

playSchema.methods.unhide = function(callback) {
    this.hidden = false;
    this.save(callback);
};

module.exports = mongoose.model('Play', playSchema);