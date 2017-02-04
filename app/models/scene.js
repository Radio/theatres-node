"use strict";

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let sceneSchema = new Schema({
    key: { type: String, required: true },
    title: { type: String, required: true }
});
sceneSchema.set('toObject', { versionKey: false });

sceneSchema.statics.findByKey = function(key, callback) {
    return this.findOne({ key: key }, callback);
};

// todo: looks like 'update' is reserved.
sceneSchema.methods.update = function(updateRequest, callback) {
    this.title = updateRequest.title;
    this.key = updateRequest.key;

    this.save(callback);
};

module.exports = mongoose.model('Scene', sceneSchema);