"use strict";

let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let Scene = require('./scene');
let Theatre = require('./theatre');

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
playSchema.statics.findByTag = function(tag, theatreId, callback) {
    return this.findOne({ tags: tag.trim(), theatre: theatreId }, callback);
};
playSchema.statics.findByTheatre = function(theatreId, callback) {
    return this.find({ theatre: theatreId}, callback);
};

playSchema.methods.addTag = function(tag) {
    if (this.tags.indexOf(tag.trim()) < 0) {
        this.tags.push(tag.trim());
    }
};
playSchema.methods.addTags = function(tags) {
    tags.forEach(tag => this.addTag(tag));
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